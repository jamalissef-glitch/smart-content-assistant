
import dotenv from "dotenv";

import textToSpeech from "./services/textToSpeechService.js";
import transcribeAudio from "./services/transcriptionService.js";
import processContent from "./services/contentService.js";
import trackCost from "./services/costTrackingService.js";
import exportContent from "./services/exportService.js";

dotenv.config();

async function main() {
  const applicationStart = Date.now();

  try {
    // STEP 1: ORIGINAL TEXT
    const originalText = `
      Artificial Intelligence is transforming education,
      healthcare, agriculture, and business.

      AI helps people solve problems, improve productivity,
      and create new opportunities for development.
    `;

    console.log("\n==================================");
    console.log(" SMART CONTENT ASSISTANT");
    console.log("==================================");

    // STEP 2: TEXT TO SPEECH
    console.log("\n--- TEXT TO SPEECH ---");

    const speechResult = await textToSpeech(originalText);

    if (!speechResult.success) {
      throw new Error("Text-to-Speech failed");
    }

    console.log("Status: SUCCESS");
    console.log("Audio File:", speechResult.filename);
    console.log("File Size:", speechResult.size);

    // STEP 3: SPEECH TO TEXT
    console.log("\n--- SPEECH TO TEXT ---");

    const transcriptionResult = await transcribeAudio(
      speechResult.filePath
    );

    if (!transcriptionResult.success) {
      throw new Error("Speech-to-Text failed");
    }

    console.log("Status: SUCCESS");
    console.log("Transcription:");
    console.log(transcriptionResult.text);

    // STEP 4: CONTENT GENERATION
    console.log("\n--- CONTENT GENERATION ---");

    const contentResult = await processContent(
      transcriptionResult.text
    );

    if (!contentResult.success) {
      throw new Error("Content generation failed");
    }

    const content = contentResult.content;

    console.log("Status: SUCCESS");
    console.log("Model:", contentResult.model);

    console.log("\nSUMMARY:");
    console.log(content.summary);

    console.log("\nENHANCED CONTENT:");
    console.log(content.enhancedContent);

    console.log("\nARTICLE:");
    console.log("Title:", content.article.title);
    console.log(content.article.body);

    console.log("\nSOCIAL MEDIA POSTS:");

    content.socialPosts.forEach((post, index) => {
      console.log(`\nPost ${index + 1}:`);
      console.log(post);
    });

    console.log("\nKEY POINTS:");

    content.keyPoints.forEach((point, index) => {
      console.log(`${index + 1}. ${point}`);
    });

    // STEP 5: QUALITY CONTROL REPORT
    console.log("\n--- QUALITY CONTROL REPORT ---");

    console.log("Model:", contentResult.model);

    console.log(
      "Generation ID:",
      contentResult.generationId || "Not available"
    );

    console.log(
      "Prompt Tokens:",
      contentResult.usage.promptTokens
    );

    console.log(
      "Completion Tokens:",
      contentResult.usage.completionTokens
    );

    console.log(
      "Total Tokens:",
      contentResult.usage.totalTokens
    );

    console.log(
      "Response Time:",
      contentResult.performance.durationMs,
      "ms"
    );

    // STEP 6: COST TRACKING
    console.log("\n--- COST TRACKING ---");

    let costResult = {
      success: false,
      error: "Generation ID is unavailable",
    };

    if (contentResult.generationId) {
      costResult = await trackCost(
        contentResult.generationId
      );
    }

    if (costResult.success) {
      console.log("Status: SUCCESS");
      console.log("Generation ID:", costResult.generationId);
      console.log("Model:", costResult.model);
      console.log("Provider:", costResult.provider);

      console.log(
        "Prompt Tokens:",
        costResult.promptTokens
      );

      console.log(
        "Completion Tokens:",
        costResult.completionTokens
      );

      console.log(
        "Total Cost: $",
        costResult.totalCost
      );

      console.log(
        "Latency:",
        costResult.latency
      );
    } else {
      console.log("Status: UNAVAILABLE");
      console.log("Reason:", costResult.error);
    }

    // STEP 7: EXPORT SYSTEM
    console.log("\n--- EXPORT SYSTEM ---");

    const exportResult = await exportContent(
      contentResult,
      costResult
    );

    if (exportResult.success) {
      console.log("Export Status: SUCCESS");

      console.log("JSON:", exportResult.files.json);
      console.log("TXT:", exportResult.files.txt);
      console.log("CSV:", exportResult.files.csv);
    } else {
      console.log("Export Status: FAILED");
      console.log("Reason:", exportResult.error);
    }

    // STEP 8: FINAL APPLICATION REPORT
    const totalExecutionTime =
      Date.now() - applicationStart;

    console.log("\n==================================");
    console.log(" APPLICATION REPORT");
    console.log("==================================");

    console.log("Text-to-Speech: SUCCESS");
    console.log("Speech-to-Text: SUCCESS");
    console.log("Content Generation: SUCCESS");
    console.log("Quality Control: SUCCESS");

    console.log(
      "Cost Tracking:",
      costResult.success ? "SUCCESS" : "UNAVAILABLE"
    );

    console.log(
      "Export System:",
      exportResult.success ? "SUCCESS" : "FAILED"
    );

    console.log(
      "Total Execution Time:",
      (totalExecutionTime / 1000).toFixed(2),
      "seconds"
    );

    console.log("\nApplication completed.");

  } catch (error) {
    console.error("\nAPPLICATION ERROR:");
    console.error(error.message);
  }
}

main();
