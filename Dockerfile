# Backend-Container für die Rezept-App (Railway / beliebiger Docker-Host).
# Node 20 Alpine + yt-dlp + ffmpeg.
FROM node:20-alpine

# yt-dlp benötigt Python + ffmpeg für Audio-Extraktion.
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    ca-certificates \
    && ln -sf python3 /usr/bin/python \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app

# Nur Backend-Dependencies (express, cors, nodemailer, form-data, dotenv)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Nur Server-Dateien kopieren — App-Code ist nicht nötig am Server.
COPY server.js ./

# Railway setzt $PORT zur Laufzeit; server.js liest process.env.PORT (falls nicht: 3001).
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.js"]
