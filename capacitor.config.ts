/**
 * Capacitor & Native Android configuration for Phrase juste
 */
const config = {
  appId: "app.phrasejuste.mobile",
  appName: "Phrase juste",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    hostname: "appassets.androidplatform.net",
  },
  android: {
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH || "keystore/release.keystore",
      keystoreAlias: process.env.ANDROID_KEY_ALIAS || "phrasejuste",
    },
  },
};

export default config;
