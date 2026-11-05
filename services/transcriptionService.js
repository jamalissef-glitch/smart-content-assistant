
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const API_URL =
  "https://openrouter.ai/api/v1/audio/transcriptions";

const MODEL = "openai/whisper-1";

const transcribeAudio = async (audioFilePath) => {
  try {
    // Step 1: Validate API key
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is missing");
    }

    // Step 2: Validate audio file
    const absolutePath = path.resolve(audioFilePath);

    const stats = await fs.stat(absolutePath);

    if (!stats.isFile() || stats.size === 0) {
      throw new Error("Audio file is empty or invalid");
    }

    if (stats.size > 25 * 1024 * 1024) {
      throw new Error("Audio file exceeds 25 MB");
    }

    const extension = path.extname(absolutePath).toLowerCase();

    const mimeTypes = {
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".m4a": "audio/mp4",
      ".mp4": "audio/mp4",
      ".webm": "audio/webm",
      ".ogg": "audio/ogg",
      ".flac": "audio/flac",
    };

    const mimeType = mimeTypes[extension];

    if (!mimeType) {
      throw new Error(`Unsupported format: ${extension}`);
    }

    console.log("\nStarting transcription...");
    console.log("File:", path.basename(absolutePath));
    console.log("Size:", (stats.size / 1024).toFixed(2), "KB");
    console.log("Model:", MODEL);

    // Step 3: Read audio
    const audioBuffer = await fs.readFile(absolutePath);

    // Step 4: Create native FormData
    const formData = new FormData();

    const audioBlob = new Blob([audioBuffer], {
      type: mimeType,
    });

    formData.append(
      "file",
      audioBlob,
      path.basename(absolutePath)
    );

    formData.append("model", MODEL);

    // Step 5: Send request
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(120000),
    });

    // Step 6: Read response
    const responseText = await response.text();

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Invalid API response: ${responseText.slice(0, 500)}`
      );
    }

    // Step 7: Handle API errors
    if (!response.ok) {
      console.error("\nAPI Error Details:");
      console.error(JSON.stringify(result, null, 2));

      throw new Error(
        `HTTP ${response.status}: ${
          result.error?.message || "Transcription failed"
        }`
      );
    }

    // Step 8: Validate result
    if (!result.text) {
      throw new Error("No transcription text returned");
    }

    console.log("\nTranscription successful!");

    return {
      success: true,
      model: MODEL,
      text: result.text,
      usage: result.usage || null,
      file: path.basename(absolutePath),
    };

  } catch (error) {
    console.error("\nTranscription Failed:");
    console.error(error.message);

    throw error;
  }
};

export default transcribeAudio;
