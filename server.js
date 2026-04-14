const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.json());

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

function downloadSubtitles(videoUrl, tmpDir) {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(tmpDir, "video");

    execFile(
      "yt-dlp",
      [
        "--write-subs",
        "--write-auto-sub",
        "--sub-lang", "deu-DE,de,eng-US,en",
        "--skip-download",
        "--output", outputTemplate,
        videoUrl,
      ],
      { timeout: 30000 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("yt-dlp subtitle error:", stderr);
          reject(new Error("Untertitel konnten nicht heruntergeladen werden."));
          return;
        }

        // Find any subtitle file
        const files = fs.readdirSync(tmpDir);
        const subFile = files.find((f) => f.endsWith(".vtt") || f.endsWith(".srt"));
        if (subFile) {
          const content = fs.readFileSync(path.join(tmpDir, subFile), "utf-8");
          resolve(content);
        } else {
          resolve(null);
        }
      }
    );
  });
}

function downloadAudio(videoUrl, tmpDir) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(tmpDir, "audio.%(ext)s");

    console.log("Fallback: Downloading audio...");
    execFile(
      "yt-dlp",
      [
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "5",
        "--no-playlist",
        "--output", outputPath,
        videoUrl,
      ],
      { timeout: 60000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Audio-Download fehlgeschlagen: ${stderr || error.message}`));
          return;
        }
        const files = fs.readdirSync(tmpDir);
        const audioFile = files.find((f) =>
          f.endsWith(".mp3") || f.endsWith(".m4a") || f.endsWith(".opus") || f.endsWith(".wav")
        );
        if (!audioFile) {
          reject(new Error("Keine Audiodatei gefunden."));
          return;
        }
        resolve(path.join(tmpDir, audioFile));
      }
    );
  });
}

function parseVTT(vttContent) {
  // Strip VTT header and timestamps, extract just the text
  const lines = vttContent.split("\n");
  const textLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, WEBVTT header, and timestamp lines
    if (
      !trimmed ||
      trimmed === "WEBVTT" ||
      trimmed.includes("-->") ||
      /^\d+$/.test(trimmed)
    ) {
      continue;
    }
    textLines.push(trimmed);
  }
  return textLines.join(" ");
}

app.post("/api/generate-recipe", async (req, res) => {
  const { videoUrl, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: "API Key fehlt." });
  }
  if (!videoUrl) {
    return res.status(400).json({ error: "Video URL fehlt." });
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rezept-"));

  try {
    // Step 1: Try to get subtitles
    console.log("Step 1: Trying to download subtitles...");
    let transcript = null;
    const subtitleContent = await downloadSubtitles(videoUrl, tmpDir);

    if (subtitleContent) {
      transcript = parseVTT(subtitleContent);
      console.log("Got subtitles, transcript length:", transcript.length);
      console.log("Transcript:", transcript.substring(0, 200) + "...");
    } else {
      console.log("No subtitles available, downloading audio...");
      // Fallback: download audio and note that we can't transcribe locally yet
      transcript = null;
    }

    if (!transcript) {
      return res.status(400).json({
        error: "Keine Untertitel für dieses Video verfügbar. Bitte ein Video mit Untertiteln versuchen.",
      });
    }

    // Step 2: Send transcript to Claude
    console.log("Step 2: Sending transcript to Claude...");
    const prompt = `Du bist ein Rezept-Experte. Hier ist das Transkript eines Rezeptvideos:

"${transcript}"

Quelle: ${videoUrl}

Erstelle daraus ein vollständiges, strukturiertes Rezept. Extrahiere alle Zutaten mit genauen Mengenangaben (schätze sinnvoll wenn nicht exakt genannt) und alle Zubereitungsschritte. Antworte AUSSCHLIESSLICH mit validem JSON im folgenden Format, ohne Markdown-Codeblöcke oder zusätzlichen Text:

{
  "title": "Rezeptname",
  "description": "Kurze Beschreibung des Gerichts",
  "servings": "z.B. 2 Portionen",
  "prepTime": "z.B. 5 Min",
  "cookTime": "z.B. 8 Min",
  "ingredients": ["200g Zutat 1", "3 EL Zutat 2"],
  "steps": ["Schritt 1 detailliert", "Schritt 2 detailliert"]
}`;

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const text = data.content[0].text;
    console.log("Claude response:", text);

    const recipe = JSON.parse(text);
    res.json(recipe);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Recipe API server running on http://localhost:${PORT}`);
});
