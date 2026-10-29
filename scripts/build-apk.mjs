#!/usr/bin/env node
// Native Android APK Build, Asset Sync & Verification Pipeline for Phrase juste (v1.0.0)
// 1. Builds the production web bundle (`vite build`) into `dist/`.
// 2. Synchronizes `dist/` and Capacitor configuration into `android/app/src/main/assets/`.
// 3. Prepares Android resources (`res/values/strings.xml`, `res/mipmap-*/ic_launcher.png`).
// 4. Compiles Android resources & binary AXML AndroidManifest.xml using aapt2.
// 5. Compiles MainActivity.java and R.java with javac against android-34/android.jar.
// 6. Converts compiled Java bytecode into Dalvik classes.dex using d8 --release --min-api 23.
// 7. Packages uncompressed classes.dex and bundled web assets (assets/www/) into the APK.
// 8. Aligns uncompressed resources.arsc and native boundaries with zipalign -p -f 4.
// 9. Signs the APK with apksigner using APK Signature Scheme v1 + v2 + v3 (persistent secret or local keystore).
// 10. Verifies the final APK using apksigner verify, aapt2 dump badging, and zipalign -c -p 4.

import { execFileSync, execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

function findExecutable(name, fallbackPaths = []) {
  for (const candidate of fallbackPaths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  try {
    return execSync(`which ${name}`, { encoding: "utf8" }).trim();
  } catch {
    throw new Error(`Required build tool '${name}' not found in PATH or fallback locations.`);
  }
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "releases") continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function collectFilesRelative(baseDir, currentDir = baseDir) {
  let results = [];
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const full = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(collectFilesRelative(baseDir, full));
    } else {
      results.push(path.relative(baseDir, full));
    }
  }
  return results;
}

function syncCapacitorAndroidAssets() {
  const distDir = path.join(ROOT_DIR, "dist");
  if (!fs.existsSync(distDir)) {
    throw new Error("Web build directory 'dist/' does not exist. Run 'npm run build' first.");
  }

  const androidAssetsDir = path.join(ROOT_DIR, "android", "app", "src", "main", "assets");
  fs.rmSync(androidAssetsDir, { recursive: true, force: true });

  const wwwDir = path.join(androidAssetsDir, "www");
  const publicDir = path.join(androidAssetsDir, "public");
  copyDirRecursive(distDir, wwwDir);
  copyDirRecursive(distDir, publicDir);

  const capacitorConfigJson = {
    appId: "app.phrasejuste.mobile",
    appName: "Phrase juste",
    webDir: "dist",
    bundledWebRuntime: false,
    server: {
      androidScheme: "https",
      hostname: "appassets.androidplatform.net",
    },
  };
  fs.writeFileSync(
    path.join(androidAssetsDir, "capacitor.config.json"),
    JSON.stringify(capacitorConfigJson, null, 2),
    "utf8"
  );
  console.log(`Synchronized web assets from dist/ to ${androidAssetsDir}`);
}

function resolveSigningCredentials(keytoolBin, envWithJava) {
  const keyAlias = process.env.ANDROID_KEY_ALIAS || "phrasejuste";

  // 1. If ANDROID_KEYSTORE_BASE64 is provided (e.g., via GitHub Actions Secrets), decode it to /tmp
  if (process.env.ANDROID_KEYSTORE_BASE64 && process.env.ANDROID_KEYSTORE_PASSWORD) {
    const decodedKeystorePath = "/tmp/phrase-juste-ci-release.jks";
    const cleanBase64 = process.env.ANDROID_KEYSTORE_BASE64.replace(/\s+/g, "");
    fs.writeFileSync(decodedKeystorePath, Buffer.from(cleanBase64, "base64"));
    const keystorePass = process.env.ANDROID_KEYSTORE_PASSWORD;
    const keyPass = process.env.ANDROID_KEY_PASSWORD || keystorePass;
    return { keystorePath: decodedKeystorePath, keystorePass, keyAlias, keyPass };
  }

  // 2. If ANDROID_KEYSTORE_PATH is explicitly configured with ANDROID_KEYSTORE_PASSWORD
  if (
    process.env.ANDROID_KEYSTORE_PATH &&
    fs.existsSync(process.env.ANDROID_KEYSTORE_PATH) &&
    process.env.ANDROID_KEYSTORE_PASSWORD
  ) {
    const keystorePass = process.env.ANDROID_KEYSTORE_PASSWORD;
    const keyPass = process.env.ANDROID_KEY_PASSWORD || keystorePass;
    return {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystorePass,
      keyAlias,
      keyPass,
    };
  }

  // 3. Persistent local keystore outside the Git repository (/tmp/android-tools/)
  // Uses a randomly generated 256-bit secret stored only in /tmp/android-tools/phrase-juste-keystore.pass
  const localToolsDir = "/tmp/android-tools";
  fs.mkdirSync(localToolsDir, { recursive: true });
  const localKeystorePath = path.join(localToolsDir, "phrase-juste-release-v1.jks");
  const localPassFile = path.join(localToolsDir, "phrase-juste-keystore.pass");

  let keystorePass = process.env.ANDROID_KEYSTORE_PASSWORD || "";
  if (!keystorePass) {
    if (fs.existsSync(localPassFile)) {
      keystorePass = fs.readFileSync(localPassFile, "utf8").trim();
    } else {
      keystorePass = crypto.randomBytes(24).toString("hex");
      fs.writeFileSync(localPassFile, keystorePass, { mode: 0o600 });
    }
  }
  const keyPass = process.env.ANDROID_KEY_PASSWORD || keystorePass;

  if (!fs.existsSync(localKeystorePath)) {
    execFileSync(
      keytoolBin,
      [
        "-genkeypair",
        "-v",
        "-keystore",
        localKeystorePath,
        "-storetype",
        "PKCS12",
        "-alias",
        keyAlias,
        "-keyalg",
        "RSA",
        "-keysize",
        "2048",
        "-validity",
        "10000",
        "-storepass",
        keystorePass,
        "-keypass",
        keyPass,
        "-dname",
        "CN=Phrase juste, OU=Mobile Learning, O=Phrase juste, L=Paris, ST=IDF, C=FR",
      ],
      { env: envWithJava, stdio: "inherit" }
    );
  }

  return { keystorePath: localKeystorePath, keystorePass, keyAlias, keyPass };
}

function main() {
  const syncOnly = process.argv.includes("--sync-only");

  console.log("=== [1/8] Building Phrase juste production web assets ===");
  const publicReleasesDir = path.join(ROOT_DIR, "public", "releases");
  if (fs.existsSync(publicReleasesDir)) {
    fs.rmSync(publicReleasesDir, { recursive: true, force: true });
  }
  execSync("npx vite build", { cwd: ROOT_DIR, stdio: "inherit" });

  console.log("=== [2/8] Synchronizing web assets with Android project ===");
  syncCapacitorAndroidAssets();
  if (syncOnly) {
    console.log("=== Capacitor Android asset synchronization complete ===");
    return;
  }

  // Locate JDK and Android SDK tools (supports both GitHub Actions ANDROID_HOME and local /tmp/android-tools)
  const androidHomeCandidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    "/tmp/android-tools",
    "/usr/local/lib/android/sdk",
  ].filter(Boolean);

  const androidHome =
    androidHomeCandidates.find((dir) => fs.existsSync(dir)) || "/tmp/android-tools";
  const javaHome =
    process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)
      ? process.env.JAVA_HOME
      : "/tmp/android-tools/jdk";

  const javacBin = findExecutable("javac", [path.join(javaHome, "bin", "javac")]);
  const keytoolBin = findExecutable("keytool", [path.join(javaHome, "bin", "keytool")]);

  // Locate build-tools directory (e.g., 36.0.0, 35.0.0, 34.0.0, or android-14)
  let buildToolsDir = "";
  for (const sdkRoot of androidHomeCandidates) {
    const btBase = path.join(sdkRoot, "build-tools");
    if (fs.existsSync(btBase)) {
      const subdirs = fs
        .readdirSync(btBase)
        .filter((d) => fs.existsSync(path.join(btBase, d, "aapt2")))
        .sort()
        .reverse();
      if (subdirs.length > 0) {
        buildToolsDir = path.join(btBase, subdirs[0]);
        break;
      }
    }
  }

  const aapt2Bin = findExecutable("aapt2", [path.join(buildToolsDir, "aapt2")]);
  const d8Bin = findExecutable("d8", [path.join(buildToolsDir, "d8")]);
  const zipalignBin = findExecutable("zipalign", [path.join(buildToolsDir, "zipalign")]);
  const apksignerBin = findExecutable("apksigner", [path.join(buildToolsDir, "apksigner")]);

  const platformVersions = ["android-36", "android-35", "android-34"];
  const androidJarCandidates = [
    ...androidHomeCandidates.flatMap((sdkRoot) =>
      platformVersions.map((ver) => path.join(sdkRoot, "platforms", ver, "android.jar"))
    ),
    "/tmp/android-tools/platforms/android-34/android.jar",
  ];
  const androidJar = androidJarCandidates.find((p) => fs.existsSync(p));
  if (!androidJar) {
    throw new Error(
      `android.jar not found. Checked: ${androidJarCandidates.join(", ")}`
    );
  }

  const envWithJava = {
    ...process.env,
    JAVA_HOME: fs.existsSync(javaHome) ? javaHome : process.env.JAVA_HOME,
    PATH: `${path.dirname(javacBin)}:${buildToolsDir}:${process.env.PATH}`,
  };

  const workDir = "/tmp/phrase-juste-apk-build";
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });

  console.log("=== [3/8] Preparing Android resources & launcher icons ===");
  const resSrcDir = path.join(ROOT_DIR, "android", "app", "src", "main", "res");
  const mipmapDirs = [
    "mipmap-mdpi",
    "mipmap-hdpi",
    "mipmap-xhdpi",
    "mipmap-xxhdpi",
    "mipmap-xxxhdpi",
  ];
  const icon192 = path.join(ROOT_DIR, "public", "pwa-192x192.png");
  const icon512 = path.join(ROOT_DIR, "public", "pwa-512x512.png");

  for (const dirName of mipmapDirs) {
    const targetDir = path.join(resSrcDir, dirName);
    fs.mkdirSync(targetDir, { recursive: true });
    const srcIcon =
      dirName.includes("xxxhdpi") || dirName.includes("xxhdpi") ? icon512 : icon192;
    fs.copyFileSync(srcIcon, path.join(targetDir, "ic_launcher.png"));
  }

  console.log("=== [4/8] Compiling resources & binary AXML AndroidManifest.xml with aapt2 ===");
  const compiledResZip = path.join(workDir, "compiled_res.zip");
  execFileSync(aapt2Bin, ["compile", "--dir", resSrcDir, "-o", compiledResZip], {
    env: envWithJava,
    stdio: "inherit",
  });

  const manifestXml = path.join(ROOT_DIR, "android", "app", "src", "main", "AndroidManifest.xml");
  const linkedBaseApk = path.join(workDir, "base-unaligned.apk");
  const genJavaDir = path.join(workDir, "gen");
  fs.mkdirSync(genJavaDir, { recursive: true });

  const stageDir = path.join(workDir, "stage");
  const assetsDir = path.join(stageDir, "assets");
  const assetsWwwDir = path.join(assetsDir, "www");
  copyDirRecursive(path.join(ROOT_DIR, "dist"), assetsWwwDir);

  execFileSync(
    aapt2Bin,
    [
      "link",
      "-o",
      linkedBaseApk,
      "-I",
      androidJar,
      "--manifest",
      manifestXml,
      "-A",
      assetsDir,
      "--java",
      genJavaDir,
      "--min-sdk-version",
      "24",
      "--target-sdk-version",
      "36",
      "--version-code",
      "101",
      "--version-name",
      "1.0.0",
      "--auto-add-overlay",
      compiledResZip,
    ],
    { env: envWithJava, stdio: "inherit" }
  );

  console.log("=== [5/8] Compiling MainActivity.java & R.java with javac ===");
  const classesDir = path.join(workDir, "classes");
  fs.mkdirSync(classesDir, { recursive: true });

  const mainActivityJava = path.join(
    ROOT_DIR,
    "android",
    "app",
    "src",
    "main",
    "java",
    "app",
    "phrasejuste",
    "mobile",
    "MainActivity.java"
  );
  const rJava = path.join(genJavaDir, "app", "phrasejuste", "mobile", "R.java");

  execFileSync(
    javacBin,
    [
      "-source",
      "1.8",
      "-target",
      "1.8",
      "-encoding",
      "UTF-8",
      "-bootclasspath",
      androidJar,
      "-classpath",
      androidJar,
      "-d",
      classesDir,
      rJava,
      mainActivityJava,
    ],
    { env: envWithJava, stdio: "inherit" }
  );

  console.log("=== [6/8] Converting Java bytecode to Dalvik classes.dex with d8 ===");
  const dexOutDir = path.join(workDir, "dex");
  fs.mkdirSync(dexOutDir, { recursive: true });

  const classFiles = collectFilesRelative(classesDir)
    .filter((f) => f.endsWith(".class"))
    .map((f) => path.join(classesDir, f));

  execFileSync(
    d8Bin,
    [
      "--release",
      "--min-api",
      "24",
      "--lib",
      androidJar,
      "--output",
      dexOutDir,
      ...classFiles,
    ],
    { env: envWithJava, stdio: "inherit" }
  );

  console.log("=== [7/8] Packaging uncompressed classes.dex (zero Data Descriptors) & aligning APK ===");
  const dexBuffer = fs.readFileSync(path.join(dexOutDir, "classes.dex"));
  appendStoredEntryToZip(linkedBaseApk, "classes.dex", dexBuffer);

  const alignedApk = path.join(workDir, "base-aligned.apk");
  execFileSync(zipalignBin, ["-p", "-f", "4", linkedBaseApk, alignedApk], {
    env: envWithJava,
    stdio: "inherit",
  });

  console.log("=== [8/8] Signing APK with V1 + V2 + V3 schemes & Verifying for Android 16 (API 36) ===");
  const { keystorePath, keystorePass, keyAlias, keyPass } = resolveSigningCredentials(
    keytoolBin,
    envWithJava
  );

  const releasesDir = path.join(ROOT_DIR, "releases");
  fs.mkdirSync(releasesDir, { recursive: true });
  const finalApkPath = path.join(releasesDir, "Phrase-juste-v1.0.0.apk");

  execFileSync(
    apksignerBin,
    [
      "sign",
      "--ks",
      keystorePath,
      "--ks-key-alias",
      keyAlias,
      "--ks-pass",
      `pass:${keystorePass}`,
      "--key-pass",
      `pass:${keyPass}`,
      "--v1-signing-enabled",
      "true",
      "--v2-signing-enabled",
      "true",
      "--v3-signing-enabled",
      "true",
      "--out",
      finalApkPath,
      alignedApk,
    ],
    { env: envWithJava, stdio: "inherit" }
  );

  // Verify alignment, signature, badging, and zero ZIP Data Descriptors (required by Android 16 libziparchive)
  execFileSync(zipalignBin, ["-c", "-p", "4", finalApkPath], {
    env: envWithJava,
    stdio: "inherit",
  });
  execFileSync(apksignerBin, ["verify", "--verbose", "--print-certs", finalApkPath], {
    env: envWithJava,
    stdio: "inherit",
  });
  verifyZeroDataDescriptors(finalApkPath);
  const badging = execFileSync(aapt2Bin, ["dump", "badging", finalApkPath], {
    env: envWithJava,
    encoding: "utf8",
  });
  console.log("--- aapt2 dump badging ---");
  console.log(badging.split("\n").slice(0, 12).join("\n"));

  const stats = fs.statSync(finalApkPath);
  console.log(`=== SUCCESS: Verified APK generated at ${finalApkPath} (${stats.size} bytes) ===`);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function computeCrc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function appendStoredEntryToZip(zipPath, entryName, fileData) {
  const buf = fs.readFileSync(zipPath);
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error(`Invalid ZIP archive (EOCD not found): ${zipPath}`);
  }

  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdSize = buf.readUInt32LE(eocdOffset + 12);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);

  const beforeCd = buf.subarray(0, cdOffset);
  const oldCd = buf.subarray(cdOffset, cdOffset + cdSize);

  const nameBuf = Buffer.from(entryName, "utf8");
  const fileCrc = computeCrc32(fileData);
  const localHeaderOffset = beforeCd.length;

  const lfh = Buffer.alloc(30 + nameBuf.length);
  lfh.writeUInt32LE(0x04034b50, 0);
  lfh.writeUInt16LE(10, 4);
  lfh.writeUInt16LE(0, 6); // flags = 0 (strictly no GPBF_DATA_DESCRIPTOR)
  lfh.writeUInt16LE(0, 8); // method = 0 (STORED)
  lfh.writeUInt16LE(0, 10);
  lfh.writeUInt16LE(0x0021, 12);
  lfh.writeUInt32LE(fileCrc, 14);
  lfh.writeUInt32LE(fileData.length, 18);
  lfh.writeUInt32LE(fileData.length, 22);
  lfh.writeUInt16LE(nameBuf.length, 26);
  lfh.writeUInt16LE(0, 28);
  nameBuf.copy(lfh, 30);

  const cdh = Buffer.alloc(46 + nameBuf.length);
  cdh.writeUInt32LE(0x02014b50, 0);
  cdh.writeUInt16LE(20, 4);
  cdh.writeUInt16LE(10, 6);
  cdh.writeUInt16LE(0, 8); // flags = 0
  cdh.writeUInt16LE(0, 10); // method = 0 (STORED)
  cdh.writeUInt16LE(0, 12);
  cdh.writeUInt16LE(0x0021, 14);
  cdh.writeUInt32LE(fileCrc, 16);
  cdh.writeUInt32LE(fileData.length, 20);
  cdh.writeUInt32LE(fileData.length, 24);
  cdh.writeUInt16LE(nameBuf.length, 28);
  cdh.writeUInt16LE(0, 30);
  cdh.writeUInt16LE(0, 32);
  cdh.writeUInt16LE(0, 34);
  cdh.writeUInt16LE(0, 36);
  cdh.writeUInt32LE(0, 38);
  cdh.writeUInt32LE(localHeaderOffset, 42);
  nameBuf.copy(cdh, 46);

  const newCdOffset = localHeaderOffset + lfh.length + fileData.length;
  const newCdSize = oldCd.length + cdh.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(totalEntries + 1, 8);
  eocd.writeUInt16LE(totalEntries + 1, 10);
  eocd.writeUInt32LE(newCdSize, 12);
  eocd.writeUInt32LE(newCdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  fs.writeFileSync(zipPath, Buffer.concat([beforeCd, lfh, fileData, oldCd, cdh, eocd]));
}

function verifyZeroDataDescriptors(apkPath) {
  const buf = fs.readFileSync(apkPath);
  let offset = 0;
  let entryCount = 0;
  while (offset < buf.length - 4) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const flags = buf.readUInt16LE(offset + 6);
    const method = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    const dataOffset = offset + 30 + nameLen + extraLen;
    if ((flags & 0x08) !== 0) {
      throw new Error(
        `APK entry '${name}' has forbidden GPBF_DATA_DESCRIPTOR (flags=0x${flags.toString(16)})`
      );
    }
    if (method === 0 && dataOffset % 4 !== 0) {
      throw new Error(
        `Uncompressed APK entry '${name}' is not 4-byte aligned (offset=${dataOffset})`
      );
    }
    entryCount++;
    offset = dataOffset + compSize;
  }
  console.log(
    `Verified ${entryCount} APK ZIP entries: 0 Data Descriptors, all STORED entries 4-byte aligned.`
  );
}

main();
