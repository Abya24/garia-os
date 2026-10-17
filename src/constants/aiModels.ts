/**
 * Centralized, strongly typed configuration for Gemini and Abya AI models in Garia OS.
 * Aligned with official @google/genai TypeScript SDK and Google AI Studio standards.
 */

export const AI_MODELS = {
  /**
   * Primary stable model for general student coaching, explanations, and exam guidance.
   * Modality: Text / Multimodal
   */
  DEFAULT_TEXT: "gemini-3.8-flash",

  /**
   * Ultra-low-latency model for instant note smart tagging, quick classification, and fast UI hints.
   * Modality: Text
   */
  LOW_LATENCY: "gemini-3.1-flash-lite",

  /**
   * High-reasoning model for complex math derivations, deep physics reasoning, and long-context problem solving.
   * Modality: Text / Multimodal (Preview)
   */
  HIGH_THINKING_PREVIEW: "gemini-3.1-pro-preview",

  /**
   * Native real-time bidirectional audio streaming model for Live Voice mentor conversations via WebSocket.
   * Modality: Real-time Audio
   */
  LIVE_VOICE: "gemini-3.8-live",

  /**
   * Real-time audio model with extended thinking capabilities for multi-step reasoning voice interactions.
   * Modality: Real-time Audio
   */
  LIVE_VOICE_EXTENDED_THINKING: "gemini-3.8-live-extended-thinking",
} as const;

export type SupportedAiModel = typeof AI_MODELS[keyof typeof AI_MODELS];

export interface ModelCapabilityDescriptor {
  id: SupportedAiModel;
  displayName: string;
  isStable: boolean;
  modalities: ("text" | "image" | "audio")[];
  description: string;
  recommendedUse: string;
}

export const MODEL_REGISTRY: Record<SupportedAiModel, ModelCapabilityDescriptor> = {
  [AI_MODELS.DEFAULT_TEXT]: {
    id: AI_MODELS.DEFAULT_TEXT,
    displayName: "Gemini 3.8 Flash",
    isStable: true,
    modalities: ["text", "image"],
    description: "Primary fast multimodal student coaching model",
    recommendedUse: "Daily study assistance, syllabus Q&A, and practice feedback",
  },
  [AI_MODELS.LOW_LATENCY]: {
    id: AI_MODELS.LOW_LATENCY,
    displayName: "Gemini 3.1 Flash Lite",
    isStable: true,
    modalities: ["text"],
    description: "High-throughput, lowest-latency text model",
    recommendedUse: "Automatic note tagging, topic categorization, and rapid fallbacks",
  },
  [AI_MODELS.HIGH_THINKING_PREVIEW]: {
    id: AI_MODELS.HIGH_THINKING_PREVIEW,
    displayName: "Gemini 3.1 Pro (Preview)",
    isStable: false,
    modalities: ["text", "image"],
    description: "Deep reasoning engine with configurable thinking budget",
    recommendedUse: "Complex numerical derivations and multi-step conceptual explanations",
  },
  [AI_MODELS.LIVE_VOICE]: {
    id: AI_MODELS.LIVE_VOICE,
    displayName: "Gemini 3.8 Live",
    isStable: true,
    modalities: ["audio"],
    description: "Real-time bidirectional audio streaming via WebSockets",
    recommendedUse: "Voice study mentor and viva oral practice",
  },
  [AI_MODELS.LIVE_VOICE_EXTENDED_THINKING]: {
    id: AI_MODELS.LIVE_VOICE_EXTENDED_THINKING,
    displayName: "Gemini 3.8 Live (Extended Thinking)",
    isStable: true,
    modalities: ["audio"],
    description: "Live voice conversation with deeper reasoning capabilities",
    recommendedUse: "Socratic oral questioning and complex conversational viva",
  },
};
