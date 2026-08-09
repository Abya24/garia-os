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
      actionTab: "academic",
    });
  } else {
    cards.push({
      id: "card-priority",
      type: "priority",
      title: "🔥 Daily Priority",
      recommendation: "All chapters currently on track!",
      reason: "Continue maintaining regular chapter completion and practice.",
      actionText: "Academic Center",
      actionTab: "academic",
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
      actionText: "Mark Revised",
      actionTab: "academic",
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
 * Deterministic Rule-Based Fallback Generator for Abya AI
 */
export const generateAbyaFallbackResponse = (
  actionType: AbyaQuickActionType | "general",
  userPrompt: string,
  data: ActiveStudentData
): string => {
  const {
    profile,
    tasks,
    chapters,
    tests,
    mockTests,
    examProfile,
    careerRoadmap,
    daysRemaining,
    readinessScore,
  } = data;

  const prefix = `[Offline Local Intelligence Fallback for ${profile.name}]\n\n`;

  switch (actionType) {
    case "plan_day": {
      const pendingTasks = tasks.filter((t) => !t.completed);
      const weakOrVvi = chapters.filter((c) => c.isWeak || c.priority === "VVI").slice(0, 3);

      return `${prefix}📅 **Smart Daily Plan for ${profile.name} (${profile.classLevel} ${profile.stream})**
Target Hours Today: ${examProfile.dailyStudyHours} hrs | Days to Exam: ${daysRemaining} Days

**Recommended Schedule:**
- 🌅 **Block 1 (Concept Study - 2 hrs):** Focus on ${
        weakOrVvi[0] ? `"${weakOrVvi[0].title}"` : "your core syllabus topics"
      }. Read theory & write key formulas/definitions.
- ☕ **Break (15 mins):** Stretch, drink water, and reset.
- ⚡ **Block 2 (Revision & PYQs - 1.5 hrs):** Revise ${
        weakOrVvi[1] ? `"${weakOrVvi[1].title}"` : "previous chapter notes"
      } and solve 5-10 Past Year Questions.
- 🍎 **Rest & Meal Break (45 mins)**
- 📝 **Block 3 (Task Completion & Practice - 1.5 hrs):**
${
  pendingTasks.length > 0
    ? pendingTasks.map((t) => `  • Task: ${t.title}`).join("\n")
    : "  • Complete remaining chapter practice problems and review test notes."
}
- 🌙 **Evening Review (30 mins):** Quick memory audit & plan for tomorrow.

*Tip: Stick to this balanced plan with proper breaks to prevent burnout!*`;
    }

    case "explain_topic": {
      return `${prefix}📚 **Concept Tutor Mode**

To explain a topic tailored for ${profile.classLevel} (${profile.board} ${profile.stream}):

1. **Simple Explanation:** Ask me a specific term (e.g. "Ratio Analysis", "Newton's Laws", "Partnership Goodwill", or "Organic Mechanisms").
2. **Real-World Analogy:** I will connect the concept to everyday examples.
3. **Key Points:** 3 to 5 core points to memorize for exams.
4. **Example Problem:** Step-by-step solved sample.
5. **Quick Check Question:** Test your understanding!

*Type your question or topic above to get a full explanation!*`;
    }

    case "weak_topics": {
      const weakChapters = chapters.filter((c) => c.isWeak);
      if (weakChapters.length === 0) {
        return `${prefix}🔥 **Weak Topic Coach for ${profile.name}**

🎉 **Great job!** You currently have 0 chapters marked as weak.

**Recommendations to maintain top performance:**
- Continue solving Previous Year Questions (PYQs).
- Take timed mock tests in the Exam Center.
- Conduct weekly revision to lock in long-term memory.`;
      }

      return `${prefix}🔥 **Weak Topic Coach for ${profile.name}**
Identified ${weakChapters.length} chapter(s) that **need more practice**:

${weakChapters
  .map(
    (c, idx) => `**${idx + 1}. ${c.title}**
- 📌 *Why attention is needed:* Marked for extra reinforcement in ${c.subjectId}.
- 💡 *What to study:* Re-read foundational textbook notes & formulas.
- ✏️ *Practice advice:* Solve 5 basic numericals/questions before moving to PYQs.
- ⏰ *Revision timing:* Schedule a 30-minute review session within 48 hours.`
  )
  .join("\n\n")}

*Remember: Supportive practice leads to mastery!*`;
    }

    case "revise": {
      const revisionQueue = chapters
        .filter((c) => c.revisionCount < 2 || c.isWeak)
        .slice(0, 4);

      if (revisionQueue.length === 0) {
        return `${prefix}🔄 **Revision Coach for ${profile.name}**

✅ All active chapters have been revised at least twice!
- Keep doing light weekly reviews to maintain your readiness score of **${readinessScore}%**.`;
      }

      return `${prefix}🔄 **Prioritized Revision Queue for ${profile.name}**

${revisionQueue
  .map(
    (c, idx) => `**${idx + 1}. ${c.title}** (Revisions: ${c.revisionCount}/3)
- Priority: ${c.priority} | Status: ${c.isWeak ? "Needs extra practice" : "In Progress"}
- Action: Review formula summary & solve 3 key past exam questions.`
  )
  .join("\n\n")}

*Open Academic Center to mark revision progress once done!*`;
    }

    case "analyze_tests": {
      const allTestRecords = [
        ...tests.map((t) => ({ name: t.testName, pct: (t.score / (t.maxMarks || 1)) * 100 })),
        ...mockTests.map((m) => ({ name: m.testName, pct: (m.marksObtained / (m.maxMarks || 1)) * 100 })),
      ];

      if (allTestRecords.length === 0) {
        return `${prefix}📝 **Test Analyst:**
Not enough test data yet. Log mock tests or chapter quizzes in the Exam/Academic Center to see AI score trends and topic insights.`;
      }

      const avgPct = Math.round(
        allTestRecords.reduce((a, b) => a + b.pct, 0) / allTestRecords.length
      );

      return `${prefix}📝 **Test Performance Analysis for ${profile.name}**

- 📊 **Total Tests Taken:** ${allTestRecords.length}
- 📈 **Average Score:** ${avgPct}%
- 🎯 **Recent Trend:** ${
        avgPct >= 75
          ? "Strong performance — ready for advanced exam mocks!"
          : "Steady progress — focus on weak chapters to boost accuracy."
      }

**Recommended Next Action:**
- Take a timed 30-minute Mock Test in your lowest scoring subject to build exam stamina.`;
    }

    case "career_guidance": {
      const target = careerRoadmap.careerTitle || "Higher Education";
      return `${prefix}🎯 **Career-Aware Academic Guidance**
Student Goal: **${target}** (${profile.stream} Stream | ${profile.board} Board)

**Strategic Priority Alignment:**
1. 🏆 **Board Exam First:** Always ensure core ${profile.stream} subjects are thoroughly prepared for your ${profile.board} Board Exams.
2. 📚 **Career Subjects:** Focus extra attention on key subjects aligned with ${target}.
3. 🚀 **Roadmap Milestones:** Keep completing steps in your Career Center roadmap alongside daily studies.

*Need specific guidance? Ask Abya AI about courses, competitive entrance exams, or subject choices!*`;
    }

    case "exam_coach": {
      return `${prefix}🏆 **Exam Coach Summary for ${profile.name}**
- 📋 **Exam:** ${examProfile.board} ${examProfile.classLevel} Board Exam
- ⏳ **Countdown:** ${daysRemaining} Days Remaining
- 📈 **Exam Readiness Score:** ${readinessScore}%

**Today's Focus Checklist:**
1. ✅ Complete 1 revision block from your revision queue.
2. 📝 Solve at least 5 Past Year Questions (PYQs).
3. 🎯 Focus on your highest weightage VVI topics.

*Stay disciplined, rest well, and keep progressing step by step!*`;
    }

    default: {
      return `${prefix}Hello ${profile.name}! I am Abya AI, your AI study coach for ${profile.classLevel} (${profile.board} - ${profile.stream}).

How can I help you today with your studies, tasks, revision, or career strategy? You can also use the Quick Action buttons above!`;
    }
  }
};
