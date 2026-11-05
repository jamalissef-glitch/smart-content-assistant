
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  maxRetries: 0,
  timeout: 60000,
});

const PRIMARY_MODEL = "openai/gpt-4o-mini";
const FALLBACK_MODEL = "openai/gpt-4o";

const MAX_ATTEMPTS = 3;

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableError(error) {
  const status = error.status;

  return (
    status === 408 ||
    status === 429 ||
    (status >= 500 && status <= 599) ||
    ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"].includes(error.code)
  );
}

async function generateWithModel(model, messages) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(
        `Using ${model} | Attempt ${attempt}/${MAX_ATTEMPTS}`
      );

      const startTime = Date.now();

      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
      });

      const durationMs = Date.now() - startTime;

      const content =
        response.choices?.[0]?.message?.content;

      if (!content || !content.trim()) {
        throw new Error("AI returned empty content");
      }

      return {
        success: true,
        model: response.model || model,
        generationId: response.id || null,
        content,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens:
            response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
        performance: {
          durationMs,
        },
      };
    } catch (error) {
      lastError = error;

      console.error(
        `${model} attempt ${attempt} failed:`,
        error.message
      );

      if (!isRetryableError(error) || attempt === MAX_ATTEMPTS) {
        break;
      }

      await wait(1000 * attempt);
    }
  }

  throw lastError;
}

export async function generateWithQualityControl(
  messages,
  options = {}
) {
  const primaryModel = options.primaryModel || PRIMARY_MODEL;
  const fallbackModel = options.fallbackModel || FALLBACK_MODEL;

  try {
    return await generateWithModel(primaryModel, messages);
  } catch (primaryError) {
    console.error(
      "Primary model failed. Trying fallback model..."
    );

    try {
      return await generateWithModel(fallbackModel, messages);
    } catch (fallbackError) {
      throw new Error(
        `Both models failed. Primary: ${primaryError.message}. Fallback: ${fallbackError.message}`
      );
    }
  }
}
