import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, ThinkingLevel, LiveServerMessage } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "Garia OS",
      version: "2.8.3",
      geminiFeatures: [
        "high_thinking (gemini-3.1-pro-preview)",
        "image_analysis (gemini-3.1-pro-preview)",
        "low_latency (gemini-3.1-flash-lite)",
        "search_grounding (gemini-3.5-flash)",
        "live_voice (gemini-3.1-flash-live-preview)",
      ],
    });
  });

  // APK Version & Metadata Endpoint
  app.get("/api/apk/version", (req, res) => {
    const v283Dist = path.join(process.cwd(), "dist", "Garia_OS_v2.8.3_Release_APK.apk");
    const v283Public = path.join(process.cwd(), "public", "Garia_OS_v2.8.3_Release_APK.apk");
    const targetFile = fs.existsSync(v283Dist) ? v283Dist : v283Public;

    let size = 0;
    let sha256 = "";

    if (fs.existsSync(targetFile)) {
      const stats = fs.statSync(targetFile);
      size = stats.size;
      const fileBuffer = fs.readFileSync(targetFile);
      sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({
      version: "2.8.3",
      versionCode: 13,
      packageName: "com.gariaos.app",
      fileName: "Garia_OS_v2.8.3_Release_APK.apk",
      sizeBytes: size,
      sha256: sha256,
      releaseDate: new Date().toISOString(),
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

  // Direct APK Download Endpoint
  app.get(
    [
      "/Garia_OS_v2.8.3_Release_APK.apk",
      "/Garia_OS_v2.8.2_Release_APK.apk",
      "/Garia_OS_v2.8.1_Release_APK.apk",
      "/Garia_OS_v2.8.0_Release_APK.apk",
      "/Garia_OS_v2.7_Release_APK.apk",
      "/Garia_OS_v2.6.1_Release_APK.apk",
      "/Garia_OS_v2.5.0_Release_APK.apk",
      "/Garia_OS_v2.4.0_Release_APK.apk",
      "/Garia_OS.apk",
      "/garia-os-release.apk",
      "/download.apk",
      "/download",
      "/api/download/apk",
    ],
    (req, res) => {
      const v283Dist = path.join(process.cwd(), "dist", "Garia_OS_v2.8.3_Release_APK.apk");
      const v283Public = path.join(process.cwd(), "public", "Garia_OS_v2.8.3_Release_APK.apk");
      const fallbackPublic = path.join(process.cwd(), "public", "Garia_OS.apk");

      let targetFile = fs.existsSync(v283Dist)
        ? v283Dist
        : fs.existsSync(v283Public)
        ? v283Public
        : fallbackPublic;

      if (fs.existsSync(targetFile)) {
        res.setHeader("Content-Type", "application/vnd.android.package-archive");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="Garia_OS_v2.8.3_Release_APK.apk"'
        );
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.sendFile(targetFile);
      }
      res.status(404).send("APK file not found");
    }
  );

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
        languageGuidance = "🌐 LANGUAGE MODE: ENGLISH. Respond strictly in clear, natural, student-friendly English.";
      } else if (selectedLanguage === "Hindi") {
        languageGuidance = "🌐 LANGUAGE MODE: HINDI. Respond in clear Hindi. If the user writes in Devanagari script, use Devanagari. If they write in Roman Hindi, use clean Roman Hindi.";
      } else if (selectedLanguage === "Hinglish") {
        languageGuidance = "🌐 LANGUAGE MODE: HINGLISH. Respond in natural Hinglish (mix of Hindi and English written in Roman script). Keep core subject names and academic terms in standard English.";
      } else {
        languageGuidance = `💬 LANGUAGE MODE: WHATSAPP CASUAL / ADAPTIVE (DEFAULT).
- Reply naturally, warmly, and casually like a close, intelligent study buddy chatting on WhatsApp.
- Dynamically adapt to the user's latest messaging style and script:
  * If the user writes in Roman Hindi or Hinglish (e.g. "kal physics ka kya padhu?", "bhai mujhe samajh nahi aa raha"), reply in natural Roman Hinglish (e.g. "Kal Physics me pehle Current Electricity revise kar lo...", "Koi tension nahi 😄 chalo step by step samajhte hain.").
  * If the user writes in English (e.g. "Explain this in English"), respond completely in English.
  * If the user mixes Hindi + English, naturally mix Hindi + English.
  * Do NOT force Devanagari script unless the user explicitly types in Devanagari script.
- CRITICAL RULES:
  * Do NOT translate student's actual names, notes, task titles, subject names, or custom chapter titles into unnatural text.
  * Avoid dry, formal, or robotic machine translation.
  * Keep tone warm, encouraging, conversational, and structured with friendly emojis when appropriate.`;
      }

      const systemInstruction = `You are Abya AI, the intelligent built-in academic, career, and exam AI coach for Garia OS.
Your purpose is to empower the ACTIVE student with profile-aware intelligence:

Core Capabilities:
1. 👤 ACTIVE STUDENT CONTEXT: Always customize responses strictly for the current active student profile (${studentProfileContext?.name || "Student"}, Class: ${studentProfileContext?.classLevel || "Class 12"}, Stream: ${studentProfileContext?.stream || "Commerce"}, Board: ${studentProfileContext?.board || "CBSE"}). Never mention or leak other students' data.
2. 📅 SMART DAILY COACH ("Plan My Day"): Recommend a realistic daily schedule (study blocks, revision, PYQ practice, test practice, breaks, buffer time). Do not schedule every minute.
3. 📚 CONCEPT TUTOR & DOUBT SOLVER ("Explain This" / Image Doubt): Explain concepts with: 1. Simple explanation, 2. Real-world analogy, 3. Key formulas/points, 4. Solved example, 5. Quick check question. Adapt depth to student class level. If analyzing an uploaded image/photo, provide deep step-by-step resolution of all handwritten or printed questions, diagrams, and equations.
4. 🔥 WEAK TOPIC COACH ("Help My Weak Topics"): Address weak topics with supportive wording like "Needs more practice". Explain why attention is needed, what to study, practice steps, and revision timing.
5. 🔄 REVISION COACH ("What Should I Revise?"): Provide a prioritized revision queue connected to Academic and Exam revision systems.
6. 📝 TEST ANALYST ("Analyze My Tests"): Analyze test score history, trends, strong subjects, and areas needing practice.
7. 🎯 CAREER-AWARE GUIDANCE: Align guidance with career goals (e.g. CA -> Accounts/Eco/BS, Engineering -> Physics/Math/Chem, Medicine -> Bio/Chem), but Board/Exam priorities always come first. Present career information as guidance, not certainty.
8. 🏆 EXAM COACH: Provide exam countdown status, readiness score insights, today's focus, and what to revise next. Never present readiness as predicted board marks.
9. 🛡️ STUDENT-SAFE GUIDANCE: Encourage balanced study, rest, proper breaks, avoid extreme schedules, avoid shame-based language.
10. 🎓 CURRICULUM & TOPIC INTELLIGENCE (Strict CBSE / State Board & NCERT Alignment):
- Automatically adhere to the student's exact academic tier: Class ${studentProfileContext?.classLevel || "10/11/12"}, Stream: ${studentProfileContext?.stream || "General"}.
- When requested for Topic Explanations: Provide 1. Plain-English conceptual breakdown, 2. Real-world relatable analogy, 3. Core formulas / key definitions, 4. Step-by-step solved numerical/problem, 5. Quick check question.
- When requested for Quick Notes: Provide high-yield structured bullet points, definition cards, and formula boxes.
- When requested for Revision Summaries: Deliver a 5-minute rapid recall summary with critical board triggers and common examiner pitfalls.
- When requested for MCQs / Practice: Generate exam-standard multiple choice questions with 4 distinct options, clearly marked correct option, and detailed explanation.
- When requested for PYQs: Present verified previous years' board questions with marking scheme breakdown and step-wise mark distribution.
- When requested for VVI Questions: Emphasize highest-frequency board exam questions and examiner focus areas.
11. ${languageGuidance}

Active Student Context Summary:
${studentProfileContext ? `- Name: "${studentProfileContext.name}", Class: ${studentProfileContext.classLevel}, Stream: ${studentProfileContext.stream}, Board: ${studentProfileContext.board}, Profile ID: ${studentProfileContext.id}` : "- Profile: Default"}
${curriculumContext ? `- Curriculum Context: Class: ${curriculumContext.classLevel || studentProfileContext?.classLevel}, Stream: ${curriculumContext.stream || studentProfileContext?.stream}, Subject: "${curriculumContext.subject || "N/A"}", Chapter: "${curriculumContext.chapter || "N/A"}", Topic: "${curriculumContext.topic || "N/A"}"` : ""}
- Language Preference: "${selectedLanguage}"
${todayContext ? `- Today's Tasks: ${todayContext.pendingTasksCount} pending, ${todayContext.completedTasksCount} completed` : ""}
${contextNote ? `- Attached Context / Focus Note: "${contextNote}"` : ""}
${
  careerContext
    ? `- Career Goal: "${careerContext.targetCareer || "General"}", Stream: ${careerContext.stream}, Roadmap Progress: ${careerContext.roadmapProgress || 0}%, Strong Subjects: ${Array.isArray(careerContext.strongSubjects) ? careerContext.strongSubjects.join(", ") : "None"}`
    : ""
}
${
  academicContext
    ? `- Academic Progress: ${academicContext.overallProgress}%, Active Subjects: ${academicContext.activeSubjectsCount}, Weak Topics Count: ${academicContext.weakTopicsCount}, Weak Chapters: "${academicContext.weakChapterTitles || "None"}", Test Avg Score: ${academicContext.testAverage}%`
    : ""
}
${
  examContext
    ? `- Exam: "${examContext.examName}", Board: ${examContext.board}, Countdown: ${examContext.daysRemaining} days remaining, Readiness Score: ${examContext.readinessScore}%, Status: ${examContext.readinessStatus}, Urgent Priority Chapters: "${examContext.urgentChapters || "None"}", Weak Topics: "${examContext.weakTopics || "None"}"`
    : ""
}`;

      // Model Selection & Configuration per Feature Specifications:
      let targetModel = "gemini-3.7-flash";
      let requestConfig: any = { systemInstruction };

      // 1. IMAGE UNDERSTANDING / PHOTO DOUBT SOLVER -> gemini-3.1-pro-preview
      if (image && image.data) {
        targetModel = "gemini-3.1-pro-preview";
      }
      // 2. HIGH THINKING MODE -> gemini-3.1-pro-preview with ThinkingLevel.HIGH (no maxOutputTokens)
      else if (mode === "high_thinking") {
        targetModel = "gemini-3.1-pro-preview";
        requestConfig = {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        };
      }
      // 3. LOW-LATENCY RESPONSES -> gemini-3.1-flash-lite
      else if (mode === "fast_lite") {
        targetModel = "gemini-3.1-flash-lite";
        requestConfig = { systemInstruction };
      }
      // 4. SEARCH GROUNDING (Google Search Data) -> gemini-3.5-flash with googleSearch tool
      else if (mode === "search_grounded") {
        targetModel = "gemini-3.5-flash";
        requestConfig = {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        };
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

      console.log(
        `[Abya AI Server] Dispatching request with model="${targetModel}", mode="${mode}", hasImage=${!!image} for student "${studentProfileContext?.name || "Student"}"...`
      );

      // Attempt AI request with 1 internal server retry
      let response: any;
      let lastErr: any;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: targetModel,
            contents: contents,
            config: requestConfig,
          });
          if (response) break;
        } catch (err: any) {
          lastErr = err;
          console.warn(`[Abya AI Server] Attempt ${attempt}/2 on ${targetModel} failed (${err?.message || err}).`);
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        }
      }

      if (!response) {
        throw lastErr || new Error(`Failed to receive response from ${targetModel}.`);
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
        `[Abya AI Server] ${targetModel} response generated successfully in ${duration}ms (sources: ${groundingSources?.length || 0}).`
      );
      return res.json({
        text: replyText,
        durationMs: duration,
        modelUsed: targetModel,
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

  // Vite Middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use((req, res, next) => {
      if (req.path === "/sw.js" || req.path === "/index.html" || req.path === "/") {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
      next();
    });
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
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
