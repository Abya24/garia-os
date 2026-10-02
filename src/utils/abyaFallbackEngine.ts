import {
  StudentProfile,
  Task,
  AcademicSubject,
  AcademicChapter,
  AcademicTest,
  ExamProfile,
  ExamMockTest,
  CareerProfile,
  CareerRoadmap,
  AbyaInsightCard,
  AbyaQuickActionType,
} from "../types";
import {
  CurriculumSubject,
  BoardCurriculumHierarchy,
  getBoardCurriculumHierarchy,
  normalizeCurriculumBoard,
  normalizeVerificationStatus,
} from "../data/masterCurriculum";

/**
 * Formats an honest, source-aware curriculum disclosure for Abya AI responses.
 * Never claims official board verification when status is SOURCE-REQUIRED, PARTIALLY-VERIFIED, SOURCE-CONFLICT, or OUTDATED.
 */
export function formatAbyaCurriculumSourceDisclosure(params: {
  board: string;
  classLevel: string;
  stream: string;
  academicYear?: string;
  subject?: CurriculumSubject;
  hierarchy?: BoardCurriculumHierarchy;
}): string {
  const normalizedBoard = normalizeCurriculumBoard(params.board);
  const rawStatus =
    params.subject?.verificationStatus ||
    params.hierarchy?.verificationStatus ||
    "SOURCE-REQUIRED";
  const status = normalizeVerificationStatus(rawStatus, "SOURCE-REQUIRED");
  const year =
    params.subject?.academicYear ||
    params.hierarchy?.academicYear ||
    "2026-27";
  const prov = params.subject?.provenance || params.hierarchy?.provenance;

  if (status === "VERIFIED" && prov) {
    return `✅ **Curriculum Status:** VERIFIED (${prov.authority} • ${prov.documentTitle} • Academic Year ${year})`;
  }
  if (status === "PARTIALLY-VERIFIED") {
    return `🌓 **Curriculum Status:** PARTIALLY-VERIFIED (${year}) — Core chapter structure is aligned (${prov?.documentTitle || normalizedBoard}), while remaining chapter/blueprint details are still unverified pending official ${normalizedBoard} notifications.`;
  }
  if (status === "SOURCE-CONFLICT") {
    return `⚠️ **Curriculum Status:** SOURCE-CONFLICT (${year}) — Based on your current ${params.stream} study curriculum in Garia OS. Conflicting syllabus references were detected; please confirm final chapter updates with official ${normalizedBoard} notifications.`;
  }
  if (status === "OUTDATED") {
    return `⚠️ **Curriculum Status:** OUTDATED (${year}) — Based on your current ${params.stream} study curriculum in Garia OS. This reference belongs to an older academic session; please confirm final board syllabus updates with official ${normalizedBoard} notifications.`;
  }
  if (prov?.curriculumContentSupported && prov.documentTitle) {
    return `ℹ️ **Curriculum Status:** ${status} (${year} • Official Textbook Evidence: ${prov.authority} — ${prov.documentTitle}, ${prov.resourceAcademicYear || "Historical Edition"}) — Based on your current ${params.stream} study curriculum in Garia OS and from your important revision priorities. Chapter content is supported by the official textbook edition, while 2026-27 exam applicability remains unverified; practice these core topics and confirm final board syllabus updates with official ${normalizedBoard} notifications.`;
  }
  if (prov?.officialResourceConfirmed && prov.documentTitle) {
    return `ℹ️ **Curriculum Status:** ${status} (${year} • Official Resource Cataloged: ${prov.authority} — ${prov.documentTitle}) — Based on your current ${params.stream} study curriculum in Garia OS and from your important revision priorities. Official ${prov.authority} resource identity is cataloged, while chapter-level text and 2026-27 syllabus applicability remain unverified; practice these core topics and confirm final board syllabus updates with official ${normalizedBoard} notifications.`;
  }
  return `ℹ️ **Curriculum Status:** ${status} (${year}) — Based on your current ${params.stream} study curriculum in Garia OS and from your important revision priorities. Practice these core topics and confirm final board syllabus updates with official ${normalizedBoard} notifications.`;
}

interface ActiveStudentData {
  profile?: StudentProfile | null;
  tasks?: Task[];
  subjects?: AcademicSubject[];
  chapters?: AcademicChapter[];
  tests?: AcademicTest[];
  examProfile?: ExamProfile;
  mockTests?: ExamMockTest[];
  careerProfile?: CareerProfile;
  careerRoadmap?: CareerRoadmap;
  daysRemaining?: number;
  readinessScore?: number;
}

/**
 * Generates compact, actionable Abya Insight Cards for the Active Student
 */
export const generateAbyaInsightCards = (
  data: ActiveStudentData
): AbyaInsightCard[] => {
  const cards: AbyaInsightCard[] = [];
  const {
    chapters = [],
    tests = [],
    mockTests = [],
    examProfile = {
      id: "exam-default",
      examName: "Board Exam",
      board: "CBSE",
      classLevel: "Class 12",
      stream: "Commerce",
      targetDate: "",
      targetScore: 90,
      dailyStudyHours: 4,
      notes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    careerRoadmap = {
      id: "roadmap-default",
      careerTitle: "General Higher Studies",
      milestones: [],
      targetYear: new Date().getFullYear() + 2,
      strategySummary: "",
      generatedAt: Date.now(),
    },
    daysRemaining = 60,
    readinessScore = 70,
  } = data || {};

  // 1. 🔥 Priority Card (Weak or VVI Chapter)
  const priorityChapter = chapters.find((c) => c.isWeak || c.priority === "VVI");
  if (priorityChapter) {
    cards.push({
      id: "card-priority",
      type: "priority",
      title: "🔥 High Priority Focus",
      recommendation: `"${priorityChapter.title}" needs immediate focus`,
      reason: priorityChapter.isWeak
        ? "Marked as weak topic requiring extra conceptual practice."
        : "Application-derived high-priority (VVI) chapter in your Garia OS study curriculum.",
      actionText: "Study Topic",
      actionTab: "study",
    });
  } else {
    cards.push({
      id: "card-priority",
      type: "priority",
      title: "🔥 Daily Priority",
      recommendation: "All chapters currently on track!",
      reason: "Continue maintaining regular chapter completion and practice.",
      actionText: "Study Tracker",
      actionTab: "study",
    });
  }

  // 2. 🔄 Revision Card
  const overdueChapter = chapters.find(
    (c) => c.revisionCount === 0 || (c.status === "In Progress" && c.isWeak)
  );
  if (overdueChapter) {
    cards.push({
      id: "card-revision",
      type: "revision",
      title: "🔄 Revision Due",
      recommendation: `Revise "${overdueChapter.title}"`,
      reason:
        overdueChapter.revisionCount === 0
          ? "No revision logged yet for this chapter."
          : "Needs spaced repetition to reinforce concepts.",
      actionText: "Study Session",
      actionTab: "study",
    });
  }

  // 3. 📝 Test Card
  const allTestsCount = tests.length + mockTests.length;
  if (allTestsCount > 0) {
    const totalScorePct =
      [
        ...tests.map((t) => (t.score / (t.maxMarks || 1)) * 100),
        ...mockTests.map((m) => (m.marksObtained / (m.maxMarks || 1)) * 100),
      ].reduce((a, b) => a + b, 0) / allTestsCount;

    cards.push({
      id: "card-test",
      type: "test",
      title: "📝 Test Performance",
      recommendation: `Average Test Score: ${Math.round(totalScorePct)}%`,
      reason:
        totalScorePct >= 75
          ? "Strong test performance! Keep practicing PYQs."
          : "Needs more practice in mock tests to boost confidence.",
      actionText: "View Tests",
      actionTab: "exam",
    });
  } else {
    cards.push({
      id: "card-test",
      type: "test",
      title: "📝 Test Analyst",
      recommendation: "No test records logged yet",
      reason: "Log a mock test or unit quiz to unlock AI performance analytics.",
      actionText: "Log Test",
      actionTab: "exam",
    });
  }

  // 4. 🏆 Exam Card
  cards.push({
    id: "card-exam",
    type: "exam",
    title: "🏆 Exam Readiness",
    recommendation: `${daysRemaining} Days to ${examProfile.board} ${examProfile.classLevel} Exam`,
    reason: `Current Readiness Score: ${readinessScore}%. Target study: ${examProfile.dailyStudyHours} hrs/day.`,
    actionText: "Exam Planner",
    actionTab: "exam",
  });

  // 5. 🎯 Career Card
  const targetCareer = careerRoadmap.careerTitle || "General Higher Studies";
  const completedMilestones = careerRoadmap.milestones.filter(
    (m) => m.completed
  ).length;
  cards.push({
    id: "card-career",
    type: "career",
    title: "🎯 Career Goal",
    recommendation: `Target Career: ${targetCareer}`,
    reason: `${completedMilestones} of ${
      careerRoadmap.milestones.length || 1
    } career milestones completed.`,
    actionText: "Career Center",
    actionTab: "career",
  });

  return cards;
};

/**
 * Study Mentor Local Intelligence Fallback Generator for Abya AI
 * Used exclusively when Online AI is temporarily unreachable (offline, timeout, API error, rate limit).
 * Delivers warm, student-friendly, actionable mentor guidance in conversational Hindi + English mix.
 */
export const generateAbyaFallbackResponse = (
  actionType: AbyaQuickActionType | "general",
  userPrompt: string,
  data: ActiveStudentData
): string => {
  const {
    profile,
    tasks = [],
    subjects = [],
    chapters = [],
    tests = [],
    mockTests = [],
    examProfile = {
      id: "exam-default",
      examName: "Board Exam",
      board: "CBSE",
      classLevel: "Class 12",
      stream: "Commerce",
      targetDate: "",
      targetScore: 90,
      dailyStudyHours: 4,
      notes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    daysRemaining = 60,
    readinessScore = 70,
  } = data || {};

  const profileName = profile?.name || "Student";
  const profileClass = profile?.classLevel || examProfile.classLevel || "Class 12";
  const profileStream = profile?.stream || examProfile.stream || "General";
  const rawBoard = profile?.board || examProfile.board || "CBSE";
  const lowerPromptRaw = (userPrompt || "").toLowerCase();
  const explicitBoardInPrompt = lowerPromptRaw.includes("bseb") || lowerPromptRaw.includes("bihar board")
    ? "BSEB"
    : lowerPromptRaw.includes("up board")
    ? "UP Board"
    : lowerPromptRaw.includes("mp board")
    ? "MP Board"
    : lowerPromptRaw.includes("icse") || lowerPromptRaw.includes("isc")
    ? "ICSE"
    : undefined;
  const profileBoard = normalizeCurriculumBoard(explicitBoardInPrompt || rawBoard);
  const boardHierarchy = getBoardCurriculumHierarchy(profileBoard, profileClass, profileStream);
  const boardPatternNote = boardHierarchy.boardMetadata.examPatternSummary;
  const hierarchyDisclosure = formatAbyaCurriculumSourceDisclosure({
    board: profileBoard,
    classLevel: profileClass,
    stream: profileStream,
    academicYear: boardHierarchy.academicYear,
    hierarchy: boardHierarchy,
  });

  // Natural-language Hindi / Hinglish / English intent routing when actionType === "general"
  let effectiveAction: AbyaQuickActionType | "general" = actionType;
  if (effectiveAction === "general" && lowerPromptRaw.length > 2) {
    if (
      lowerPromptRaw.includes("aaj kya padh") ||
      lowerPromptRaw.includes("aaj ka plan") ||
      lowerPromptRaw.includes("today study plan") ||
      lowerPromptRaw.includes("kya padhna chahiye")
    ) {
      effectiveAction = "study_plan";
    } else if (
      lowerPromptRaw.includes("weak subject") ||
      lowerPromptRaw.includes("kamzor subject") ||
      lowerPromptRaw.includes("weak topic") ||
      lowerPromptRaw.includes("kaunsa subject weak")
    ) {
      effectiveAction = "weak_topics";
    } else if (
      lowerPromptRaw.includes("kya revise karu") ||
      lowerPromptRaw.includes("exam se pehle kya revise") ||
      lowerPromptRaw.includes("revision queue") ||
      lowerPromptRaw.includes("revise")
    ) {
      effectiveAction = "revision_plan";
    }
  }

  switch (effectiveAction) {
    case "study_plan":
    case "plan_day": {
      const pendingTasks = tasks.filter((t) => !t.completed);
      const curriculumChapters = boardHierarchy.subjects.flatMap((s) =>
        s.chapters.map((ch) => ({ title: ch.title, priority: ch.priority, subjectName: s.name }))
      );
      const weakOrVvi =
        chapters.filter((c) => c.isWeak || c.priority === "VVI").length > 0
          ? chapters.filter((c) => c.isWeak || c.priority === "VVI").slice(0, 3)
          : curriculumChapters.filter((c) => c.priority === "VVI").slice(0, 3);
      const primaryChap = weakOrVvi[0]?.title || "Core Chapter";
      const secondaryChap = weakOrVvi[1]?.title || "Revision Topic";

      return `Arre ${profileName}! Chalo aaj ka ekdum focused study plan banate hain (${profileClass} ${profileStream} • ${profileBoard}).

📋 **Board Study Pattern (${profileBoard}):** ${boardPatternNote}
${hierarchyDisclosure}
🎯 **Aaj Ka Study Target:** ${examProfile.dailyStudyHours || 4} Ghante | ⏳ **Exam Countdown:** ${daysRemaining} Days remaining

📌 **Aaj Ka Step-by-Step Schedule (Application-Derived Priorities):**
1. 🌅 **Block 1 (Deep Concept Study - 2 hrs):** Sabse pehle "${primaryChap}" ke core concepts padho aur 2-3 important formulas/definitions note kar lo.
2. ☕ **Quick Break (15 mins):** Thoda stretch karo, paani piyo aur aankhon ko rest do.
3. ⚡ **Block 2 (${profileBoard === "BSEB" ? "50% OMR MCQ + Descriptive Practice" : "Practice & Board-Pattern Questions"} - 1.5 hrs):** "${secondaryChap}" ke ${profileBoard === "BSEB" ? "20 OMR Objective MCQs aur 3 Short/Long Answer questions" : "5 board-pattern sample questions"} practice karo.
4. 📝 **Block 3 (Daily Tasks & Revision - 1 hr):**
${
  pendingTasks.length > 0
    ? pendingTasks.slice(0, 3).map((t) => `   • ${t.title}`).join("\n")
    : "   • Pending notes review karo aur formulas revise karo."
}
5. 🌙 **Night Wind-Down (20 mins):** Aaj jo padha usko dimag me recall karo aur kal ke liye ready ho jao!

💡 *Mentor Tip: Ek saath continuous lambi padhai mat karo, 45 min ke baad 10 min break lene se retention badhta hai!*`;
    }

    case "weekly_schedule": {
      const subjectNames = subjects.map((s) => s.name);
      const sub1 = subjectNames[0] || "Subject 1";
      const sub2 = subjectNames[1] || "Subject 2";
      const sub3 = subjectNames[2] || "Subject 3";
      const sub4 = subjectNames[3] || "Subject 4";

      return `Namaste ${profileName}! 📅 Ye raha tumhara customized 7-Day Balanced Weekly Schedule (${profileClass} ${profileStream}):

🎯 **Weekly Focus:** Daily ${examProfile.dailyStudyHours || 4} Hours | Balanced Revision + Practice Loop

🗓️ **Day-by-Day Breakdown:**
• 🟢 **Monday:** ${sub1} (Core Theory & Derivations) + 30m Formula Revision
• 🔵 **Tuesday:** ${sub2} (Chapter Concepts & Solved Numericals) + 15m Flashcards
• 🟣 **Wednesday:** ${sub3} (High-Yield Questions & Case Studies) + Daily Tasks
• 🟡 **Thursday:** ${sub4} (Deep Study) + ${sub1} Spaced Recall (30m)
• 🟠 **Friday:** Combined Weak Topics Focus + 5 PYQs from ${sub2}
• 🔴 **Saturday:** Full Chapter Timed Mock Test + Mistake Notebook Analysis
• 🌟 **Sunday:** Weekly Revision Loop + Backlog Clearance + Next Week Planning

⚡ *Mentor Rule: Sunday ko naya topic shuru mat karo, pura din purane topics ko pakka karne me lagao!*`;
    }

    case "ask_doubt":
    case "explain_topic": {
      return `Haan ${profileName}! Main concept ko ekdum simple Hinglish me explain kar deta hoon.

Batao kaunsa topic ya question samajhna hai?
Jaise hi topic doge, hum usko in 4 simple steps me clear karenge:
1. 💡 **Easy Concept:** 2 line me aasan bhasha me samjhayenge.
2. 🌟 **Real-Life Example:** Rozmarra ki zindagi ya relatable example se connect karenge.
3. 📌 **Exam Points & Formulae:** Jo board exam me likhna zaroori hai.
4. ✏️ **Step-by-Step Question:** Ek solved example taaki numericals/theory me marks na katein.

*Upar apna topic ya doubt likho ya photo upload karo, chalo milkar solve karte hain!*`;
    }

    case "weak_topics": {
      const weakChapters = chapters.filter((c) => c.isWeak);
      if (weakChapters.length === 0) {
        return `Shabash ${profileName}! 🎉 Abhi tumhara koi bhi chapter weak mark nahi hai.

**Top Score banaye rakhne ke liye:**
- 📝 Roz 5-10 Past Year Questions (PYQs) solve karte raho.
- ⏱️ Exam Center me timed mock test do speed test karne ke liye.
- 🔄 Weekly revision loop maintain rakho.`;
      }

      return `Koi tension nahi ${profileName}! Thoda extra dhyan dene se ye topics bhi super strong ho jayenge:

🔥 **Topics needing attention (${weakChapters.length}):**
${weakChapters
  .slice(0, 4)
  .map(
    (c, idx) => `**${idx + 1}. ${c.title}** (${c.subjectId})
   • 💡 *Kaise padhein:* Pehle basic theory aur summary points re-read karo.
   • ✏️ *Practice:* Directly difficult questions mat lagao, pehle 3-4 simple questions solve karo.
   • ⏰ *Action:* Agle 48 ghante me iska 30 min ka ek revision block lagao.`
  )
  .join("\n\n")}

💪 *Mentor Advice: Har topper ka koi na koi weak chapter hota hai, bas regular practice se wo strong ban jata hai!*`;
    }

    case "revision_plan":
    case "revise": {
      const revisionQueue = chapters
        .filter((c) => c.revisionCount < 2 || c.isWeak)
        .slice(0, 4);

      if (revisionQueue.length === 0) {
        return `Bahut badhiya ${profileName}! ✅ Tumhare active chapters ka multiple rounds revision ho chuka hai.

- Current Readiness Score: **${readinessScore}%**
- Ab bas light weekly review karte raho taaki concepts memory me lock rahein!`;
      }

      return `Revision se hi memory strong hoti hai ${profileName}! 🔄
${hierarchyDisclosure}

📌 **Aaj Ka Priority Revision Queue (Application-Derived Garia OS Priority):**
${revisionQueue
  .map(
    (c, idx) => `**${idx + 1}. ${c.title}** (Revised: ${c.revisionCount}/3 baar)
   • Application Priority: ${c.priority} | Status: ${c.isWeak ? "Extra practice required" : "In Progress"}
   • Action: Formula sheet dekho aur 2 sample practice questions bina dekhe solve karo.`
  )
  .join("\n\n")}

*Revision complete hote hi Academic Center me 'Revised' mark kar dena!*`;
    }

    case "progress_analysis":
    case "analyze_tests": {
      const allTestRecords = [
        ...tests.map((t) => ({ name: t.testName, pct: (t.score / (t.maxMarks || 1)) * 100 })),
        ...mockTests.map((m) => ({ name: m.testName, pct: (m.marksObtained / (m.maxMarks || 1)) * 100 })),
      ];

      const completedChapters = chapters.filter((c) => c.status === "Completed").length;
      const totalChapters = chapters.length || 1;
      const syllabusPct = Math.round((completedChapters / totalChapters) * 100);

      const avgPct =
        allTestRecords.length > 0
          ? Math.round(allTestRecords.reduce((a, b) => a + b.pct, 0) / allTestRecords.length)
          : 0;

      return `Chalo ${profileName}, tumhara comprehensive progress report dekhte hain: 📊

📈 **Academic Summary (${profileClass} ${profileStream}):**
• 📚 **Syllabus Completed:** ${completedChapters}/${totalChapters} Chapters (${syllabusPct}%)
• 🏆 **Overall Exam Readiness:** ${readinessScore}%
• 📝 **Tests Logged:** ${allTestRecords.length} | **Average Test Score:** ${allTestRecords.length > 0 ? `${avgPct}%` : "No tests yet"}
• ⚠️ **Weak Chapters Marked:** ${chapters.filter((c) => c.isWeak).length}

🎯 **Mentor Assessment & Next Steps:**
1. ${
        syllabusPct >= 70
          ? "Syllabus kaafi achha cover ho chuka hai! Ab 100% focus mock tests aur time management par rakho."
          : "Daily 1 chapter ka first pass complete karne ka target banao."
      }
2. Pehle un chapters ke PYQs lagao jinka weightage board exams me sabse zyada hai.
3. Silly mistakes ki ek alag diary banao taaki final exam me same galti na ho.`;
    }

    case "exam_strategy":
    case "exam_coach": {
      return `Exam pass aa raha hai ${profileName}, structured preparation se strong score banega! 🎯

📋 **Target Exam:** ${profileBoard} ${profileClass} (${examProfile.examName})
${hierarchyDisclosure}
⏳ **Days Remaining:** ${daysRemaining} Din | 📈 **Readiness Score:** ${readinessScore}%

🏆 **Board Exam Preparation Strategy:**
1. 📝 **3-Tier Question Strategy:**
   - *Phase 1 (First 45 mins):* Sabse pehle Section A (MCQs / 1-markers) high accuracy se complete karo.
   - *Phase 2 (Next 90 mins):* 3-marker & 5-marker descriptive questions me step-by-step presentation, neat headings aur diagrams banao.
   - *Phase 3 (Last 30 mins):* Calculation re-checking aur unit/symbol verification.
2. 📌 **Practice Rule:** Roz 5 board-pattern sample questions aur verified past papers (jab official paper archive attach ho) zaroor solve karo.
3. 🧘 **Mental Calm:** Exam ke aakhri dino me panic mat karo, roz 7 ghante neend aur light exercise focus banaye rakhti hai!

*Consistency hi success ki key hai. Abya is always with you!*`;
    }

    default: {
      const lowerPrompt = (userPrompt || "").toLowerCase();
      const matchedCurriculumSubject = boardHierarchy.subjects.find(
        (s) =>
          lowerPrompt.includes(s.name.toLowerCase()) ||
          (s.name === "Business Studies" && lowerPrompt.includes("bst")) ||
          (s.name === "Accountancy" && lowerPrompt.includes("account")) ||
          (s.name === "Economics" && lowerPrompt.includes("eco")) ||
          (s.name === "Urdu" && (lowerPrompt.includes("urdu") || lowerPrompt.includes("kahkashan") || lowerPrompt.includes("qawaid")))
      );

      if (matchedCurriculumSubject) {
        const chapBreakdown = matchedCurriculumSubject.chapters
          .map(
            (ch, idx) =>
              `**${idx + 1}. ${ch.title}** [Garia OS Priority: ${ch.priority} • Est. Study Weight: ~${ch.examWeightageMarks || 20} Marks]\n   • *Core Topic:* ${ch.topics[0]?.name || ch.title}\n   • *Study Insight:* ${ch.topics[0]?.vviPoints[0] || ch.notesSummary.slice(0, 120)}`
          )
          .join("\n\n");

        const sourceDisclosure = formatAbyaCurriculumSourceDisclosure({
          board: profileBoard,
          classLevel: profileClass,
          stream: profileStream,
          academicYear: matchedCurriculumSubject.academicYear || boardHierarchy.academicYear,
          subject: matchedCurriculumSubject,
          hierarchy: boardHierarchy,
        });

        return `Namaste ${profileName}! 📚 Based on your current ${profileStream} study curriculum in Garia OS for **${profileBoard} ${profileClass} ${matchedCurriculumSubject.name}** (${matchedCurriculumSubject.code}):

📋 **${profileBoard} Study Pattern:** ${boardPatternNote}
${sourceDisclosure}

🔥 **From Your Important Revision Priorities (Application-Derived):**
${chapBreakdown}

🎯 **Recommended Study Plan (${profileBoard}):**
1. ${profileBoard === "BSEB" ? "Practice 25 OMR-style Objective MCQs daily alongside structured descriptive answers." : "Solve core conceptual and structured board-pattern practice questions."}
2. Practice these core topics and confirm final board syllabus updates with official ${profileBoard} notifications.`;
      }

      const matchedChapter = chapters.find(
        (c) =>
          lowerPrompt.includes(c.title.toLowerCase()) ||
          c.title.toLowerCase().includes(lowerPrompt.slice(0, 8))
      );
      const primarySubject = subjects[0]?.name || boardHierarchy.subjects[0]?.name || `${profileStream} Core`;

      if (lowerPrompt.length > 3 && matchedChapter) {
        return `Namaste ${profileName}! Based on your current ${profileStream} study curriculum in Garia OS, here is the study breakdown for "${matchedChapter.title}" (${matchedChapter.subjectId}):

📌 **Study Mentor Quick Breakdown for ${matchedChapter.title} (${profileBoard}):**
1. 💡 **Core Fundamentals:** Review the primary definitions and standard formula/rule sheet first.
2. 🎯 **Study Priority:** From your important revision priorities (${matchedChapter.priority || "Important"}), practice ${matchedChapter.priority === "VVI" ? "structured 5-mark long answers and objective MCQs" : "direct objective & short analytical questions"}.
3. ✏️ **Action Step:** Work through 2–3 solved examples, then practice sample board-pattern questions and confirm final board syllabus updates with official ${profileBoard} notifications.
4. 🔄 **Revision Tracker:** Update your completion progress in the Academic Center after finishing!

*Agar numerical me specific step ya formula me doubt hai, toh detail likho hum step-by-step decode karenge!*`;
      }

      if (
        lowerPrompt.includes("plan") ||
        lowerPrompt.includes("schedule") ||
        lowerPrompt.includes("time table") ||
        lowerPrompt.includes("aaj")
      ) {
        const pendingTasks = tasks.filter((t) => !t.completed);
        return `Haan ${profileName}! Aaj ka balanced study plan ye raha (${profileBoard} • ${profileClass} ${profileStream}):

🎯 **Target:** ${examProfile.dailyStudyHours || 4} Ghante | ⏳ **Days to Exam:** ${daysRemaining} Days

1. 🌅 **Session 1 (Focus):** Core ${profileStream} (${primarySubject}) ke sabse important chapter ka theory padho.
2. ⚡ **Session 2 (Practice):** ${profileBoard === "BSEB" ? "20 OMR Objective MCQs + 3 Short Answers" : "5 Board-Pattern Questions"} practice karo.
3. 📝 **Session 3 (Tasks):** ${
          pendingTasks.length > 0
            ? pendingTasks.slice(0, 2).map((t) => `\n   • ${t.title}`).join("")
            : "Formula revision & notes check."
        }

*Consistency is everything. Chalo shuru karte hain!*`;
      }

      return `Namaste ${profileName}! 😊 Main hoon tumhara Study Mentor Abya (${profileClass} ${profileStream} • ${profileBoard}).

Kaise chal rahi hai taiyari? 
- 📈 **Exam Readiness:** ${readinessScore}%
- ⏳ **Days Left:** ${daysRemaining} Days
- 📚 **Focus Subject:** ${primarySubject}
- 📋 **Board Pattern:** ${boardPatternNote}
- ${hierarchyDisclosure}

Tum mujhse koi bhi concept explanation, study plan, numericals ya board exam strategy puch sakte ho!`;
    }
  }
};
