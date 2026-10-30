import "server-only";
import { createOpenAI } from "@ai-sdk/openai";

const DEFAULT_MODEL = "gpt-4o-mini";

export type ModelInfo = { mode: "openai"; modelId: string; label: string } | { mode: "mock"; modelId: null; label: string };

/**
 * Mock mode is used when no key is configured (or MOCK_MODE=1), so the demo
 * still runs end to end without spending money. The UI labels it clearly.
 */
export function getModelInfo(): ModelInfo {
  if (process.env.MOCK_MODE === "1" || !process.env.OPENAI_API_KEY) {
    return { mode: "mock", modelId: null, label: "Mock mode" };
  }
  const modelId = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  return { mode: "openai", modelId, label: `OpenAI ${modelId}` };
}

export function getLanguageModel(modelId: string) {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai(modelId);
}
