const OpenAI = require("openai");
const { ApiError, BadRequestError } = require("../utils/ApiError");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: Number(process.env.OPENAI_TIMEOUT_MS || 30000),
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function chat({ messages, model = DEFAULT_MODEL, temperature = 0.2 }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new ApiError(500, "OPENAI_API_KEY가 설정되지 않았습니다.");
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new BadRequestError("messages가 비어있습니다.");
  }

  const resp = await client.chat.completions.create({
    model,
    messages,
    temperature,
  });

  const choice = resp.choices?.[0];
  return {
    model: resp.model,
    finish_reason: choice?.finish_reason,
    message: choice?.message ?? { role: "assistant", content: "" },
    usage: resp.usage,
  };
}

module.exports = { chat };
