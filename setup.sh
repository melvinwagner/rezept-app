#!/usr/bin/env bash
# ===============================================================
#  DAWG Rezept-App — Setup für neuen Mac
#  Installiert alle Requirements für Expo-Tunnel & Backend-Dev.
#
#  Benutzung:
#    1. Repo klonen:     git clone https://github.com/melvinwagner/rezept-app.git
#    2. In Ordner:       cd rezept-app
#    3. Ausführbar:      chmod +x setup.sh
#    4. Ausführen:       ./setup.sh
# ===============================================================
set -e

echo ""
echo "==> DAWG Rezept-App — Setup"
echo ""

# ---------------------------------------------------------------
# 1. Homebrew (macOS Paketmanager)
# ---------------------------------------------------------------
if ! command -v brew &> /dev/null; then
  echo "Installiere Homebrew…"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # Apple-Silicon-Pfad in PATH (falls noch nicht drin)
  if [[ -d /opt/homebrew/bin ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
else
  echo "Homebrew bereits installiert."
fi

# ---------------------------------------------------------------
# 2. Node.js 20 (LTS) + git
# ---------------------------------------------------------------
echo ""
echo "Installiere Node.js und git…"
brew install node@20 git

# ---------------------------------------------------------------
# 3. Python + ffmpeg (für yt-dlp)
# ---------------------------------------------------------------
echo ""
echo "Installiere Python und ffmpeg…"
brew install python ffmpeg

# ---------------------------------------------------------------
# 4. yt-dlp (Video-Audio-Extraktion)
# ---------------------------------------------------------------
echo ""
echo "Installiere yt-dlp…"
pip3 install --upgrade --break-system-packages yt-dlp || pip3 install --upgrade --user yt-dlp

# ---------------------------------------------------------------
# 5. npm-Dependencies (App + Server)
# ---------------------------------------------------------------
echo ""
echo "Installiere npm-Dependencies (das dauert 1–3 Minuten)…"
npm install

# ---------------------------------------------------------------
# 6. Expo Go (Info — muss auf dem Tester-Handy installiert sein)
# ---------------------------------------------------------------
echo ""
echo "==> Setup fertig."
echo ""
echo "Nächste Schritte:"
echo ""
echo "  # Backend + App lokal starten (LAN-Modus):"
echo "  npm run dev"
echo ""
echo "  # Tester-Tunnel (Expo Go von überall):"
echo "  API_URL=https://rezept-app-production.up.railway.app npx expo start --tunnel"
echo ""
echo "  # Tester brauchen auf ihrem Handy:"
echo "  - Expo Go App (iOS App Store / Google Play)"
echo ""
