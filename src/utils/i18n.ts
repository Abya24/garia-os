export type AppLanguage = "en" | "hi";

export interface TranslationStrings {
  appName: string;
  tagline: string;
  addNewProfileBtn: string;
  studentNameLabel: string;
  studentNamePlaceholder: string;
  boardLabel: string;
  languageLabel: string;
  classLabel: string;
  streamLabel: string;
  saveBtn: string;
  cancelBtn: string;
  switchProfileBtn: string;
  activeProfileTag: string;
  searchPlaceholder: string;
  editBtn: string;
  deleteBtn: string;
  confirmDeleteText: string;

  // Navigation
  navHome: string;
  navAcademics: string;
  navQuestionBank: string;
  navAbyaAI: string;
  navCareerCenter: string;
  navExamIntelligence: string;
  navStudyTracker: string;
  navTaskManager: string;
  navNotes: string;
  navFocusTimer: string;
  navHabits: string;
  navWater: string;
  navAnalytics: string;
  navSettings: string;
  navDownload: string;
  navProfile: string;
  moreApps: string;

  // Dashboard
  welcomeGreeting: string;
  academicOverview: string;
  todayTarget: string;
  studyStreak: string;
  focusMinutes: string;
  completedTasks: string;
  quickActions: string;
  targetExamCountdown: string;
  weaknessAlert: string;
  abyaStudyPartner: string;
  recentChapters: string;
  resumeStudyBtn: string;
  askAbyaQuickBtn: string;
  dailyMotivation: string;

  // Academics
  academicTitle: string;
  academicSubtitle: string;
  syllabusProgress: string;
  streamSubjects: string;
  chaptersCount: string;
  topicsCount: string;
  vviTopics: string;
  smartPlan: string;
  revisionTracker: string;
  practiceHub: string;
  roadmapStage: string;
  markCompleted: string;
  inProgress: string;
  notStarted: string;
  tested: string;
  pending: string;
  highPriority: string;
  important: string;
  normalPriority: string;
  addChapter: string;
  viewDetails: string;

  // Question Bank
  questionBankTitle: string;
  questionBankSubtitle: string;
  totalQuestions: string;
  accuracy: string;
  tabMCQ: string;
  tabQuiz: string;
  tabPYQ: string;
  tabPractice: string;
  tabVVI: string;
  tabRevision: string;
  tabChapterTest: string;
  explanation: string;
  previousQuestion: string;
  nextQuestion: string;
  submitTest: string;
  scoreCard: string;
  solvedStatus: string;
  unsolvedStatus: string;
  startQuizBtn: string;
  askAbyaSolveBtn: string;
  officialSolution: string;

  // Career Center
  careerTitle: string;
  careerSubtitle: string;
  tabMatches: string;
  tabGovtJobs: string;
  tabScholarships: string;
  tabStudyAbroad: string;
  tabAIAdvisor: string;
  tabAssessment: string;
  tabCompare: string;
  tabRoadmap: string;
  matchScore: string;
  careerPathway: string;
  eligibility: string;
  keySkills: string;
  salaryTier: string;
  selectionStages: string;
  startAptitudeQuiz: string;
  selectTargetCareer: string;

  // Abya AI
  abyaTitle: string;
  abyaSubtitle: string;
  abyaPlaceholder: string;
  askAbyaPrompt: string;
  clearChat: string;
  quickQuestionsTitle: string;
  voiceInputTitle: string;

  // Settings & Profile
  settingsTitle: string;
  settingsSubtitle: string;
  themeLabel: string;
  languageSelectTitle: string;
  profilesManagement: string;
  exportDataBtn: string;
  importDataBtn: string;
  resetAllDataBtn: string;
  aboutGariaOS: string;
  versionLabel: string;
  notificationsTitle: string;
  notificationsActive: string;
  notificationsMuted: string;

  // Convenient Aliases
  home: string;
  homeDashboard: string;
  academics: string;
  questionBank: string;
  abyaAICoach: string;
  abyaAI: string;
  careerCenter: string;
  examIntelligence: string;
  studyTracker: string;
  taskManager: string;
  notes: string;
  focusTimer: string;
  habits: string;
  waterTracker: string;
  analytics: string;
  downloadAPK: string;
  settings: string;
  profile: string;
  studentProfiles: string;
  language: string;
  notifications: string;
  search: string;
  more: string;
  cancel: string;
}

export const translations: Record<AppLanguage, TranslationStrings> = {
  en: {
    appName: "Garia OS",
    tagline: "Academic & Career Operating System",
    addNewProfileBtn: "Add Student Profile",
    studentNameLabel: "Student Name",
    studentNamePlaceholder: "e.g., Aarav Sharma",
    boardLabel: "Educational Board",
    languageLabel: "Preferred Language",
    classLabel: "Target Academic Class",
    streamLabel: "Academic Stream",
    saveBtn: "Save Profile",
    cancelBtn: "Cancel",
    switchProfileBtn: "Switch Profile",
    activeProfileTag: "Active",
    searchPlaceholder: "Search subjects, questions, notes...",
    editBtn: "Edit",
    deleteBtn: "Delete",
    confirmDeleteText: "Are you sure you want to delete this profile?",

    // Navigation
    navHome: "Dashboard",
    navAcademics: "Academics",
    navQuestionBank: "Question Bank",
    navAbyaAI: "Abya AI",
    navCareerCenter: "Career Center",
    navExamIntelligence: "Exam Intelligence",
    navStudyTracker: "Study Tracker",
    navTaskManager: "Task Manager",
    navNotes: "Notes & Docs",
    navFocusTimer: "Focus Timer",
    navHabits: "Habits Tracker",
    navWater: "Water Tracker",
    navAnalytics: "Analytics",
    navSettings: "Settings",
    navDownload: "Download App",
    navProfile: "Profile",
    moreApps: "More Apps",

    // Dashboard
    welcomeGreeting: "Welcome back",
    academicOverview: "Academic Overview",
    todayTarget: "Today's Study Goal",
    studyStreak: "Study Streak",
    focusMinutes: "Focus Time",
    completedTasks: "Tasks Done",
    quickActions: "Quick Actions",
    targetExamCountdown: "Target Exam Countdown",
    weaknessAlert: "Weak Area Radar",
    abyaStudyPartner: "Abya AI Study Partner",
    recentChapters: "Current Subjects & Chapters",
    resumeStudyBtn: "Resume Studying",
    askAbyaQuickBtn: "Ask Abya Doubt Solver",
    dailyMotivation: "Daily Academic Motivation",

    // Academics
    academicTitle: "Academic Center",
    academicSubtitle: "Class & Stream Isolated Curriculum, Smart Study Plan & Progress Engine",
    syllabusProgress: "Syllabus Completed",
    streamSubjects: "Stream Subjects",
    chaptersCount: "Chapters",
    topicsCount: "Topics",
    vviTopics: "VVI High-Yield Topics",
    smartPlan: "Smart Study Plan",
    revisionTracker: "Revision Engine",
    practiceHub: "Practice Sessions",
    roadmapStage: "Academic Stage Roadmap",
    markCompleted: "Completed",
    inProgress: "In Progress",
    notStarted: "Not Started",
    tested: "Tested",
    pending: "Pending",
    highPriority: "VVI High Yield",
    important: "Important",
    normalPriority: "Standard",
    addChapter: "Add Chapter",
    viewDetails: "View Details",

    // Question Bank
    questionBankTitle: "Question Bank & PYQs",
    questionBankSubtitle: "Board & Competitive Verified Question Hub with Instant Solutions & AI Assistance",
    totalQuestions: "Total Pool",
    accuracy: "Accuracy",
    tabMCQ: "Topic MCQs",
    tabQuiz: "Timed Quiz",
    tabPYQ: "Verified PYQs",
    tabPractice: "Practice Bank",
    tabVVI: "VVI High-Yield",
    tabRevision: "Rapid Revision",
    tabChapterTest: "Chapter Tests",
    explanation: "Detailed Explanation",
    previousQuestion: "Previous",
    nextQuestion: "Next",
    submitTest: "Submit Test",
    scoreCard: "Quiz Performance Card",
    solvedStatus: "Solved",
    unsolvedStatus: "Unsolved",
    startQuizBtn: "Start Quiz",
    askAbyaSolveBtn: "Ask Abya to Explain",
    officialSolution: "Official Verified Solution",

    // Career Center
    careerTitle: "Career Center & Stream Pathways",
    careerSubtitle: "Aptitude Analysis, Stream Alignment & High-Yield Career Roadmaps",
    tabMatches: "Career Matches",
    tabGovtJobs: "Govt & Public Exams",
    tabScholarships: "Scholarships",
    tabStudyAbroad: "Study Abroad",
    tabAIAdvisor: "AI Career Advisor",
    tabAssessment: "Aptitude Assessment",
    tabCompare: "Compare Careers",
    tabRoadmap: "Step-by-Step Roadmap",
    matchScore: "Match Fit",
    careerPathway: "Study Pathway",
    eligibility: "Eligibility",
    keySkills: "Core Skills",
    salaryTier: "Expected Salary",
    selectionStages: "Selection Stages",
    startAptitudeQuiz: "Take Aptitude Quiz",
    selectTargetCareer: "Set Target Career",

    // Abya AI
    abyaTitle: "Abya AI Study Coach",
    abyaSubtitle: "Your 24/7 Personal Academic Tutor & Career Mentor",
    abyaPlaceholder: "Ask Abya any question, numerical problem, or formula derivation...",
    askAbyaPrompt: "Ask Abya",
    clearChat: "Clear Conversation",
    quickQuestionsTitle: "Quick Help Prompts",
    voiceInputTitle: "Voice Dictation",

    // Settings & Profile
    settingsTitle: "Settings & System Preferences",
    settingsSubtitle: "Manage your profile, language, data backup and app customization",
    themeLabel: "Theme & Appearance",
    languageSelectTitle: "Application Language",
    profilesManagement: "Student Profiles Management",
    exportDataBtn: "Export Profile (JSON)",
    importDataBtn: "Import Profile (JSON)",
    resetAllDataBtn: "Reset Local Session",
    aboutGariaOS: "About Garia OS",
    versionLabel: "Version",
    notificationsTitle: "Notifications & Reminders",
    notificationsActive: "Notifications are Active",
    notificationsMuted: "Notifications are Muted",

    // Convenient Aliases
    home: "Home",
    homeDashboard: "Home Dashboard",
    academics: "Academic Center",
    questionBank: "Question Bank",
    abyaAICoach: "Abya AI Coach",
    abyaAI: "Abya AI",
    careerCenter: "Career Center",
    examIntelligence: "Exam Intelligence",
    studyTracker: "Study Tracker",
    taskManager: "Task Manager",
    notes: "Notes & Docs",
    focusTimer: "Focus Timer",
    habits: "Habits Tracker",
    waterTracker: "Water Tracker",
    analytics: "Analytics",
    downloadAPK: "Download APK",
    settings: "Settings",
    profile: "Profile",
    studentProfiles: "Student Profiles",
    language: "Language",
    notifications: "Notifications",
    search: "Search",
    more: "More Apps",
    cancel: "Cancel",
  },
  hi: {
    appName: "गारिया ओएस",
    tagline: "अकादमिक एवं करियर ऑपरेटिंग सिस्टम",
    addNewProfileBtn: "नया छात्र प्रोफ़ाइल जोड़ें",
    studentNameLabel: "छात्र का नाम",
    studentNamePlaceholder: "उदा., आरव शर्मा",
    boardLabel: "शिक्षा बोर्ड",
    languageLabel: "पसंदीदा भाषा",
    classLabel: "कक्षा स्तर",
    streamLabel: "अध्ययन संकाय (Stream)",
    saveBtn: "प्रोफ़ाइल सहेजें",
    cancelBtn: "रद्द करें",
    switchProfileBtn: "प्रोफ़ाइल बदलें",
    activeProfileTag: "सक्रिय",
    searchPlaceholder: "विषय, प्रश्न, नोट्स खोजें...",
    editBtn: "संपादित करें",
    deleteBtn: "हटाएं",
    confirmDeleteText: "क्या आप वाकई इस प्रोफ़ाइल को हटाना चाहते हैं?",

    // Navigation
    navHome: "डैशबोर्ड",
    navAcademics: "अकादमिक",
    navQuestionBank: "प्रश्न बैंक",
    navAbyaAI: "अब्या एआई",
    navCareerCenter: "करियर केंद्र",
    navExamIntelligence: "परीक्षा इंटेलिजेंस",
    navStudyTracker: "अध्ययन ट्रैकर",
    navTaskManager: "कार्य प्रबंधक",
    navNotes: "नोट्स एवं दस्तावेज़",
    navFocusTimer: "फोकस टाइमर",
    navHabits: "आदत ट्रैकर",
    navWater: "जल ट्रैकर",
    navAnalytics: "विश्लेषण",
    navSettings: "सेटिंग्स",
    navDownload: "ऐप डाउनलोड",
    navProfile: "प्रोफ़ाइल",
    moreApps: "अन्य टूल्स",

    // Dashboard
    welcomeGreeting: "स्वागत है",
    academicOverview: "अकादमिक सारांश",
    todayTarget: "आज का अध्ययन लक्ष्य",
    studyStreak: "अध्ययन स्ट्रीक",
    focusMinutes: "फोकस समय",
    completedTasks: "पूर्ण कार्य",
    quickActions: "त्वरित क्रियाएं",
    targetExamCountdown: "लक्ष्य परीक्षा उलटी गिनती",
    weaknessAlert: "कमजोर विषय रडार",
    abyaStudyPartner: "अब्या एआई अध्ययन साथी",
    recentChapters: "वर्तमान विषय एवं अध्याय",
    resumeStudyBtn: "अध्ययन जारी रखें",
    askAbyaQuickBtn: "अब्या से संदेह पूछें",
    dailyMotivation: "दैनिक अकादमिक प्रेरणा",

    // Academics
    academicTitle: "अकादमिक केंद्र",
    academicSubtitle: "कक्षा एवं संकाय आधारित पाठ्यक्रम, स्मार्ट अध्ययन योजना एवं प्रगति इंजन",
    syllabusProgress: "पाठ्यक्रम पूर्णता",
    streamSubjects: "संकाय के विषय",
    chaptersCount: "अध्याय",
    topicsCount: "विषय बिंदु",
    vviTopics: "अति महत्वपूर्ण (VVI) बिंदु",
    smartPlan: "स्मार्ट अध्ययन योजना",
    revisionTracker: "पुनरीक्षण इंजन",
    practiceHub: "अभ्यास सत्र",
    roadmapStage: "अकादमिक रोडमैप",
    markCompleted: "पूर्ण",
    inProgress: "जारी है",
    notStarted: "प्रारंभ नहीं हुआ",
    tested: "परीक्षित",
    pending: "लंबित",
    highPriority: "अति महत्वपूर्ण (VVI)",
    important: "महत्वपूर्ण",
    normalPriority: "सामान्य",
    addChapter: "अध्याय जोड़ें",
    viewDetails: "विवरण देखें",

    // Question Bank
    questionBankTitle: "प्रश्न बैंक एवं PYQs",
    questionBankSubtitle: "बोर्ड और प्रतियोगी परीक्षा प्रश्न बैंक, समाधान एवं एआई मार्गदर्शन",
    totalQuestions: "कुल प्रश्न",
    accuracy: "सटीकता",
    tabMCQ: "विषयवार MCQs",
    tabQuiz: "समयबद्ध क्विज़",
    tabPYQ: "सत्यापित PYQs",
    tabPractice: "अभ्यास प्रश्न",
    tabVVI: "अति महत्वपूर्ण (VVI)",
    tabRevision: "त्वरित पुनरीक्षण",
    tabChapterTest: "अध्याय टेस्ट",
    explanation: "विस्तृत व्याख्या",
    previousQuestion: "पिछला",
    nextQuestion: "अगला",
    submitTest: "टेस्ट सबमिट करें",
    scoreCard: "क्विज़ परिणाम कार्ड",
    solvedStatus: "हल किया हुआ",
    unsolvedStatus: "अनसुलझा",
    startQuizBtn: "क्विज़ शुरू करें",
    askAbyaSolveBtn: "अब्या से समझें",
    officialSolution: "सत्यापित आधिकारिक समाधान",

    // Career Center
    careerTitle: "करियर केंद्र एवं संकाय मार्ग",
    careerSubtitle: "योग्यता विश्लेषण, संकाय मिलान एवं करियर रोडमैप",
    tabMatches: "करियर मिलान",
    tabGovtJobs: "सरकारी एवं प्रतियोगी परीक्षाएं",
    tabScholarships: "छात्रवृत्तियां",
    tabStudyAbroad: "विदेश अध्ययन",
    tabAIAdvisor: "एआई करियर सलाहकार",
    tabAssessment: "योग्यता मूल्यांकन",
    tabCompare: "करियर तुलना",
    tabRoadmap: "चरणबद्ध रोडमैप",
    matchScore: "अनुकूलता स्कोर",
    careerPathway: "अध्ययन मार्ग",
    eligibility: "पात्रता",
    keySkills: "आवश्यक कौशल",
    salaryTier: "अनुमानित वेतन",
    selectionStages: "चयन प्रक्रिया के चरण",
    startAptitudeQuiz: "योग्यता क्विज़ शुरू करें",
    selectTargetCareer: "लक्ष्य करियर चुनें",

    // Abya AI
    abyaTitle: "अब्या एआई अध्ययन कोच",
    abyaSubtitle: "आपका 24/7 व्यक्तिगत अकादमिक शिक्षक एवं करियर मार्गदर्शक",
    abyaPlaceholder: "अब्या से कोई भी प्रश्न, गणितीय सवाल या सूत्र पूछें...",
    askAbyaPrompt: "अब्या से पूछें",
    clearChat: "बातचीत हटाएं",
    quickQuestionsTitle: "त्वरित सहायता प्रश्न",
    voiceInputTitle: "आवाज से बोलें",

    // Settings & Profile
    settingsTitle: "सेटिंग्स एवं सिस्टम प्राथमिकताएं",
    settingsSubtitle: "अपनी प्रोफ़ाइल, भाषा, डेटा बैकअप और ऐप कस्टमाइज़ेशन प्रबंधित करें",
    themeLabel: "थीम एवं दृश्य स्वरूप",
    languageSelectTitle: "एप्लिकेशन भाषा",
    profilesManagement: "छात्र प्रोफ़ाइल प्रबंधन",
    exportDataBtn: "प्रोफ़ाइल निर्यात करें (JSON)",
    importDataBtn: "प्रोफ़ाइल आयात करें (JSON)",
    resetAllDataBtn: "स्थानीय सत्र रीसेट करें",
    aboutGariaOS: "गारिया ओएस के बारे में",
    versionLabel: "संस्करण",
    notificationsTitle: "सूचनाएं एवं अनुस्मारक",
    notificationsActive: "सूचनाएं सक्रिय हैं",
    notificationsMuted: "सूचनाएं बंद हैं",

    // Convenient Aliases
    home: "होम",
    homeDashboard: "होम डैशबोर्ड",
    academics: "अकादमिक केंद्र",
    questionBank: "प्रश्न बैंक",
    abyaAICoach: "अब्या एआई कोच",
    abyaAI: "अब्या एआई",
    careerCenter: "करियर केंद्र",
    examIntelligence: "परीक्षा इंटेलिजेंस",
    studyTracker: "अध्ययन ट्रैकर",
    taskManager: "कार्य प्रबंधक",
    notes: "नोट्स एवं डॉक्स",
    focusTimer: "फोकस टाइमर",
    habits: "आदत ट्रैकर",
    waterTracker: "जल ट्रैकर",
    analytics: "एनालिटिक्स",
    downloadAPK: "एपीके डाउनलोड",
    settings: "सेटिंग्स",
    profile: "प्रोफ़ाइल",
    studentProfiles: "विद्यार्थी प्रोफ़ाइल",
    language: "भाषा",
    notifications: "सूचनाएं",
    search: "खोजें",
    more: "अन्य ऐप्स",
    cancel: "रद्द करें",
  },
};

const LANGUAGE_STORAGE_KEY = "garia_app_language";

export function getStoredLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "hi" || saved === "en") {
      return saved;
    }
  } catch (e) {
    console.error(e);
  }
  return "en";
}

export function saveStoredLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    console.error(e);
  }
}
