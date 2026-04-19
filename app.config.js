/**
 * app.config.js — dynamische Expo-Config.
 * Liest `API_URL` aus der Umgebung (z.B. gesetzt beim EAS-Build oder lokal via .env).
 * Fallback: localhost:3001 für Dev.
 */
module.exports = ({ config }) => ({
  ...config,
  expo: {
    name: "Rezept App",
    slug: "rezept-app",
    scheme: "rezept-app",
    version: "1.2.0-alpha.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: { supportsTablet: true },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: { favicon: "./assets/favicon.png" },
    plugins: ["expo-router"],
    extra: {
      apiUrl: process.env.API_URL || "http://localhost:3001",
    },
  },
});
