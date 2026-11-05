
// import dotenv from "dotenv";
// import fs from "fs/promises";
// import path from "path";

// dotenv.config();

// const API_URL = "https://openrouter.ai/api/v1/images";
// const MODEL = "qwen/qwen-image-2.1-turbo";

// const generateImage = async (
//   prompt,
//   filename = "ai-image.png"
// ) => {
//   try {
//     const apiKey = process.env.OPENROUTER_API_KEY;

//     if (!apiKey) {
//       throw new Error("OPENROUTER_API_KEY is missing");
//     }

//     if (!prompt?.trim()) {
//       throw new Error("Prompt cannot be empty");
//     }

//     console.log("Generating image...");

//     const response = await fetch(API_URL, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${apiKey}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: MODEL,
//         prompt,
//         resolution: "2K",
//         aspect_ratio: "1:1",
//         n: 1,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(
//         `API Error (${response.status}): ${await response.text()}`
//       );
//     }

//     const result = await response.json();
//     const imageData = result.data?.[0]?.b64_json;

//     if (!imageData) {
//       throw new Error("No image data returned");
//     }

//     const imageBuffer = Buffer.from(imageData, "base64");

//     const outputDir = path.join(
//       process.cwd(),
//       "generated-images"
//     );

//     await fs.mkdir(outputDir, { recursive: true });

//     const safeFilename = path.basename(filename);
//     const finalFilename = safeFilename.endsWith(".png")
//       ? safeFilename
//       : `${safeFilename}.png`;

//     const filePath = path.join(outputDir, finalFilename);

//     await fs.writeFile(filePath, imageBuffer);

//     console.log("Image generated successfully!");
//     console.log("Saved:", filePath);

//     return {
//       success: true,
//       model: MODEL,
//       filename: finalFilename,
//       filePath,
//       cost: result.usage?.cost ?? "Not provided",
//     };

//   } catch (error) {
//     console.error("Image generation failed:", error.message);
//     throw error;
//   }
// };

// export default generateImage;
