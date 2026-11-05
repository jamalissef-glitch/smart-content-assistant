
import fs from "node:fs/promises";
import path from "node:path";

const EXPORT_DIR = path.resolve("exports");

// Escape CSV values safely
const escapeCSV = (value) => {
  const text = String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;
};

// Convert content into CSV rows
const createCSV = (content, metadata) => {
  const rows = [
    ["Type", "Content"],
    ["Summary", content.summary],
    ["Enhanced Content", content.enhancedContent],
    ["Article Title", content.article.title],
    ["Article Body", content.article.body],
  ];

  content.socialPosts.forEach((post, index) => {
    rows.push([`Social Post ${index + 1}`, post]);
  });

  content.keyPoints.forEach((point, index) => {
    rows.push([`Key Point ${index + 1}`, point]);
  });

  rows.push(["Model", metadata.model]);
  rows.push(["Generation ID", metadata.generationId]);
  rows.push(["Total Tokens", metadata.totalTokens]);
  rows.push(["Total Cost USD", metadata.totalCost]);

  return rows
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");
};

const exportContent = async (contentResult, costResult = {}) => {
  try {
    if (!contentResult?.success || !contentResult.content) {
      throw new Error("Valid content result is required");
    }

    const content = contentResult.content;

    const metadata = {
      model: contentResult.model ?? "Unknown",
      generationId: contentResult.generationId ?? "Unavailable",
      totalTokens: contentResult.usage?.totalTokens ?? 0,
      totalCost: costResult.success
        ? costResult.totalCost
        : null,
      currency: "USD",
      exportedAt: new Date().toISOString(),
    };

    // Create exports directory if it does not exist
    await fs.mkdir(EXPORT_DIR, { recursive: true });

    // Generate unique filename
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

    const baseName = `ai-content-${timestamp}`;

    // JSON export
    const jsonData = {
      success: true,
      metadata,
      content,
      costTracking: costResult,
    };

    const jsonPath = path.join(
      EXPORT_DIR,
      `${baseName}.json`
    );

    await fs.writeFile(
      jsonPath,
      JSON.stringify(jsonData, null, 2),
      "utf8"
    );

    // TXT export
    const txtData = `
SMART CONTENT ASSISTANT
=======================

SUMMARY
-------
${content.summary}

ENHANCED CONTENT
----------------
${content.enhancedContent}

ARTICLE
-------
Title: ${content.article.title}

${content.article.body}

SOCIAL MEDIA POSTS
------------------
${content.socialPosts.map((post, index) =>
  `${index + 1}. ${post}`
).join("\n\n")}

KEY POINTS
----------
${content.keyPoints.map((point, index) =>
  `${index + 1}. ${point}`
).join("\n")}

REPORT
------
Model: ${metadata.model}
Generation ID: ${metadata.generationId}
Total Tokens: ${metadata.totalTokens}
Total Cost: ${
  metadata.totalCost !== null
    ? `$${metadata.totalCost} USD`
    : "Unavailable"
}
Exported At: ${metadata.exportedAt}
`;

    const txtPath = path.join(
      EXPORT_DIR,
      `${baseName}.txt`
    );

    await fs.writeFile(txtPath, txtData.trim(), "utf8");

    // CSV export
    const csvData = createCSV(content, metadata);

    const csvPath = path.join(
      EXPORT_DIR,
      `${baseName}.csv`
    );

    await fs.writeFile(csvPath, csvData, "utf8");

    console.log("\nExport completed successfully!");

    return {
      success: true,
      files: {
        json: jsonPath,
        txt: txtPath,
        csv: csvPath,
      },
    };

  } catch (error) {
    console.error("\nExport Service Error:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

export default exportContent;
