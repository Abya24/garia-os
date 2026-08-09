export type Priority = "high" | "medium" | "low";
export type TaskCategory = "study" | "personal" | "work" | "other";

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  priority: Priority;
  category: TaskCategory;
  completed: boolean;
  createdAt: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  targetMinutesPerWeek: number;
  completedMinutes: number;
  totalSessions: number;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  durationSeconds: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
  notes?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface Habit {
  id: string;
  title: string;
  category: "study" | "health" | "mindset" | "other";
  iconName?: string;
  streak: number;
  completedDates: string[]; // YYYY-MM-DD strings
  createdAt: number;
}

export interface WaterLog {
  date: string; // YYYY-MM-DD
  glasses: number;
  goal: number;
}

export interface FocusSessionLog {
  id: string;
  type: "focus" | "break";
  durationMinutes: number;
  completedAt: number;
  date: string; // YYYY-MM-DD
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  subjectId?: string;
  targetDate: string; // YYYY-MM-DD
  progress: number; // 0 to 100
  completed: boolean;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  category: "event" | "exam" | "deadline" | "reminder";
  completed?: boolean;
  createdAt: number;
}

export interface AbyaMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
  isError?: boolean;
  isFallback?: boolean;
}

export type AbyaQuickActionType =
  | "plan_day"
  | "explain_topic"
  | "weak_topics"
  | "revise"
  | "analyze_tests"
  | "career_guidance"
  | "exam_coach";

export interface AbyaInsightCard {
  id: string;
  type: "priority" | "revision" | "test" | "exam" | "career";
  title: string;
  recommendation: string;
  reason: string;
  actionText?: string;
  actionTab?: ActiveTab;
}

export interface UserSettings {
  userName: string;
  theme: "dark" | "light" | "system";
  customApiKey: string;
  notificationsEnabled: boolean;
  waterGoal: number;
  defaultFocusDuration: number;
  defaultBreakDuration: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  classLevel: string;
  stream: StreamType;
  board: ExamBoard | string;
  avatarColor?: string;
  createdAt: number;
  updatedAt: number;
}

export type StreamType = "Commerce" | "Science" | "Arts / Humanities" | "Arts";

export interface CareerAssessment {
  strongSubjects: string[];
  interests: string[];
  skills: string[];
  workAreas: string[];
  careerGoals: string[];
  studyPreference: string;
}

export interface CareerProfile {
  stream: StreamType;
  currentClass: string;
  selectedCareerId?: string;
  updatedAt: number;
}

export interface CareerOption {
  id: string;
  title: string;
  stream: StreamType;
  category: string;
  description: string;
  duration: string;
  studyPathway: string;
  requiredSubjects: string[];
  keySkills: string[];
  workAreas: string[];
  courseStages: string[];
  whyMatchTags: string[];
}

export interface CareerQuizAnswers {
  favoriteSubjects: string[];
  strongSubjects: string[];
  problemSolvingPref: string;
  creativityLevel: number;
  communicationLevel: number;
  numbersInterest: number;
  scienceTechInterest: number;
  businessFinanceInterest: number;
  lawGovInterest: number;
  peopleHelpingInterest: number;
  researchInterest: number;
  preferredWorkAreas?: string[];
  updatedAt?: number;
}

export interface CareerMatchResult {
  career: CareerOption;
  matchScore: number;
  whyMatches: string[];
  relevantStrengths: string[];
  areasToExplore: string[];
  alternativeCareers?: CareerOption[];
}

export interface Milestone {
  id: string;
  title: string;
  stage: string;
  description: string;
  completed: boolean;
  targetTimeframe?: string;
}

export interface CareerRoadmap {
  careerId: string;
  careerTitle: string;
  stream: StreamType;
  currentClass: string;
  milestones: Milestone[];
  lastUpdated: number;
}

export type ChapterPriority = "VVI" | "Important" | "Normal";

export interface AcademicSubject {
  id: string;
  name: string;
  stream: StreamType;
  color: string;
  isCustom?: boolean;
}

export interface AcademicChapter {
  id: string;
  subjectId: string;
  chapterNumber: number;
  title: string;
  topics: string[];
  status: "Not Started" | "In Progress" | "Completed";
  priority: ChapterPriority;
  isWeak: boolean;
  pyqStatus: "Completed" | "Pending";
  revisionCount: number; // 0, 1, 2, 3
  lastRevisedAt?: number;
  nextRevisionDue?: number;
  notes?: string;
  testStatus: "Tested" | "Pending";
}

export interface AcademicTest {
  id: string;
  subjectId: string;
  chapterId?: string;
  testName: string;
  score: number;
  maxMarks: number;
  date: string;
  notes?: string;
}

export interface AcademicVVITopic {
  id: string;
  subjectId: string;
  subjectName: string;
  chapterTitle: string;
  topicName: string;
  priority: ChapterPriority;
  status: "Not Started" | "In Progress" | "Completed";
  revisionCount: number;
  lastRevisedAt?: number;
  nextRevisionDue?: number;
  notes?: string;
  createdAt: number;
}

export interface AcademicRevisionItem {
  id: string;
  subjectId: string;
  subjectName: string;
  chapterId?: string;
  chapterTitle: string;
  topicName?: string;
  priority: ChapterPriority;
  scheduledDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: number;
  notes?: string;
  createdAt: number;
}

export interface AcademicPracticeSession {
  id: string;
  subjectId: string;
  subjectName: string;
  chapterId?: string;
  chapterTitle: string;
  practiceType: "PYQ" | "Mock Test" | "Chapter Test" | "Practice Set";
  date: string; // YYYY-MM-DD
  score: number;
  maxMarks: number;
  accuracyPercentage: number;
  notes?: string;
  createdAt: number;
}

export type RoadmapStageStatus = "Not Started" | "In Progress" | "Almost Done" | "Completed";

export interface AcademicRoadmapStage {
  id: string;
  title: string;
  description: string;
  status: RoadmapStageStatus;
  progress: number; // 0-100
  pendingItems: string[];
  completedItems: string[];
  suggestedAction: string;
}

export interface AcademicRoadmapData {
  classLevel: string;
  stream: StreamType;
  targetCareerTitle?: string;
  overallProgress: number; // 0-100
  stages: AcademicRoadmapStage[];
  lastCalculated: number;
}

export interface SmartStudySlot {
  id: string;
  timeSlot: string;
  subjectName: string;
  chapterTitle: string;
  activityType: "Study" | "Revision" | "PYQ Practice" | "Test" | "Break";
  priorityLevel: "🔥 High Priority" | "⚡ Medium Priority" | "✅ On Track";
  reasoning: string;
}

export interface SmartStudyPlan {
  id: string;
  generatedDate: string;
  targetHours: number;
  slots: SmartStudySlot[];
}

// ==========================================
// ==========================================
// GARIA OS v1.9 EXAM INTELLIGENCE & ANALYTICS TYPES
// ==========================================

export interface ExamTestRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  testName: string;
  date: string; // YYYY-MM-DD
  maxMarks: number;
  marksObtained: number;
  totalQuestions?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  unattemptedQuestions?: number;
  timeTakenMinutes?: number;
  notes?: string;
  createdAt: number;
}

export type PerformanceTrend = "Improving" | "Stable" | "Declining" | "Insufficient Data";
export type SubjectPerformanceStatus = "Strong" | "Average" | "Needs Attention" | "Insufficient Data";

export interface SubjectPerformanceAnalysis {
  subjectId: string;
  subjectName: string;
  avgPercentage: number;
  bestPercentage: number;
  latestPercentage: number;
  testCount: number;
  accuracy: number;
  attemptRate: number;
  trend: PerformanceTrend;
  status: SubjectPerformanceStatus;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnattempted: number;
  syllabusCoverage: number; // 0-100
  vviCompletionRate: number; // 0-100
  revisionCompletionRate: number; // 0-100
  isCareerPriority: boolean;
}

export interface WeakAreaItem {
  id: string;
  subjectId: string;
  subjectName: string;
  areaTitle: string;
  reason: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  metricDetail?: string;
  suggestedAction: string;
  targetTab?: string;
}

export interface ExamIntelligenceReport {
  overallReadinessScore: number | null;
  readinessCategory: "Needs Attention" | "Building" | "Good Progress" | "Strong Preparation" | "Not enough data";
  hasSufficientData: boolean;
  totalTestsRecorded: number;
  strongSubjects: SubjectPerformanceAnalysis[];
  weakSubjects: SubjectPerformanceAnalysis[];
  subjectAnalyses: SubjectPerformanceAnalysis[];
  weakAreas: WeakAreaItem[];
  priorityTopics: { topic: string; subjectName: string; priority: string; reason: string }[];
  recommendedRevisions: { subjectName: string; chapterOrTopic: string; reason: string }[];
  recommendedPractices: { subjectName: string; action: string; reason: string }[];
  nextBestAction: string;
  latestTestPercentage: number | null;
  lastCalculatedAt: number;
}

// GARIA OS v1.4.2 EXAM INTELLIGENCE TYPES
// ==========================================

export type ExamBoard = "BSEB" | "CBSE" | "Other";

export type ExamReadinessStatus =
  | "🟢 On Track"
  | "🟡 Needs Attention"
  | "🟠 Behind Schedule"
  | "🔴 Critical"
  | "🏁 Exam In Progress / Completed";

export interface ExamProfile {
  board: ExamBoard;
  customBoardName?: string;
  classLevel: string; // "Class 12"
  stream: StreamType; // "Commerce" | "Science"
  academicYear: string; // "2025-2026"
  examName: string; // "Class 12 Board Exam 2026"
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  subjectExamDates: Record<string, string>; // subjectId or subjectName -> YYYY-MM-DD
  dailyStudyHours: number; // default 5
}

export interface ExamMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: number;
  category: "Syllabus" | "Revision" | "PYQ" | "Mock" | "Weakness" | "Review";
}

export interface ExamMockTest {
  id: string;
  testName: string;
  board: ExamBoard | string;
  subjectId: string;
  subjectName: string;
  chapterTitle?: string;
  testDate: string; // YYYY-MM-DD
  maxMarks: number;
  marksObtained: number;
  timeTakenMinutes?: number;
  testType: "Mock Exam" | "PYQ Practice" | "School Test" | "Custom Test";
  weakTopicsIdentified?: string[];
  notes?: string;
}

export interface ExamRevisionItem {
  chapterId: string;
  subjectId: string;
  subjectName: string;
  chapterTitle: string;
  revisionCount: number;
  lastRevisedAt?: number;
  nextRevisionDue?: number;
  status: "✅ Not due" | "⚡ Due soon" | "🔥 Due" | "🚨 Overdue";
}

export interface ExamPlanSlot {
  id: string;
  timeSlot: string;
  activity: "Concept Study" | "PYQ Practice" | "Revision" | "Mock Test" | "Break" | "Buffer Time";
  subjectName: string;
  chapterTitle: string;
  priority: "🚨 Urgent Focus" | "🔥 High Priority" | "⚡ Medium Priority" | "✅ On Track";
  explanation: string;
}

export interface ExamDailyPlan {
  id: string;
  generatedDate: string;
  dailyHours: number;
  slots: ExamPlanSlot[];
}

export interface ExamReadinessBreakdown {
  overallScore: number; // 0-100
  syllabusCompletion: number; // 0-100
  revisionScore: number; // 0-100
  pyqScore: number; // 0-100
  testScore: number; // 0-100
  weaknessScore: number; // 0-100
  proximityScore: number; // 0-100
  status: ExamReadinessStatus;
}

export interface PreparationQueueItem {
  chapterId: string;
  subjectId: string;
  subjectName: string;
  chapterTitle: string;
  priority: "🚨 Urgent Focus" | "🔥 High Priority" | "⚡ Medium Priority" | "✅ On Track";
  score: number;
  explanations: string[];
}

export type ActiveTab =
  | "home"
  | "exam"
  | "academic"
  | "career"
  | "tasks"
  | "study"
  | "notes"
  | "goals"
  | "calendar"
  | "abya"
  | "focus"
  | "water"
  | "habits"
  | "stats"
  | "settings";
