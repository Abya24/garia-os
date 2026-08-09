import express from "express";
import path from "path";
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
    res.json({ status: "ok", app: "Garia OS", version: "1.6.0" });
  });

  // Abya AI Endpoint
  app.post("/api/ai/chat", async (req, res) => {
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
      } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Use user-provided custom API key if present, otherwise environment variable
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.warn("[Abya AI] GEMINI_API_KEY is not configured.");
        return res.status(401).json({
          error: "Abya AI is not configured. Please configure GEMINI_API_KEY in the deployment environment.",
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

      const systemInstruction = `You are Abya AI, the intelligent built-in academic, career, and exam AI coach for Garia OS v1.6.
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

Active Student Context Summary:
${studentProfileContext ? `- Name: "${studentProfileContext.name}", Class: ${studentProfileContext.classLevel}, Stream: ${studentProfileContext.stream}, Board: ${studentProfileContext.board}, Profile ID: ${studentProfileContext.id}` : "- Profile: Default"}
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

      console.log(`[Abya AI] Sending request with ${contents.length} turn(s)...`);

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      const replyText =
        response.text || "I'm sorry, I couldn't generate a response. Please try again.";

      console.log("[Abya AI] Response generated successfully.");
      return res.json({ text: replyText });
    } catch (error: any) {
      console.error("[Abya AI] Error in /api/ai/chat:", error?.message || error);
      return res.status(500).json({
        error: error.message || "Failed to communicate with Abya AI service.",
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
