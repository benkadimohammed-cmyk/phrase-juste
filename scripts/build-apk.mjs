#!/usr/bin/env node
// Native Android APK Build & Verification Pipeline for Phrase juste (v1.0.0)
// 1. Builds the production web bundle (`vite build`) into `dist/`.
// 2. Prepares Android resources (`res/values/strings.xml`, `res/mipmap-*/ic_launcher.png`).
// 3. Compiles Android resources & binary AXML AndroidManifest.xml using aapt2.
// 4. Compiles MainActivity.java and R.java with javac against android-34/android.jar.
// 5. Converts compiled Java bytecode into Dalvik classes.dex using d8 --release --min-api 26.
// 6. Packages classes.dex and bundled web assets (assets/www/) into the APK.
// 7. Aligns uncompressed resources.arsc and native boundaries with zipalign -p -f 4.
// 8. Signs the APK with apksigner using APK Signature Scheme v1 + v2 + v3.
// 9. Verifies the final APK using apksigner verify, aapt2 dump badging, and zipalign -c -p 4.

import { execFileSync, execSync } from "node:child_process";
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

function main() {
  console.log("=== [1/8] Building Phrase juste production web assets ===");
  // Ensure no stale APK exists in public/releases
  const publicReleasesDir = path.join(ROOT_DIR, "public", "releases");
  if (fs.existsSync(publicReleasesDir)) {
    fs.rmSync(publicReleasesDir, { recursive: true, force: true });
  }
  execSync("npx vite build", { cwd: ROOT_DIR, stdio: "inherit" });

  // Locate JDK and Android SDK tools (works both in CI with ANDROID_HOME and locally in /tmp/android-tools)
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || "/tmp/android-tools";
  const javaHome = process.env.JAVA_HOME || "/tmp/android-tools/jdk";

  const javacBin = findExecutable("javac", [path.join(javaHome, "bin", "javac")]);
  const keytoolBin = findExecutable("keytool", [path.join(javaHome, "bin", "keytool")]);
  const jarBin = findExecutable("jar", [path.join(javaHome, "bin", "jar")]);

  // Locate build-tools directory (e.g., 34.0.0 or android-14)
  let buildToolsDir = "";
  const btBase = path.join(androidHome, "build-tools");
  if (fs.existsSync(btBase)) {
    const subdirs = fs.readdirSync(btBase).sort().reverse();
    if (subdirs.length > 0) {
      buildToolsDir = path.join(btBase, subdirs[0]);
    }
  }

  const aapt2Bin = findExecutable("aapt2", [path.join(buildToolsDir, "aapt2")]);
  const d8Bin = findExecutable("d8", [path.join(buildToolsDir, "d8")]);
  const zipalignBin = findExecutable("zipalign", [path.join(buildToolsDir, "zipalign")]);
  const apksignerBin = findExecutable("apksigner", [path.join(buildToolsDir, "apksigner")]);

  const androidJarCandidates = [
    path.join(androidHome, "platforms", "android-34", "android.jar"),
    "/tmp/android-tools/platforms/android-34/android.jar",
  ];
  const androidJar = androidJarCandidates.find((p) => fs.existsSync(p));
  if (!androidJar) {
    throw new Error("android-34/android.jar not found.");
  }

  const envWithJava = {
    ...process.env,
    JAVA_HOME: fs.existsSync(javaHome) ? javaHome : process.env.JAVA_HOME,
    PATH: `${path.dirname(javacBin)}:${buildToolsDir}:${process.env.PATH}`,
  };

  const workDir = "/tmp/phrase-juste-apk-build";
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });

  console.log("=== [2/8] Preparing Android resources & launcher icons ===");
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
    const srcIcon = dirName.includes("xxxhdpi") || dirName.includes("xxhdpi") ? icon512 : icon192;
    fs.copyFileSync(srcIcon, path.join(targetDir, "ic_launcher.png"));
  }

  console.log("=== [3/8] Compiling resources & binary AXML AndroidManifest.xml with aapt2 ===");
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

  console.log("=== [4/8] Compiling MainActivity.java & R.java with javac ===");
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

  console.log("=== [5/8] Converting Java bytecode to Dalvik classes.dex with d8 ===");
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

  console.log("=== [6/8] Adding uncompressed classes.dex into APK ===");
  fs.copyFileSync(path.join(dexOutDir, "classes.dex"), path.join(stageDir, "classes.dex"));
  execFileSync(jarBin, ["u0f", linkedBaseApk, "-C", stageDir, "classes.dex"], {
    env: envWithJava,
    stdio: "inherit",
  });

  console.log("=== [7/8] Page-aligning APK (4-byte alignment) with zipalign ===");
  const alignedApk = path.join(workDir, "base-aligned.apk");
  execFileSync(zipalignBin, ["-p", "-f", "4", linkedBaseApk, alignedApk], {
    env: envWithJava,
    stdio: "inherit",
  });

  console.log("=== [8/8] Signing APK with V1 + V2 + V3 schemes & Verifying ===");
  const keystorePath =
    process.env.ANDROID_KEYSTORE_PATH || path.join("/tmp/android-tools", "phrase-juste-release.jks");
  const keystorePass = process.env.ANDROID_KEYSTORE_PASSWORD || "phrasejuste2026";
  const keyAlias = process.env.ANDROID_KEY_ALIAS || "phrasejuste";
  const keyPass = process.env.ANDROID_KEY_PASSWORD || keystorePass;

  if (!fs.existsSync(keystorePath)) {
    fs.mkdirSync(path.dirname(keystorePath), { recursive: true });
    execFileSync(
      keytoolBin,
      [
        "-genkeypair",
        "-v",
        "-keystore",
        keystorePath,
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
