/**
 * Server-side centralized model configuration for Garia OS API endpoints.
 */

export const SERVER_AI_MODELS = {
  DEFAULT_TEXT: "gemini-3.8-flash",
  LOW_LATENCY: "gemini-3.1-flash-lite",
  HIGH_THINKING_PREVIEW: "gemini-3.1-pro-preview",
  LIVE_VOICE: "gemini-3.8-live",
  LIVE_VOICE_EXTENDED_THINKING: "gemini-3.8-live-extended-thinking",
} as const;

export const SERVER_SUPPORTED_MODELS = Object.values(SERVER_AI_MODELS);
