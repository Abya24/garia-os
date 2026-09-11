import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, ThinkingLevel, LiveServerMessage } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Garia OS Server] Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Garia OS Server] Uncaught Exception:", err);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "Garia OS",
      version: "3.1.0",
      geminiFeatures: [
        "high_thinking (gemini-3.1-pro-preview)",
        "image_analysis (gemini-3.1-pro-preview)",
        "low_latency (gemini-3.1-flash-lite)",
        "search_grounding (gemini-3.5-flash)",
        "live_voice (gemini-3.1-flash-live-preview)",
      ],
    });
  });

  // Digital Asset Links Endpoint
  app.get("/.well-known/assetlinks.json", (req, res) => {
    const assetlinksPublic = path.join(process.cwd(), "public", ".well-known", "assetlinks.json");
    const assetlinksDist = path.join(process.cwd(), "dist", ".well-known", "assetlinks.json");
    const targetFile = fs.existsSync(assetlinksDist) ? assetlinksDist : assetlinksPublic;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=3600");

    if (fs.existsSync(targetFile)) {
      return res.sendFile(targetFile);
    }
    return res.json([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.gariaos.app",
          sha256_cert_fingerprints: [
            "10:6C:54:1B:1A:1D:9B:45:9C:1F:B1:D4:53:ED:17:F8:78:E2:BB:88:80:61:98:C1:BB:06:56:06:FE:DC:A7:0E",
          ],
        },
      },
    ]);
  });

  // Bounded Memory Rate Limiter for abuse prevention
  interface RateLimitRecord {
    count: number;
    resetAt: number;
  }

  class MemoryRateLimiter {
    private store = new Map<string, RateLimitRecord>();
    private maxEntries: number;
    private windowMs: number;
    private maxRequests: number;

    constructor(options: { windowMs: number; maxRequests: number; maxEntries?: number }) {
      this.windowMs = options.windowMs;
      this.maxRequests = options.maxRequests;
      this.maxEntries = options.maxEntries || 2000;

      const timer = setInterval(() => this.cleanup(), 30000);
      if (timer.unref) timer.unref();
    }

    private cleanup() {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        if (record.resetAt <= now) {
          this.store.delete(key);
        }
      }
    }

    public check(ip: string): { allowed: boolean; remaining: number; resetInMs: number } {
      const now = Date.now();
      let record = this.store.get(ip);

      if (!record || record.resetAt <= now) {
        if (this.store.size >= this.maxEntries) {
          this.cleanup();
          if (this.store.size >= this.maxEntries) {
            const firstKey = this.store.keys().next().value;
            if (firstKey) this.store.delete(firstKey);
          }
        }
        record = { count: 1, resetAt: now + this.windowMs };
        this.store.set(ip, record);
        return { allowed: true, remaining: this.maxRequests - 1, resetInMs: this.windowMs };
      }

      if (record.count >= this.maxRequests) {
        return { allowed: false, remaining: 0, resetInMs: Math.max(0, record.resetAt - now) };
      }

      record.count += 1;
      return {
        allowed: true,
        remaining: this.maxRequests - record.count,
        resetInMs: Math.max(0, record.resetAt - now),
      };
    }
  }

  function getClientIp(req: express.Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      const first = forwarded.split(",")[0].trim();
      if (first) return first;
    }
    return req.ip || req.socket.remoteAddress || "127.0.0.1";
  }

  // Rate Limiters
  const liveVoiceTicketLimiter = new MemoryRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    maxEntries: 1000,
  });

  const aiChatLimiter = new MemoryRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    maxEntries: 2000,
  });

  // Live Voice Ephemeral Single-Use Ticket Store
  const liveVoiceTickets = new Map<string, { expiresAt: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [t, entry] of liveVoiceTickets.entries()) {
      if (entry.expiresAt < now) {
        liveVoiceTickets.delete(t);
      }
    }
  }, 30000);

  // Endpoint to obtain a secure, short-lived single-use ticket for Live Voice WebSocket
  app.post("/api/live-voice/ticket", (req, res) => {
    const clientIp = getClientIp(req);
    const rateCheck = liveVoiceTicketLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      res.setHeader("Retry-After", Math.ceil(rateCheck.resetInMs / 1000).toString());
      return res.status(429).json({
        error: "Too many voice session ticket requests. Please wait a moment before reconnecting.",
        code: "RATE_LIMITED",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "Abya Live Voice is not configured on the server.",
        code: "MISSING_SERVER_KEY",
      });
    }

    // Bounded ticket store cleanup if capacity reached
    if (liveVoiceTickets.size >= 500) {
      const now = Date.now();
      for (const [t, entry] of liveVoiceTickets.entries()) {
        if (entry.expiresAt <= now) {
          liveVoiceTickets.delete(t);
        }
      }
      if (liveVoiceTickets.size >= 500) {
        const oldestKey = liveVoiceTickets.keys().next().value;
        if (oldestKey) liveVoiceTickets.delete(oldestKey);
      }
    }

    const ticket = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 1000; // 60-second single-use validity
    liveVoiceTickets.set(ticket, { expiresAt });
    res.json({ ticket, expiresInSeconds: 60 });
  });

  // Abya AI Provider Diagnostics & Health Check Endpoint
  app.get("/api/ai/diagnostics", (req, res) => {
    const hasEnvKey = !!process.env.GEMINI_API_KEY;
    res.json({
      status: "ok",
      provider: "online_ai",
      defaultModel: "gemini-3.7-flash",
      supportedModels: [
        "gemini-3.7-flash",
        "gemini-3.1-pro-preview",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.1-flash-live-preview",
      ],
      configured: hasEnvKey,
      timestamp: Date.now(),
    });
  });

  // Abya AI Multimodal & Advanced Mode Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    const startTime = Date.now();
    try {
      const clientIp = getClientIp(req);
      const rateCheck = aiChatLimiter.check(clientIp);
      if (!rateCheck.allowed) {
        res.setHeader("Retry-After", Math.ceil(rateCheck.resetInMs / 1000).toString());
        return res.status(429).json({
          error: "Too many AI requests. Please wait a moment before sending another query.",
          code: "RATE_LIMITED",
        });
      }

      const {
        prompt,
        history,
        mode = "standard", // 'standard' | 'high_thinking' | 'fast_lite' | 'search_grounded' | 'exam_coach' | 'career_coach' | 'mentor'
        image, // { data: base64, mimeType: string }
        contextNote,
        curriculumContext,
        careerContext,
        academicContext,
        examContext,
        studentProfileContext,
        todayContext,
        abyaLanguage,
      } = req.body || {};

      // 1. Validate prompt and image presence
      if (!prompt && !image) {
        return res.status(400).json({
          error: "Prompt or image is required.",
          code: "MISSING_INPUT",
        });
      }

      // 2. Validate prompt type and bounds
      if (prompt !== undefined && prompt !== null) {
        if (typeof prompt !== "string") {
          return res.status(400).json({
            error: "Prompt must be a string.",
            code: "INVALID_PROMPT",
          });
        }
        if (prompt.length > 20000) {
          return res.status(400).json({
            error: "Prompt exceeds maximum allowed length of 20,000 characters.",
            code: "PROMPT_TOO_LARGE",
          });
        }
      }

      // 3. Validate mode allowlist
      const ALLOWED_MODES = [
        "standard",
        "high_thinking",
        "fast_lite",
        "search_grounded",
        "exam_coach",
        "career_coach",
        "mentor",
      ];
      if (typeof mode !== "string" || !ALLOWED_MODES.includes(mode)) {
        return res.status(400).json({
          error: "Invalid AI mode specified.",
          code: "INVALID_MODE",
        });
      }

      // 4. Validate image payload if provided
      if (image !== undefined && image !== null) {
        if (typeof image !== "object" || Array.isArray(image)) {
          return res.status(400).json({
            error: "Image payload must be an object with data and mimeType.",
            code: "INVALID_IMAGE_PAYLOAD",
          });
        }
        const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!ALLOWED_MIMES.includes(image.mimeType)) {
          return res.status(400).json({
            error: "Unsupported image MIME type. Supported types: JPEG, PNG, WebP, GIF.",
            code: "INVALID_IMAGE_TYPE",
          });
        }
        if (typeof image.data !== "string" || image.data.length === 0) {
          return res.status(400).json({
            error: "Image data must be a non-empty base64 string.",
            code: "INVALID_IMAGE_DATA",
          });
        }
        if (image.data.length > 8000000) {
          return res.status(400).json({
            error: "Image payload exceeds maximum allowed size (~6MB).",
            code: "IMAGE_TOO_LARGE",
          });
        }
        const sample = image.data.slice(0, 500);
        if (!/^[A-Za-z0-9+/=_\-\r\n]+$/.test(sample)) {
          return res.status(400).json({
            error: "Image data contains invalid base64 encoding.",
            code: "MALFORMED_IMAGE_BASE64",
          });
        }
      }

      // 5. Validate history array if provided
      if (history !== undefined && history !== null) {
        if (!Array.isArray(history)) {
          return res.status(400).json({
            error: "History must be an array of message objects.",
            code: "INVALID_HISTORY",
          });
        }
        if (history.length > 50) {
          return res.status(400).json({
            error: "History cannot exceed 50 messages.",
            code: "HISTORY_TOO_LARGE",
          });
        }
        for (let i = 0; i < history.length; i++) {
          const item = history[i];
          if (!item || typeof item !== "object" || !item.role || typeof item.content !== "string") {
            return res.status(400).json({
              error: `History message at index ${i} is invalid. Expected { role, content }.`,
              code: "MALFORMED_HISTORY_ITEM",
            });
          }
          if (item.content.length > 15000) {
            return res.status(400).json({
              error: `History message at index ${i} exceeds 15,000 characters.`,
              code: "HISTORY_ITEM_TOO_LARGE",
            });
          }
        }
      }

      // 6. Validate context bounds
      if (contextNote && (typeof contextNote !== "string" || contextNote.length > 5000)) {
        return res.status(400).json({
          error: "contextNote exceeds maximum length of 5,000 characters.",
          code: "CONTEXT_NOTE_TOO_LARGE",
        });
      }

      // Strictly utilize server-side environment variable only
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.warn("[Abya AI Server] GEMINI_API_KEY is missing/unconfigured.");
        return res.status(401).json({
          error:
            "Abya AI is not configured. Please configure GEMINI_API_KEY in the deployment environment.",
          code: "MISSING_API_KEY",
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const selectedLanguage = abyaLanguage || "WhatsApp Language";
      let languageGuidance = "";
      if (selectedLanguage === "English") {
        languageGuidance = "🌐 LANGUAGE: Respond in clean, warm, student-friendly conversational English.";
      } else if (selectedLanguage === "Hindi") {
        languageGuidance = "🌐 LANGUAGE: Respond in clear, friendly Hindi. Use Devanagari if the student uses Devanagari, or Roman Hindi if preferred.";
      } else if (selectedLanguage === "Hinglish") {
        languageGuidance = "🌐 LANGUAGE: Respond in friendly, natural Hinglish (Roman script Hindi + English mix).";
      } else {
        languageGuidance = `💬 LANGUAGE & STYLE (DEFAULT: HINDI + ENGLISH MIX):
- Speak like an encouraging, supportive study mentor / elder study buddy (dost + mentor) chatting naturally.
- Use a natural, easy-to-understand mix of Hindi and English in Roman script (Hinglish), e.g.:
  * "Arre tension mat lo! Chalo is concept ko ek simple example se samajhte hain..."
  * "Pehle ye 2 core formulas revise kar lo, fir 3 questions practice karte hain."
- Keep core academic subjects, formulas, definitions, and technical chapter terms in standard English (e.g. "Kinematics", "Goodwill", "Current Electricity", "PYQs", "Derivations").
- If the student writes purely in English, match their language warmly in English. If they write in Devanagari Hindi, match in Devanagari Hindi.`;
      }

      let modePersonaAddon = "";
      if (mode === "exam_coach") {
        modePersonaAddon = `\n🎯 SPECIAL ROLE: EXAM COACH. Focus strictly on board and competitive exam strategies, high-yield weightage, question paper patterns, step-by-step marking rubrics, time-saving tricks, and common student traps/mistakes.`;
      } else if (mode === "career_coach") {
        modePersonaAddon = `\n🚀 SPECIAL ROLE: CAREER COACH. Provide strategic guidance on competitive exams, college selection, required skillsets, salary benchmarks, and career pathway milestones.`;
      } else if (mode === "mentor") {
        modePersonaAddon = `\n🌟 SPECIAL ROLE: PERSONAL STUDY MENTOR. Focus on deep empathetic habit mentoring, study discipline, procrastination busting, pomodoro focus pacing, and positive emotional support.`;
      }

      const systemInstruction = `You are Abya AI, a friendly, encouraging, and deeply knowledgeable Study Mentor & Guide for students.
You behave like a real human study mentor (not a robotic AI assistant or system tool).${modePersonaAddon}

CORE PERSONA RULES:
1. 🤝 STUDY MENTOR TONE: Be warm, empathetic, practical, and highly motivating. You are the student's study partner and mentor.
2. 🚫 NO ROBOTIC LANGUAGE: Never say "As an AI model", "I have processed your query", "According to system data", "Executing request", or "Deterministic output". Speak directly, naturally, and warmly.
3. 🚫 NO TECHNICAL AI TERMS: Never mention tokens, LLM, parameters, temperature, system prompts, API endpoints, or JSON objects.
4. ⚡ SHORT ACTIONABLE GUIDANCE: Provide clear, bite-sized, high-yield guidance. Use 3-4 bullet points, simple step-by-step action items, and real-world analogies (daily life, sports, cricket, pocket money, everyday examples).
5. 🎯 ACTIVE STUDENT FOCUS: Personalize all advice for student "${studentProfileContext?.name || "Student"}" (${studentProfileContext?.classLevel || "Class 12"} • ${studentProfileContext?.stream || "Commerce"} • ${studentProfileContext?.board || "CBSE"}). Keep all guidance aligned with their syllabus.
6. 📚 CONCEPT EXPLANATIONS: Explain concepts simply with:
   - 💡 1-line Simple Core Idea
   - 🌟 Relatable Real-World Example
   - 📌 2-3 Key Formulae / Rules / Keywords to remember
   - ✏️ Step-by-step solved question
   - ❓ Quick 1-question check for practice
7. 🛡️ STRESS-FREE & SUPPORTIVE: If a student has pending tasks or weak topics, motivate them with positive actionable advice ("Needs a little practice, step by step easy ho jayega!") rather than stress or pressure.
8. 🛠️ DIRECT MODULE ACTIONS: You can directly manage and interact with Garia OS modules on behalf of the student!
   When a student asks you to add a task, create a note, log water, set a goal, or navigate to a module, warmly confirm what you have done in your conversational message, AND append a structured action block at the very end of your response in this format:
   \`\`\`garia-action
   {"action": "create_task", "title": "...", "subject": "...", "priority": "high"|"medium"|"low", "date": "YYYY-MM-DD"}
   \`\`\`
   or
   \`\`\`garia-action
   {"action": "create_note", "title": "...", "content": "...", "tags": ["..."]}
   \`\`\`
   or
   \`\`\`garia-action
   {"action": "log_water", "amount": 1}
   \`\`\`
   or
   \`\`\`garia-action
   {"action": "create_goal", "title": "...", "category": "Academic", "targetDate": "YYYY-MM-DD"}
   \`\`\`
   or
   \`\`\`garia-action
   {"action": "navigate_module", "targetTab": "tasks"|"notes"|"exam"|"study"|"habits"|"goals"|"focus"|"career"|"stats"}
   \`\`\`
9. ${languageGuidance}

Current Student Context:
- Student Name: ${studentProfileContext?.name || "Student"}
- Academic Tier: ${studentProfileContext?.classLevel || "Class 12"} (${studentProfileContext?.stream || "General"} Stream, ${studentProfileContext?.board || "CBSE"} Board)
${curriculumContext ? `- Current Subject Focus: "${curriculumContext.subject || "N/A"}" › Chapter: "${curriculumContext.chapter || "N/A"}" › Topic: "${curriculumContext.topic || "N/A"}"` : ""}
${todayContext ? `- Today's Study Tasks: ${todayContext.pendingTasksCount} pending, ${todayContext.completedTasksCount} done` : ""}
${contextNote ? `- Attached Note Context: "${contextNote}"` : ""}
${careerContext ? `- Target Career Goal: "${careerContext.targetCareer || "General"}"` : ""}
${academicContext ? `- Syllabus Progress: ${academicContext.overallProgress}%, Weak Chapters: "${academicContext.weakChapterTitles || "None"}"` : ""}
${examContext ? `- Target Exam: "${examContext.examName}", ${examContext.daysRemaining} days remaining, Readiness: ${examContext.readinessScore}%` : ""}`;

      // Build ordered model candidates for automatic resiliency against 429 quota and 503 high-demand limits:
      interface ModelCandidate {
        model: string;
        config: any;
      }
      const candidates: ModelCandidate[] = [];

      if (image && image.data) {
        candidates.push(
          { model: "gemini-3.1-pro-preview", config: { systemInstruction } },
          { model: "gemini-3.7-flash", config: { systemInstruction } },
          { model: "gemini-3.1-flash-lite", config: { systemInstruction } }
        );
      } else if (mode === "high_thinking") {
        candidates.push(
          {
            model: "gemini-3.1-pro-preview",
            config: {
              systemInstruction,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.HIGH,
              },
            },
          },
          { model: "gemini-3.7-flash", config: { systemInstruction } },
          { model: "gemini-3.1-flash-lite", config: { systemInstruction } }
        );
      } else if (mode === "fast_lite") {
        candidates.push(
          { model: "gemini-3.1-flash-lite", config: { systemInstruction } },
          { model: "gemini-3.7-flash", config: { systemInstruction } },
          { model: "gemini-2.5-flash", config: { systemInstruction } }
        );
      } else if (mode === "search_grounded") {
        candidates.push(
          {
            model: "gemini-3.5-flash",
            config: {
              systemInstruction,
              tools: [{ googleSearch: {} }],
            },
          },
          { model: "gemini-3.7-flash", config: { systemInstruction } },
          { model: "gemini-3.1-flash-lite", config: { systemInstruction } }
        );
      } else {
        // Standard study mentor default
        candidates.push(
          { model: "gemini-3.7-flash", config: { systemInstruction } },
          { model: "gemini-3.1-flash-lite", config: { systemInstruction } },
          { model: "gemini-2.5-flash", config: { systemInstruction } },
          { model: "gemini-3.5-flash", config: { systemInstruction } }
        );
      }

      // Build contents
      let contents: any;

      if (image && image.data) {
        // Multimodal single/multi-part request
        const imagePart = {
          inlineData: {
            mimeType: image.mimeType || "image/jpeg",
            data: image.data,
          },
        };
        const textPart = {
          text: prompt || "Please analyze this study image/problem in detail and explain the solution step by step.",
        };
        contents = { parts: [imagePart, textPart] };
      } else {
        // Conversational text turn construction
        let messageTurns: { role: string; parts: { text: string }[] }[] = [];

        if (Array.isArray(history) && history.length > 0) {
          const cleanMsgs = history.filter(
            (m: any) =>
              m &&
              (m.role === "user" || m.role === "model") &&
              m.content &&
              typeof m.content === "string" &&
              m.content.trim() !== ""
          );

          const firstUserIdx = cleanMsgs.findIndex((m: any) => m.role === "user");
          if (firstUserIdx !== -1) {
            const validMsgs = cleanMsgs.slice(firstUserIdx);
            for (const msg of validMsgs) {
              const role = msg.role === "user" ? "user" : "model";
              if (
                messageTurns.length > 0 &&
                messageTurns[messageTurns.length - 1].role === role
              ) {
                messageTurns[messageTurns.length - 1].parts[0].text += "\n" + msg.content;
              } else {
                messageTurns.push({
                  role,
                  parts: [{ text: msg.content }],
                });
              }
            }
          }
        }

        if (messageTurns.length > 0 && messageTurns[messageTurns.length - 1].role === "user") {
          messageTurns[messageTurns.length - 1].parts[0].text += "\n" + (prompt || "");
        } else {
          messageTurns.push({
            role: "user",
            parts: [{ text: prompt || "" }],
          });
        }
        contents = messageTurns;
      }

      // Attempt AI request across candidate models in priority order
      let response: any;
      let usedModel = candidates[0].model;
      let lastErr: any;

      for (const candidate of candidates) {
        console.log(
          `[Abya AI Server] Dispatching request with model="${candidate.model}", mode="${mode}", hasImage=${!!image}...`
        );
        try {
          response = await ai.models.generateContent({
            model: candidate.model,
            contents: contents,
            config: candidate.config,
          });
          if (response) {
            usedModel = candidate.model;
            break;
          }
        } catch (err: any) {
          lastErr = err;
          console.warn(
            `[Abya AI Server] Candidate ${candidate.model} failed (status: ${err?.status || err?.code || "UNAVAILABLE"}). Trying next candidate...`
          );
        }
      }

      if (!response) {
        throw lastErr || new Error("All candidate AI models were unavailable or rate-limited.");
      }

      const replyText =
        response.text || "I'm sorry, I couldn't generate a response. Please try again.";

      // Extract Grounding Sources if Search Grounding was active
      let groundingSources: { title: string; uri: string }[] | undefined;
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks) && chunks.length > 0) {
        groundingSources = chunks
          .filter((c: any) => c?.web?.uri)
          .map((c: any) => ({
            title: c.web.title || new URL(c.web.uri).hostname,
            uri: c.web.uri,
          }));
      }

      const duration = Date.now() - startTime;
      console.log(
        `[Abya AI Server] ${usedModel} response generated successfully in ${duration}ms (sources: ${groundingSources?.length || 0}).`
      );
      return res.json({
        text: replyText,
        durationMs: duration,
        modelUsed: usedModel,
        modeUsed: mode,
        groundingSources,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes("429") ||
        error?.message?.includes("RESOURCE_EXHAUSTED");
      const errCategory = isRateLimit ? "RATE_LIMIT_429" : error?.status || error?.code || "SERVICE_ERROR";
      console.error(`[Abya AI Server] Request failed after ${duration}ms (category: ${errCategory})`);
      return res.status(isRateLimit ? 429 : 500).json({
        error: isRateLimit ? "Service is currently rate-limited. Please try again shortly." : "Failed to communicate with Abya AI service.",
        code: isRateLimit ? "RATE_LIMITED" : "AI_SERVICE_ERROR",
      });
    }
  });

  // Static asset serving & SPA routing in production / Vite middleware in development
  const isProduction = process.env.NODE_ENV === "production";

  // Cache & PWA Headers Middleware
  app.use((req, res, next) => {
    if (req.path === "/sw.js") {
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Service-Worker-Allowed", "/");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    } else if (req.path === "/manifest.json") {
      res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    } else if (req.path === "/index.html" || req.path === "/") {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
    next();
  });

  if (!isProduction) {
    console.log("[Garia OS Server] Starting in DEVELOPMENT mode with Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Garia OS Server] Starting in PRODUCTION mode with static dist assets...");
    const distPath = path.join(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Garia OS</title></head><body><div id='root'></div></body></html>");
      }
    });
  }

  // Create HTTP Server & Mount WebSocket Server for Live Voice Conversations (gemini-3.1-flash-live-preview)
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    try {
      const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
      const pathname = url.pathname;
      if (pathname === "/api/live-voice" || pathname === "/api/live" || pathname === "/live") {
        const ticket = url.searchParams.get("ticket");
        if (!ticket) {
          socket.write(
            "HTTP/1.1 401 Unauthorized\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nLive Voice requires a valid session ticket.\r\n"
          );
          socket.destroy();
          return;
        }

        const ticketData = liveVoiceTickets.get(ticket);
        const now = Date.now();
        if (!ticketData || ticketData.expiresAt < now) {
          if (ticketData) {
            liveVoiceTickets.delete(ticket);
          }
          socket.write(
            "HTTP/1.1 403 Forbidden\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nInvalid or expired session ticket.\r\n"
          );
          socket.destroy();
          return;
        }

        // Atomically consume ticket (strictly single-use)
        liveVoiceTickets.delete(ticket);
        (request as any)._liveVoiceTicketValidated = true;

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
    } catch (e) {
      socket.write("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
      socket.destroy();
    }
  });

  wss.on("connection", async (clientWs, req) => {
    let liveSession: any = null;
    try {
      // Re-verify that upgrade-level ticket authentication succeeded
      if (!(req as any)._liveVoiceTicketValidated) {
        clientWs.close(1008, "Missing or invalid ticket");
        return;
      }

      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const studentName = url.searchParams.get("studentName") || "Student";
      const classLevel = url.searchParams.get("classLevel") || "Class 12";
      const stream = url.searchParams.get("stream") || "Science";
      const board = url.searchParams.get("board") || "CBSE";

      // Strictly use server-side environment variable only
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            error: "GEMINI_API_KEY is not configured on the server for Live Voice API.",
            code: "MISSING_SERVER_KEY",
          })
        );
        clientWs.close();
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const liveSystemInstruction = `You are Abya Voice AI, the real-time interactive spoken academic tutor and viva coach for Garia OS.
You are having a real-time live voice conversation with student "${studentName}" (${classLevel} ${stream}, ${board} Board).
Guidelines:
- Speak concisely, warmly, and naturally like an encouraging study buddy and subject expert tutor.
- Keep spoken answers brief (2-4 sentences max per turn unless explaining a derivation), clear, and engaging.
- If the student asks for a concept explanation, break it down simply with a concrete intuitive analogy.
- If the student is practicing for oral exams/viva, ask them 1 question at a time and provide encouraging instant spoken feedback.
- Use natural conversational pacing suitable for spoken audio.`;

      console.log(`[Abya Live Voice] Initializing session with gemini-3.1-flash-live-preview...`);

      liveSession = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Zephyr" },
            },
          },
          systemInstruction: liveSystemInstruction,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts;
            let audioData: string | undefined;
            let textData: string | undefined;
            if (parts) {
              for (const p of parts) {
                if (p.inlineData?.data) {
                  audioData = p.inlineData.data;
                }
                if (p.text) {
                  textData = (textData ? textData + " " : "") + p.text;
                }
              }
            }
            if (audioData) {
              clientWs.send(
                JSON.stringify({
                  type: "audio",
                  audio: audioData,
                  text: textData,
                })
              );
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: "turnComplete" }));
            }
          },
          onclose: () => {
            console.log("[Abya Live Voice] Gemini session closed.");
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "closed" }));
            }
          },
          onerror: (err: any) => {
            console.error(`[Abya Live Voice] Gemini session error (code: ${err?.code || "SESSION_ERROR"})`);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "error",
                  error: "Live Voice session encountered an error.",
                })
              );
            }
          },
        },
      });

      clientWs.send(
        JSON.stringify({
          type: "ready",
          message: `Connected to Abya Live Voice (gemini-3.1-flash-live-preview)`,
          model: "gemini-3.1-flash-live-preview",
        })
      );

      clientWs.on("message", (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === "audio" && data.audio) {
            liveSession?.sendRealtimeInput({
              audio: { data: data.audio, mimeType: "audio/pcm;rate=16000" },
            });
          } else if (data.type === "text" && data.text) {
            liveSession?.sendRealtimeInput({
              text: data.text,
            });
          }
        } catch (e) {
          console.error("[Abya Live Voice] Error processing client audio payload.");
        }
      });

      clientWs.on("close", () => {
        console.log(`[Abya Live Voice] Client disconnected.`);
        try {
          liveSession?.close();
        } catch (e) {
          // ignore
        }
      });
    } catch (err: any) {
      console.error(`[Abya Live Voice] Connection initialization failed (code: ${err?.code || "INIT_FAILED"})`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            error: err?.message || "Failed to initialize Live Voice connection.",
          })
        );
        clientWs.close();
      }
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Garia OS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
