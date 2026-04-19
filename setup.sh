#!/usr/bin/env bash
# ===============================================================
#  DAWG Rezept-App — One-Shot Setup (macOS)
#
#  Installiert alles was du brauchst, um die App via Expo-Tunnel
#  gegen den Railway-Server laufen zu lassen.
#
#  Nutzung:
#    1. Repo downloaden von https://github.com/melvinwagner/rezept-app
#       → Tag v1.2.1-alpha.1 (oder neueren Alpha-Tag) wählen
#    2. Terminal öffnen, in den Ordner wechseln:
#         cd rezept-app
#    3. Ausführbar machen und starten:
#         chmod +x setup.sh
#         ./setup.sh
#    4. Danach App-Tunnel starten:
#         API_URL=https://rezept-app-production.up.railway.app npx expo start --tunnel
# ===============================================================
set -e

echo ""
echo "==> DAWG Rezept-App — Setup"
echo ""

# 1. Homebrew (falls nicht installiert)
if ! command -v brew &> /dev/null; then
  echo "[1/3] Installiere Homebrew…"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  if [[ -d /opt/homebrew/bin ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -d /usr/local/Homebrew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
else
  echo "[1/3] Homebrew schon da — skip."
fi

# 2. Node.js 20 LTS
if ! command -v node &> /dev/null; then
  echo "[2/3] Installiere Node.js 20…"
  brew install node@20
  brew link --overwrite node@20 || true
else
  echo "[2/3] Node schon da ($(node -v)) — skip."
fi

# 3. npm-Dependencies (inkl. Expo + @expo/ngrok)
echo "[3/3] Installiere npm-Dependencies (dauert 1–3 Min)…"
npm install

echo ""
echo "==> Setup fertig."
echo ""
echo "App starten mit:"
echo ""
echo "  API_URL=https://rezept-app-production.up.railway.app npx expo start --tunnel"
echo ""
echo "Dann QR-Code mit Expo Go (iOS App Store / Google Play) scannen."
echo ""
