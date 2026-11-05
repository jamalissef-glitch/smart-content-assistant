import dotenv from "dotenv";

dotenv.config();

const API_URL = "https://openrouter.ai/api/v1/generation";

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const trackCost = async (generationId) => {
  try {
    if (!generationId) {
      throw new Error("Generation ID is missing");
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("OpenRouter API key is missing");
    }

    // Retry up to 5 times
    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(
        `Checking generation cost: Attempt ${attempt}/5`
      );

      const response = await fetch(
        `${API_URL}?id=${encodeURIComponent(generationId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(30000),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const data = result.data;

        if (!data) {
          throw new Error("Generation data not found");
        }

        return {
          success: true,
          generationId: data.id,
          model: data.model,
          provider: data.provider_name,
          promptTokens: data.tokens_prompt,
          completionTokens: data.tokens_completion,
          totalCost: data.total_cost,
          currency: "USD",
          latency: data.latency,
          createdAt: data.created_at,
        };
      }

      const errorText = await response.text();

      // Retry only when generation is not yet available
      if (response.status === 404 && attempt < 5) {
        await wait(2000 * attempt);
        continue;
      }

      throw new Error(
        `Cost tracking failed (${response.status}): ${errorText}`
      );
    }

    throw new Error(
      "Generation data is still unavailable after 5 attempts"
    );

  } catch (error) {
    console.error("Cost Tracking Error:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

export default trackCost;