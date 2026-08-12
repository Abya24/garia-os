import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Garia OS", version: "2.7" });
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
            "10:6C:54:1B:1A:1D:9B:45:9C:1F:B1:D4:53:ED:17:F8:78:E2:BB:88:80:61:98:C1:BB:06:56:06:FE:DC:A7:0E"
          ]
        }
      }
    ]);
  });

  // Direct APK Download Endpoint
  app.get([
    "/Garia_OS_v2.7_Release_APK.apk",
    "/Garia_OS_v2.6.1_Release_APK.apk",
    "/Garia_OS_v2.5.0_Release_APK.apk",
    "/Garia_OS_v2.4.0_Release_APK.apk",
    "/Garia_OS.apk",
    "/garia-os-release.apk",
    "/download.apk",
    "/download",
    "/api/download/apk"
  ], (req, res) => {
    const v270Public = path.join(process.cwd(), "public", "Garia_OS_v2.7_Release_APK.apk");
    const v270Dist = path.join(process.cwd(), "dist", "Garia_OS_v2.7_Release_APK.apk");
    const v261Public = path.join(process.cwd(), "public", "Garia_OS_v2.6.1_Release_APK.apk");
    const fallbackPublic = path.join(process.cwd(), "public", "Garia_OS.apk");
    
    let targetFile = fs.existsSync(v270Dist) ? v270Dist : v270Public;
    if (!fs.existsSync(targetFile)) {
      targetFile = fs.existsSync(v261Public) ? v261Public : fallbackPublic;
    }

    if (fs.existsSync(targetFile)) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.setHeader("Content-Disposition", 'attachment; filename="Garia_OS_v2.7_Release_APK.apk"');
      return res.sendFile(targetFile);
    }
    res.status(404).send("APK file not found");
  });

  // Abya AI Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    const startTime = Date.now();
    try {
      const {
        prompt,
        history,
        customApiKey,
        contextNote,
        careerContext,
        academicContext,
        examContext,
        studentProfileContext,
        todayContext,
        abyaLanguage,
      } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Use user-provided custom API key if present, otherwise environment variable
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.warn("[Abya AI Server] GEMINI_API_KEY is missing/unconfigured.");
        return res.status(401).json({
          error: "Abya AI is not configured. Please configure GEMINI_API_KEY in the deployment environment.",
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

      const systemInstruction = `You are Abya AI, the intelligent built-in academic, career, and exam AI coach for Garia OS v2.4.0.
Your purpose is to empower the ACTIVE student with profile-aware intelligence:

Core Capabilities:
1. 👤 ACTIVE STUDENT CONTEXT: Always customize responses strictly for the current active student profile (${studentProfileContext?.name || "Student"}, Class: ${studentProfileContext?.classLevel || "Class 12"}, Stream: ${studentProfileContext?.stream || "Commerce"}, Board: ${studentProfileContext?.board || "CBSE"}). Never mention or leak other students' data.
2. 📅 SMART DAILY COACH ("Plan My Day"): Recommend a realistic daily schedule (study blocks, revision, PYQ practice, test practice, breaks, buffer time). Do not schedule every minute.
3. 📚 CONCEPT TUTOR ("Explain This"): Explain concepts with: 1. Simple explanation, 2. Real-world analogy, 3. Key points, 4. Solved example, 5. Quick check question. Adapt depth to student class level.
4. 🔥 WEAK TOPIC COACH ("Help My Weak Topics"): Address weak topics with supportive wording like "Needs more practice". Explain why attention is needed, what to study, practice steps, and revision timing.
5. 🔄 REVISION COACH ("What Should I Revise?"): Provide a prioritized revision queue connected to Academic and Exam revision systems.
6. 📝 TEST ANALYST ("Analyze My Tests"): Analyze test score history, trends, strong subjects, and areas needing practice. If test count is 0, respond: "Not enough test data yet. Log mock tests in Exam Center."
7. 🎯 CAREER-AWARE GUIDANCE: Align guidance with career goals (e.g. CA -> Accounts/Eco/BS, Engineering -> Physics/Math/Chem, Medicine -> Bio/Chem), but Board/Exam priorities always come first. Present career information as guidance, not certainty.
8. 🏆 EXAM COACH: Provide exam countdown status, readiness score insights, today's focus, and what to revise next. Never present readiness as predicted board marks.
9. 🛡️ STUDENT-SAFE GUIDANCE: Encourage balanced study, rest, proper breaks, avoid extreme schedules, avoid shame-based language.
10. ${languageGuidance}

Active Student Context Summary:
${studentProfileContext ? `- Name: "${studentProfileContext.name}", Class: ${studentProfileContext.classLevel}, Stream: ${studentProfileContext.stream}, Board: ${studentProfileContext.board}, Profile ID: ${studentProfileContext.id}` : "- Profile: Default"}
- Language Preference: "${selectedLanguage}"
${todayContext ? `- Today's Tasks: ${todayContext.pendingTasksCount} pending, ${todayContext.completedTasksCount} completed` : ""}
${contextNote ? `- Attached Note Context: "${contextNote}"` : ""}
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

      // Build contents from prompt and history, ensuring strict Gemini role alternation starting with 'user'
      let contents: { role: string; parts: { text: string }[] }[] = [];

      if (Array.isArray(history) && history.length > 0) {
        // Filter out empty or non-user/model messages
        const cleanMsgs = history.filter(
          (m: any) =>
            m &&
            (m.role === "user" || m.role === "model") &&
            m.content &&
            typeof m.content === "string" &&
            m.content.trim() !== ""
        );

        // Find index of first 'user' message so history starts with a user turn
        const firstUserIdx = cleanMsgs.findIndex((m: any) => m.role === "user");

        if (firstUserIdx !== -1) {
          const validMsgs = cleanMsgs.slice(firstUserIdx);
          for (const msg of validMsgs) {
            const role = msg.role === "user" ? "user" : "model";
            // Merge consecutive messages with the same role
            if (
              contents.length > 0 &&
              contents[contents.length - 1].role === role
            ) {
              contents[contents.length - 1].parts[0].text += "\n" + msg.content;
            } else {
              contents.push({
                role,
                parts: [{ text: msg.content }],
              });
            }
          }
        }
      }

      // Append current user prompt
      if (contents.length > 0 && contents[contents.length - 1].role === "user") {
        contents[contents.length - 1].parts[0].text += "\n" + prompt;
      } else {
        contents.push({
          role: "user",
          parts: [{ text: prompt }],
        });
      }

      console.log(`[Abya AI Server] Dispatching request with ${contents.length} turn(s) for student "${studentProfileContext?.name || "Student"}"...`);

      // Attempt AI request with 1 internal server retry for transient cold-start glitches
      let response;
      let lastErr: any;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
            },
          });
          if (response) break;
        } catch (err: any) {
          lastErr = err;
          console.warn(`[Abya AI Server] Attempt ${attempt}/2 failed (${err?.message || err}).`);
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        }
      }

      if (!response) {
        throw lastErr || new Error("Failed to receive response from Gemini model.");
      }

      const replyText =
        response.text || "I'm sorry, I couldn't generate a response. Please try again.";

      const duration = Date.now() - startTime;
      console.log(`[Abya AI Server] Response generated successfully in ${duration}ms.`);
      return res.json({ text: replyText, durationMs: duration });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[Abya AI Server] Error in /api/ai/chat after ${duration}ms:`, error?.message || error);
      const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Garia OS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
