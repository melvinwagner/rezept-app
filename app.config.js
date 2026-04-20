/**
 * app.config.js — dynamische Expo-Config.
 * Liest Umgebungsvariablen aus .env (lokal) oder Build-Env (EAS/Railway).
 */
require("dotenv").config();

module.exports = ({ config }) => ({
  ...config,
  expo: {
    name: "Rezept App",
    slug: "rezept-app",
    scheme: "rezept-app",
    version: "1.4.0-alpha.1",
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
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    },
  },
});
