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
  const jarBin = findExecutable("jar", [path.join(javaHome, "bin", "jar")]);

  // Locate build-tools directory (e.g., 34.0.0 or android-14)
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

  const androidJarCandidates = [
    ...androidHomeCandidates.map((sdkRoot) =>
      path.join(sdkRoot, "platforms", "android-34", "android.jar")
    ),
    "/tmp/android-tools/platforms/android-34/android.jar",
  ];
  const androidJar = androidJarCandidates.find((p) => fs.existsSync(p));
  if (!androidJar) {
    throw new Error(
      `android-34/android.jar not found. Checked: ${androidJarCandidates.join(", ")}`
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
      "23",
      "--target-sdk-version",
      "34",
      "--version-code",
      "100",
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
      "23",
      "--lib",
      androidJar,
      "--output",
      dexOutDir,
      ...classFiles,
    ],
    { env: envWithJava, stdio: "inherit" }
  );

  console.log("=== [7/8] Packaging uncompressed classes.dex & aligning APK (zipalign -p 4) ===");
  fs.copyFileSync(path.join(dexOutDir, "classes.dex"), path.join(stageDir, "classes.dex"));
  execFileSync(jarBin, ["u0f", linkedBaseApk, "-C", stageDir, "classes.dex"], {
    env: envWithJava,
    stdio: "inherit",
  });

  const alignedApk = path.join(workDir, "base-aligned.apk");
  execFileSync(zipalignBin, ["-p", "-f", "4", linkedBaseApk, alignedApk], {
    env: envWithJava,
    stdio: "inherit",
  });

  console.log("=== [8/8] Signing APK with V1 + V2 + V3 schemes & Verifying ===");
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

  // Verify alignment, signature, and badging
  execFileSync(zipalignBin, ["-c", "-p", "4", finalApkPath], {
    env: envWithJava,
    stdio: "inherit",
  });
  execFileSync(apksignerBin, ["verify", "--verbose", "--print-certs", finalApkPath], {
    env: envWithJava,
    stdio: "inherit",
  });
  const badging = execFileSync(aapt2Bin, ["dump", "badging", finalApkPath], {
    env: envWithJava,
    encoding: "utf8",
  });
  console.log("--- aapt2 dump badging ---");
  console.log(badging.split("\n").slice(0, 12).join("\n"));

  const stats = fs.statSync(finalApkPath);
  console.log(`=== SUCCESS: Verified APK generated at ${finalApkPath} (${stats.size} bytes) ===`);
}

main();
