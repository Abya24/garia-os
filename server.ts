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
      const {
        prompt,
        history,
        mode = "standard", // 'standard' | 'high_thinking' | 'fast_lite' | 'search_grounded'
        image, // { data: base64, mimeType: string }
        customApiKey,
        contextNote,
        curriculumContext,
        careerContext,
        academicContext,
        examContext,
        studentProfileContext,
        todayContext,
        abyaLanguage,
      } = req.body;

      if (!prompt && !image) {
        return res.status(400).json({ error: "Prompt or image is required" });
      }

      // Use user-provided custom API key if present, otherwise environment variable
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;

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
          `[Abya AI Server] Dispatching request with model="${candidate.model}", mode="${mode}", hasImage=${!!image} for student "${studentProfileContext?.name || "Student"}"...`
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
            `[Abya AI Server] Candidate ${candidate.model} failed (${err?.message || err}). Trying next candidate...`
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
      console.error(`[Abya AI Server] Error in /api/ai/chat after ${duration}ms:`, error?.message || error);
      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes("429") ||
        error?.message?.includes("RESOURCE_EXHAUSTED");
      return res.status(isRateLimit ? 429 : 500).json({
        error: error.message || "Failed to communicate with Abya AI service.",
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
      const { pathname } = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
      if (pathname === "/api/live-voice" || pathname === "/api/live" || pathname === "/live") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
    } catch (e) {
      // Ignored for non-websocket upgrade errors
    }
  });

  wss.on("connection", async (clientWs, req) => {
    let liveSession: any = null;
    try {
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const studentName = url.searchParams.get("studentName") || "Student";
      const classLevel = url.searchParams.get("classLevel") || "Class 12";
      const stream = url.searchParams.get("stream") || "Science";
      const board = url.searchParams.get("board") || "CBSE";
      const customKey = url.searchParams.get("apiKey");

      const apiKey = customKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            error: "GEMINI_API_KEY is not configured for Live Voice API.",
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

      console.log(`[Abya Live Voice] Initializing session with gemini-3.1-flash-live-preview for ${studentName}...`);

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
            console.error("[Abya Live Voice] Gemini session error:", err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "error",
                  error: err?.message || "Live Voice session error",
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
          console.error("[Abya Live Voice] Error processing client audio payload:", e);
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
      console.error("[Abya Live Voice] Connection initialization error:", err);
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
