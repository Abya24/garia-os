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

interface ActiveStudentData {
  profile: StudentProfile;
  tasks: Task[];
  subjects: AcademicSubject[];
  chapters: AcademicChapter[];
  tests: AcademicTest[];
  examProfile: ExamProfile;
  mockTests: ExamMockTest[];
  careerProfile: CareerProfile;
  careerRoadmap: CareerRoadmap;
  daysRemaining: number;
  readinessScore: number;
}

/**
 * Generates compact, actionable Abya Insight Cards for the Active Student
 */
export const generateAbyaInsightCards = (
  data: ActiveStudentData
): AbyaInsightCard[] => {
  const cards: AbyaInsightCard[] = [];
  const {
    profile,
    chapters,
    tests,
    mockTests,
    examProfile,
    careerRoadmap,
    daysRemaining,
    readinessScore,
  } = data;

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
        : "VVI High-Weightage Chapter in your syllabus.",
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
    tasks,
    subjects,
    chapters,
    tests,
    mockTests,
    examProfile,
    careerRoadmap,
    daysRemaining,
    readinessScore,
  } = data;

  switch (actionType) {
    case "plan_day": {
      const pendingTasks = tasks.filter((t) => !t.completed);
      const weakOrVvi = chapters.filter((c) => c.isWeak || c.priority === "VVI").slice(0, 3);
      const primaryChap = weakOrVvi[0]?.title || "Core Chapter";
      const secondaryChap = weakOrVvi[1]?.title || "Revision Topic";

      return `Arre ${profile.name}! Chalo aaj ka ekdum focused aur stress-free study plan banate hain (${profile.classLevel} ${profile.stream}).

🎯 **Aaj Ka Target:** ${examProfile.dailyStudyHours || 4} Ghante | ⏳ **Exam me bache hain:** ${daysRemaining} Days

📌 **Aaj Ka Step-by-Step Schedule:**
1. 🌅 **Block 1 (Deep Concept Study - 2 hrs):** Sabse pehle "${primaryChap}" ke concepts padho aur 2-3 important formulas/definitions likh lo.
2. ☕ **Quick Break (15 mins):** Thoda stretch karo, paani piyo aur aankhon ko rest do.
3. ⚡ **Block 2 (Practice & PYQs - 1.5 hrs):** "${secondaryChap}" ke 5 previous year questions practice karo.
4. 📝 **Block 3 (Daily Tasks & Revision - 1 hr):**
${
  pendingTasks.length > 0
    ? pendingTasks.slice(0, 3).map((t) => `   • ${t.title}`).join("\n")
    : "   • Pending notes review karo aur formulas revise karo."
}
5. 🌙 **Night Wind-Down (20 mins):** Aaj jo padha usko dimag me recall karo aur kal ke liye ready ho jao!

💡 *Mentor Tip: Ek saath lambi padhai mat karo, 45-50 min ke baad 10 min break lene se focus 2x badh jata hai!*`;
    }

    case "explain_topic": {
      return `Haan ${profile.name}! Main concept ko ekdum simple Hinglish me explain kar deta hoon.

Batao kaunsa topic ya question samajhna hai?
Jaise hi topic doge, hum usko in 4 simple steps me clear karenge:
1. 💡 **Easy Concept:** 2 line me aasan bhasha me samjhayenge.
2. 🌟 **Real-Life Example:** Rozmarra ki zindagi ya relatable example se connect karenge.
3. 📌 **Exam Points & Formulae:** Jo board exam me likhna zaroori hai.
4. ✏️ **Step-by-Step Question:** Ek solved example taaki numericals/theory me marks na katein.

*Upar apna topic ya doubt likho, chalo milkar solve karte hain!*`;
    }

    case "weak_topics": {
      const weakChapters = chapters.filter((c) => c.isWeak);
      if (weakChapters.length === 0) {
        return `Shabash ${profile.name}! 🎉 Abhi tumhara koi bhi chapter weak mark nahi hai.

**Top Score banaye rakhne ke liye:**
- 📝 Roz 5-10 Past Year Questions (PYQs) solve karte raho.
- ⏱️ Exam Center me timed mock test do speed test karne ke liye.
- 🔄 Weekly revision loop maintain rakho.`;
      }

      return `Koi tension nahi ${profile.name}! Thoda extra dhyan dene se ye topics bhi super strong ho jayenge:

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

    case "revise": {
      const revisionQueue = chapters
        .filter((c) => c.revisionCount < 2 || c.isWeak)
        .slice(0, 4);

      if (revisionQueue.length === 0) {
        return `Bahut badhiya ${profile.name}! ✅ Tumhare active chapters ka multiple rounds revision ho chuka hai.

- Current Readiness Score: **${readinessScore}%**
- Ab bas light weekly review karte raho taaki concepts memory me lock rahein!`;
      }

      return `Revision se hi memory strong hoti hai ${profile.name}! 🔄

📌 **Aaj Ka Priority Revision Queue:**
${revisionQueue
  .map(
    (c, idx) => `**${idx + 1}. ${c.title}** (Revised: ${c.revisionCount}/3 baar)
   • Priority: ${c.priority} | Status: ${c.isWeak ? "Extra practice required" : "In Progress"}
   • Action: Formula sheet dekho aur 2 standard exam questions bina dekhe solve karo.`
  )
  .join("\n\n")}

*Revision complete hote hi Academic Center me 'Revised' mark kar dena!*`;
    }

    case "analyze_tests": {
      const allTestRecords = [
        ...tests.map((t) => ({ name: t.testName, pct: (t.score / (t.maxMarks || 1)) * 100 })),
        ...mockTests.map((m) => ({ name: m.testName, pct: (m.marksObtained / (m.maxMarks || 1)) * 100 })),
      ];

      if (allTestRecords.length === 0) {
        return `Hey ${profile.name}! Abhi koi test score log nahi hua hai.

Exam Center ya Academic Center me jaise hi mock test ya chapter quiz doge, hum yahan score trends aur mistake analysis discuss karenge!`;
      }

      const avgPct = Math.round(
        allTestRecords.reduce((a, b) => a + b.pct, 0) / allTestRecords.length
      );

      return `Chalo ${profile.name}, tumhari test performance analyze karte hain: 📊

- 📝 **Total Tests Logged:** ${allTestRecords.length}
- 📈 **Average Score:** ${avgPct}%
- 🎯 **Analysis:** ${
        avgPct >= 75
          ? "Zabardast score hai! Accuracy high hai, ab speed aur time management par focus karo."
          : "Steady progress chal rahi hai! Bas silly mistakes note down karo aur weak formulas revise karo."
      }

🚀 **Next Step:** Lowest scoring subject me ek 30-minute timed quiz lagao taaki confidence boost ho!`;
    }

    case "career_guidance": {
      const target = careerRoadmap.careerTitle || "Higher Studies";
      return `Sahi direction me aage badh rahe ho ${profile.name}! 🎯

📌 **Tumhara Career Goal:** **${target}** (${profile.stream} Stream • ${profile.board} Board)

**Mentor Guidance for Success:**
1. 🏆 **Board Exams Foundation:** Pehle apne core ${profile.stream} subjects me command banao, kyunki solid foundation se hi aage ke entrance exams crack hote hain.
2. 📚 **Key Subjects par focus:** ${target} ke liye jo main subjects zaroori hain, unme 85%+ score ka target rakho.
3. 🚀 **Roadmap Steps:** Career Center ke roadmap milestones ko month-by-month follow karte raho.

*Koi specific college, entrance exam ya subject selection ka doubt ho toh bejhijhak pucho!*`;
    }

    case "exam_coach": {
      return `Exam pass aa raha hai ${profile.name}, par ghabrane ki bilkul zaroorat nahi! 🏆

- 📋 **Exam:** ${examProfile.board} ${examProfile.classLevel}
- ⏳ **Days Left:** ${daysRemaining} Din
- 📈 **Readiness Score:** ${readinessScore}%

**Aaj Ka 3-Point Action Plan:**
1. ✅ Ek tough chapter ka formula chart bana kar room me paste karo.
2. 📝 Kam se kam 5 Past Year Questions (PYQs) solve karo.
3. 🧘 7-8 ghante ki proper neend zaroor lo taaki dimag fresh rahe.

*Consistency hi success ki key hai. Lag jaao, tum kar sakte ho!*`;
    }

    default: {
      const lowerPrompt = (userPrompt || "").toLowerCase();
      const matchedChapter = chapters.find(
        (c) =>
          lowerPrompt.includes(c.title.toLowerCase()) ||
          c.title.toLowerCase().includes(lowerPrompt.slice(0, 8))
      );
      const primarySubject = subjects[0]?.name || `${profile.stream} Core`;

      if (lowerPrompt.length > 3 && matchedChapter) {
        return `Namaste ${profile.name}! "${matchedChapter.title}" (${matchedChapter.subjectId}) ke baare me tumne pucha.

📌 **Study Mentor Quick Breakdown for ${matchedChapter.title}:**
1. 💡 **Core Fundamentals:** Pehle is chapter ki main definitions aur standard formula sheet review karo.
2. 🎯 **Exam Weightage:** Is topic se Board Exams me ${matchedChapter.priority === "VVI" ? "heavy 5-mark / long questions" : "direct objective & short numerical questions"} aate hain.
3. ✏️ **Action Step:** Pehle 2-3 solved examples dekho, fir 3 Past Year Questions (PYQs) solve karo.
4. 🔄 **Revision Tracker:** Complete hone ke baad Academic Center me iska progress update kar dena!

*Agar numerical me specific step ya formula me doubt hai, toh detail likho hum step-by-step decode karenge!*`;
      }

      if (
        lowerPrompt.includes("plan") ||
        lowerPrompt.includes("schedule") ||
        lowerPrompt.includes("time table") ||
        lowerPrompt.includes("aaj")
      ) {
        const pendingTasks = tasks.filter((t) => !t.completed);
        return `Haan ${profile.name}! Aaj ka balanced study plan ye raha:

🎯 **Target:** ${examProfile.dailyStudyHours || 4} Ghante | ⏳ **Days to Exam:** ${daysRemaining} Days

1. 🌅 **Session 1 (Focus):** Core ${profile.stream} ke sabse important chapter ka theory padho.
2. ⚡ **Session 2 (PYQs):** 5 Previous Year Questions practice karo.
3. 📝 **Session 3 (Tasks):** ${
          pendingTasks.length > 0
            ? pendingTasks.slice(0, 2).map((t) => `\n   • ${t.title}`).join("")
            : "Formula revision & notes check."
        }

*Consistency is everything. Chalo shuru karte hain!*`;
      }

      return `Namaste ${profile.name}! 😊 Main hoon tumhara Study Mentor Abya (${profile.classLevel} ${profile.stream} • ${profile.board}).

Kaise chal rahi hai taiyari? 
- 📈 **Exam Readiness:** ${readinessScore}%
- ⏳ **Days Left:** ${daysRemaining} Days
- 📚 **Focus Subject:** ${primarySubject}

Tum mujhse koi bhi concept explanation, study plan, numericals ya PYQ strategy puch sakte ho!`;
    }
  }
};
