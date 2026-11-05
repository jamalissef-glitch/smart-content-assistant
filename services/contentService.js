
import { generateWithQualityControl } from "./qualityControlService.js";

const processContent = async (text) => {
  try {
    if (!text || !text.trim()) {
      throw new Error("Input text cannot be empty");
    }

    console.log("\nGenerating AI content with Quality Control...");

    const response = await generateWithQualityControl(
      [
        {
          role: "system",
          content: `
You are a professional AI content creator.

Generate:
1. A concise summary.
2. Enhanced professional content.
3. An article with title and body.
4. Three social media posts.
5. Five key points.

Return ONLY valid JSON:

{
  "summary": "...",
  "enhancedContent": "...",
  "article": {
    "title": "...",
    "body": "..."
  },
  "socialPosts": ["...", "...", "..."],
  "keyPoints": ["...", "...", "...", "...", "..."]
}
          `,
        },
        {
          role: "user",
          content: text,
        },
      ],
      {
        temperature: 0.7,
        maxTokens: 2000,
      }
    );

    // Clean AI response
    const cleanedText = response.content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    // Parse JSON
    const result = JSON.parse(cleanedText);

    // Validate required fields
    const requiredFields = [
      "summary",
      "enhancedContent",
      "article",
      "socialPosts",
      "keyPoints",
    ];

    for (const field of requiredFields) {
      if (!result[field]) {
        throw new Error(`Missing field: ${field}`);
      }
    }

    // Validate article structure
    if (
      !result.article.title ||
      !result.article.body
    ) {
      throw new Error("Invalid article structure");
    }

    // Validate arrays
    if (
      !Array.isArray(result.socialPosts) ||
      result.socialPosts.length !== 3
    ) {
      throw new Error("Expected exactly 3 social media posts");
    }

    if (
      !Array.isArray(result.keyPoints) ||
      result.keyPoints.length !== 5
    ) {
      throw new Error("Expected exactly 5 key points");
    }

    console.log("\nContent generated successfully!");

    return {
      success: true,
      model: response.model,

      // Required for Cost Tracking
      generationId: response.generationId,

      content: result,

      usage: response.usage,

      performance: response.performance,
    };

  } catch (error) {
    console.error("\nContent Service Error:", error.message);
    throw error;
  }
};

export default processContent;
