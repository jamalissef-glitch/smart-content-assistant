
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const API_URL = "https://openrouter.ai/api/v1/audio/speech";

const MODEL = "mistralai/voxtral-mini-tts-2603";
const VOICE = "en_paul_neutral";

const textToSpeech = async (
  text,
  filename = "recording.mp3"
) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is missing");
    }

    if (!text || !text.trim()) {
      throw new Error("Text cannot be empty");
    }

    console.log("\nGenerating speech...");
    console.log("Model:", MODEL);
    console.log("Voice:", VOICE);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: text,
        voice: VOICE,
        response_format: "mp3",
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorDetails = await response.text();

      throw new Error(
        `TTS API Error (${response.status}): ${errorDetails}`
      );
    }

    const contentType = response.headers
      .get("content-type")
      ?.split(";")[0];

    if (contentType !== "audio/mpeg") {
      throw new Error(
        `Expected audio/mpeg but received: ${contentType}`
      );
    }

    const audioBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    if (audioBuffer.length === 0) {
      throw new Error("Generated audio is empty");
    }

    const outputDir = path.join(
      process.cwd(),
      "audio"
    );

    await fs.mkdir(outputDir, { recursive: true });

    const safeFilename = path.basename(filename);

    const finalFilename = safeFilename.endsWith(".mp3")
      ? safeFilename
      : `${safeFilename}.mp3`;

    const filePath = path.join(
      outputDir,
      finalFilename
    );

    await fs.writeFile(filePath, audioBuffer);

    const generationId = response.headers.get(
      "x-generation-id"
    );

    console.log("\nSpeech generated successfully!");
    console.log("File:", filePath);
    console.log(
      "Size:",
      (audioBuffer.length / 1024).toFixed(2),
      "KB"
    );

    return {
      success: true,
      model: MODEL,
      voice: VOICE,
      filePath,
      filename: finalFilename,
      size: audioBuffer.length,
      generationId,
    };

  } catch (error) {
    console.error("\nText-to-Speech Failed:");

    console.error(error.message);

    throw error;
  }
};

export default textToSpeech;
