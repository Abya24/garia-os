import React, { useState, useEffect } from "react";
import {
  Task,
  Subject,
  StudySession,
  Note,
  Habit,
  WaterLog,
  FocusSessionLog,
  Goal,
  CalendarEvent,
  AbyaMessage,
  UserSettings,
  ActiveTab,
  StudentProfile,
  CareerProfile,
  CareerAssessment,
  CareerRoadmap,
  AcademicSubject,
  AcademicChapter,
  AcademicTest,
  SmartStudyPlan,
  ExamProfile,
  ExamMilestone,
  ExamMockTest,
  ExamDailyPlan,
} from "./types";
import {
  loadTasks,
  saveTasks,
  loadSubjects,
  saveSubjects,
  loadStudySessions,
  saveStudySessions,
  loadNotes,
  saveNotes,
  loadHabits,
  saveHabits,
  loadWater,
  saveWater,
  loadFocusSessions,
  saveFocusSessions,
  loadGoals,
  saveGoals,
  loadCalendarEvents,
  saveCalendarEvents,
  loadAbyaChat,
  saveAbyaChat,
  loadSettings,
  saveSettings,
  loadCareerProfile,
  saveCareerProfile,
  loadCareerAssessment,
  saveCareerAssessment,
  loadCareerRoadmap,
  saveCareerRoadmap,
  loadAcademicSubjects,
  saveAcademicSubjects,
  loadAcademicChapters,
  saveAcademicChapters,
  loadAcademicTests,
  saveAcademicTests,
  loadAcademicPlan,
  saveAcademicPlan,
  loadExamProfile,
  saveExamProfile,
  loadExamMilestones,
  saveExamMilestones,
  loadExamMockTests,
  saveExamMockTests,
  loadExamDailyPlan,
  saveExamDailyPlan,
  getTodayString,
  clearAllData,
  loadProfiles,
  saveProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  loadActiveProfile,
  addStudentProfile,
  updateStudentProfile,
  deleteStudentProfile,
  exportStudentProfileJSON,
  importStudentProfileJSON,
} from "./utils/storage";

import {
  generateAbyaInsightCards,
  generateAbyaFallbackResponse,
} from "./utils/abyaFallbackEngine";

// Components & Pages
import { StatusBar } from "./components/StatusBar";
import { BottomNav } from "./components/BottomNav";
import { DesktopSidebar } from "./components/DesktopSidebar";
import { MoreMenuModal } from "./components/MoreMenuModal";
import { StudentProfileModal } from "./components/StudentProfileModal";

import { HomeDashboard } from "./pages/HomeDashboard";
import { TaskManager } from "./pages/TaskManager";
import { StudyTracker } from "./pages/StudyTracker";
import { FocusTimer } from "./pages/FocusTimer";
import { NotesPage } from "./pages/NotesPage";
import { WaterTracker } from "./pages/WaterTracker";
import { HabitsPage } from "./pages/HabitsPage";
import { GoalsPage } from "./pages/GoalsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { AbyaAIPage } from "./pages/AbyaAIPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { CareerCenterPage } from "./pages/CareerCenterPage";
import { AcademicCenterPage } from "./pages/AcademicCenterPage";
import { ExamCenterPage } from "./pages/ExamCenterPage";
import {
  calculateExamCountdown,
  calculateExamReadiness,
  detectWeaknessTopics,
} from "./utils/examEngine";

export default function App() {
  // Navigation & Profile Modal States
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);

  // Multi-Student Profiles State (v1.5)
  const [profiles, setProfiles] = useState<StudentProfile[]>(loadProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string>(loadActiveProfileId);

  const activeStudent =
    profiles.find((p) => p.id === activeProfileId) || profiles[0] || loadActiveProfile();

  // App Data States
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSubjects());
  const [studySessions, setStudySessions] = useState<StudySession[]>(() => loadStudySessions());
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits());
  const [water, setWater] = useState<WaterLog>(() => loadWater());
  const [focusLogs, setFocusLogs] = useState<FocusSessionLog[]>(() => loadFocusSessions());
  const [goals, setGoals] = useState<Goal[]>(() => loadGoals());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => loadCalendarEvents());
  const [abyaChat, setAbyaChat] = useState<AbyaMessage[]>(() => loadAbyaChat());
  const [careerProfile, setCareerProfile] = useState<CareerProfile>(() => loadCareerProfile());
  const [careerAssessment, setCareerAssessment] = useState<CareerAssessment>(() => loadCareerAssessment());
  const [careerRoadmap, setCareerRoadmap] = useState<CareerRoadmap>(() => loadCareerRoadmap());

  // Academic Center States
  const [academicSubjects, setAcademicSubjects] = useState<AcademicSubject[]>(() =>
    loadAcademicSubjects(careerProfile.stream)
  );
  const [academicChapters, setAcademicChapters] = useState<AcademicChapter[]>(() => loadAcademicChapters());
  const [academicTests, setAcademicTests] = useState<AcademicTest[]>(() => loadAcademicTests());
  const [academicPlan, setAcademicPlan] = useState<SmartStudyPlan | null>(() => loadAcademicPlan());

  // Exam Intelligence States (v1.4.2)
  const [examProfile, setExamProfile] = useState<ExamProfile>(() => loadExamProfile());
  const [examMilestones, setExamMilestones] = useState<ExamMilestone[]>(() => loadExamMilestones());
  const [examMockTests, setExamMockTests] = useState<ExamMockTest[]>(() => loadExamMockTests());
  const [examPlan, setExamPlan] = useState<ExamDailyPlan | null>(() => loadExamDailyPlan());

  // Attached Note Context for Abya AI
  const [attachedContextNote, setAttachedContextNote] = useState<string>("");

  // Reload all isolated dataset for a specific profile ID
  const reloadAllDataForProfile = (profileId: string) => {
    setActiveProfileId(profileId);
    saveActiveProfileId(profileId);

    const allProfs = loadProfiles();
    setProfiles(allProfs);

    const curProf = allProfs.find((p) => p.id === profileId);
    const stream = curProf?.stream || "Commerce";

    setSettings(loadSettings(profileId));
    setTasks(loadTasks(profileId));
    setSubjects(loadSubjects(profileId));
    setStudySessions(loadStudySessions(profileId));
    setNotes(loadNotes(profileId));
    setHabits(loadHabits(profileId));
    setWater(loadWater(profileId));
    setFocusLogs(loadFocusSessions(profileId));
    setGoals(loadGoals(profileId));
    setCalendarEvents(loadCalendarEvents(profileId));
    setAbyaChat(loadAbyaChat(profileId));
    setCareerProfile(loadCareerProfile(profileId));
    setCareerAssessment(loadCareerAssessment(profileId));
    setCareerRoadmap(loadCareerRoadmap(profileId));
    setAcademicSubjects(loadAcademicSubjects(stream, profileId));
    setAcademicChapters(loadAcademicChapters(profileId));
    setAcademicTests(loadAcademicTests(profileId));
    setAcademicPlan(loadAcademicPlan(profileId));
    setExamProfile(loadExamProfile(profileId));
    setExamMilestones(loadExamMilestones(profileId));
    setExamMockTests(loadExamMockTests(profileId));
    setExamPlan(loadExamDailyPlan(profileId));
  };

  // Profile Action Handlers
  const handleSwitchProfile = (pId: string) => {
    reloadAllDataForProfile(pId);
  };

  const handleAddStudentProfile = (
    pData: Omit<StudentProfile, "id" | "createdAt" | "updatedAt">
  ) => {
    const newProf = addStudentProfile(pData);
    reloadAllDataForProfile(newProf.id);
  };

  const handleUpdateStudentProfile = (updated: StudentProfile) => {
    updateStudentProfile(updated);
    const refreshed = loadProfiles();
    setProfiles(refreshed);
    if (updated.id === activeProfileId) {
      setSettings(loadSettings(updated.id));
      setCareerProfile(loadCareerProfile(updated.id));
      setExamProfile(loadExamProfile(updated.id));
    }
  };

  const handleDeleteStudentProfile = (pId: string) => {
    const remaining = deleteStudentProfile(pId);
    setProfiles(remaining);
    const curActive = loadActiveProfileId();
    reloadAllDataForProfile(curActive);
  };

  const handleExportStudentProfile = (pId: string) => {
    exportStudentProfileJSON(pId);
  };

  const handleImportStudentProfile = (jsonString: string) => {
    const res = importStudentProfileJSON(jsonString);
    if (res.success && res.profileId) {
      reloadAllDataForProfile(res.profileId);
    }
  };

  // Sync Theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    saveSettings(settings);
  }, [settings]);

  // Sync Data Save Handlers
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleUpdateCareerProfile = (p: CareerProfile) => {
    setCareerProfile(p);
    saveCareerProfile(p);
  };

  const handleUpdateCareerAssessment = (a: CareerAssessment) => {
    setCareerAssessment(a);
    saveCareerAssessment(a);
  };

  const handleUpdateCareerRoadmap = (r: CareerRoadmap) => {
    setCareerRoadmap(r);
    saveCareerRoadmap(r);
  };

  const handleUpdateAcademicSubjects = (subs: AcademicSubject[]) => {
    setAcademicSubjects(subs);
    saveAcademicSubjects(subs);
  };

  const handleUpdateAcademicChapters = (chaps: AcademicChapter[]) => {
    setAcademicChapters(chaps);
    saveAcademicChapters(chaps);
  };

  const handleUpdateAcademicTests = (tests: AcademicTest[]) => {
    setAcademicTests(tests);
    saveAcademicTests(tests);
  };

  const handleUpdateAcademicPlan = (plan: SmartStudyPlan | null) => {
    setAcademicPlan(plan);
    saveAcademicPlan(plan);
  };

  const handleUpdateExamProfile = (prof: ExamProfile) => {
    setExamProfile(prof);
    saveExamProfile(prof);
  };

  const handleUpdateExamMilestones = (ms: ExamMilestone[]) => {
    setExamMilestones(ms);
    saveExamMilestones(ms);
  };

  const handleUpdateExamMockTests = (tests: ExamMockTest[]) => {
    setExamMockTests(tests);
    saveExamMockTests(tests);
  };

  const handleUpdateExamPlan = (plan: ExamDailyPlan | null) => {
    setExamPlan(plan);
    saveExamDailyPlan(plan);
  };

  const handleAddTask = (newTask: Omit<Task, "id" | "createdAt">) => {
    const created: Task = {
      ...newTask,
      id: "task-" + Date.now(),
      createdAt: Date.now(),
    };
    const updated = [created, ...tasks];
    setTasks(updated);
    saveTasks(updated);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updated);
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
  };

  const handleAddSubject = (
    newSubj: Omit<Subject, "id" | "completedMinutes" | "totalSessions">
  ) => {
    const created: Subject = {
      ...newSubj,
      id: "sub-" + Date.now(),
      completedMinutes: 0,
      totalSessions: 0,
    };
    const updated = [...subjects, created];
    setSubjects(updated);
    saveSubjects(updated);
  };

  const handleUpdateSubject = (updatedSubj: Subject) => {
    const updated = subjects.map((s) => (s.id === updatedSubj.id ? updatedSubj : s));
    setSubjects(updated);
    saveSubjects(updated);
  };

  const handleDeleteSubject = (id: string) => {
    const updated = subjects.filter((s) => s.id !== id);
    setSubjects(updated);
    saveSubjects(updated);
  };

  const handleLogStudySession = (
    session: Omit<StudySession, "id" | "timestamp">
  ) => {
    const created: StudySession = {
      ...session,
      id: "study-" + Date.now(),
      timestamp: Date.now(),
    };
    const updatedSessions = [created, ...studySessions];
    setStudySessions(updatedSessions);
    saveStudySessions(updatedSessions);

    // Update subject stats
    const loggedMins = Math.round(session.durationSeconds / 60);
    const updatedSubs = subjects.map((s) => {
      if (s.id === session.subjectId) {
        return {
          ...s,
          completedMinutes: s.completedMinutes + loggedMins,
          totalSessions: s.totalSessions + 1,
        };
      }
      return s;
    });
    setSubjects(updatedSubs);
    saveSubjects(updatedSubs);
  };

  const handleAddNote = (
    newNote: Omit<Note, "id" | "createdAt" | "updatedAt">
  ) => {
    const created: Note = {
      ...newNote,
      id: "note-" + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [created, ...notes];
    setNotes(updated);
    saveNotes(updated);
  };

  const handleUpdateNote = (updatedNote: Note) => {
    const updated = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    setNotes(updated);
    saveNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
  };

  const handleAddHabit = (
    newHabit: Omit<Habit, "id" | "streak" | "completedDates" | "createdAt">
  ) => {
    const created: Habit = {
      ...newHabit,
      id: "habit-" + Date.now(),
      streak: 0,
      completedDates: [],
      createdAt: Date.now(),
    };
    const updated = [...habits, created];
    setHabits(updated);
    saveHabits(updated);
  };

  const handleToggleHabitDate = (habitId: string, dateStr: string) => {
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const isDone = h.completedDates.includes(dateStr);
        const newDates = isDone
          ? h.completedDates.filter((d) => d !== dateStr)
          : [...h.completedDates, dateStr];

        return {
          ...h,
          completedDates: newDates,
          streak: newDates.length,
        };
      }
      return h;
    });
    setHabits(updated);
    saveHabits(updated);
  };

  const handleDeleteHabit = (id: string) => {
    const updated = habits.filter((h) => h.id !== id);
    setHabits(updated);
    saveHabits(updated);
  };

  const handleUpdateWater = (newWater: WaterLog) => {
    setWater(newWater);
    saveWater(newWater);
  };

  const handleLogFocusSession = (log: Omit<FocusSessionLog, "id">) => {
    const created: FocusSessionLog = {
      ...log,
      id: "focus-" + Date.now(),
    };
    const updated = [created, ...focusLogs];
    setFocusLogs(updated);
    saveFocusSessions(updated);
  };

  // Last User Prompt for Abya AI Retry
  const [lastUserPrompt, setLastUserPrompt] = useState<string>("");

  // Abya AI Chat Messaging Handler
  const handleSendAbyaMessage = async (
    prompt: string,
    contextNote?: string,
    actionType?: any
  ) => {
    setLastUserPrompt(prompt);
    const userMsg: AbyaMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };

    const newChatWithUser = [...abyaChat, userMsg];
    setAbyaChat(newChatWithUser);
    saveAbyaChat(newChatWithUser);

    try {
      // Recent context window (last 10 messages)
      const recentHistory = abyaChat.slice(-10).map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          history: recentHistory,
          customApiKey: settings.customApiKey,
          contextNote,
          studentProfileContext: {
            id: activeStudent.id,
            name: activeStudent.name,
            classLevel: activeStudent.classLevel,
            stream: activeStudent.stream,
            board: activeStudent.board,
          },
          todayContext: {
            pendingTasksCount: tasks.filter((t) => !t.completed).length,
            completedTasksCount: tasks.filter((t) => t.completed).length,
          },
          careerContext: {
            stream: careerProfile.stream,
            currentClass: careerProfile.currentClass,
            targetCareer: careerRoadmap.careerTitle || careerProfile.selectedCareerId || "General",
            strongSubjects: careerAssessment.strongSubjects,
            roadmapProgress: Math.round(
              (careerRoadmap.milestones.filter((m) => m.completed).length /
                (careerRoadmap.milestones.length || 1)) *
                100
            ),
          },
          academicContext: {
            stream: careerProfile.stream,
            overallProgress: Math.round(
              (academicChapters.filter((c) => c.status === "Completed").length /
                (academicChapters.length || 1)) *
                100
            ),
            activeSubjectsCount: academicSubjects.length,
            weakTopicsCount: academicChapters.filter((c) => c.isWeak).length,
            weakChapterTitles: academicChapters
              .filter((c) => c.isWeak)
              .map((c) => c.title)
              .join(", "),
            testAverage:
              academicTests.length > 0
                ? Math.round(
                    academicTests.reduce(
                      (acc, t) => acc + (t.score / (t.maxMarks || 1)) * 100,
                      0
                    ) / academicTests.length
                  )
                : 0,
          },
          examContext: {
            board: examProfile.board,
            classLevel: examProfile.classLevel,
            stream: examProfile.stream,
            examName: examProfile.examName,
            daysRemaining: calculateExamCountdown(examProfile).daysRemaining,
            readinessScore: calculateExamReadiness(
              examProfile,
              academicSubjects,
              academicChapters,
              [...academicTests, ...examMockTests]
            ).overallScore,
            readinessStatus: calculateExamReadiness(
              examProfile,
              academicSubjects,
              academicChapters,
              [...academicTests, ...examMockTests]
            ).status,
            urgentChapters: academicChapters
              .filter((c) => c.priority === "VVI" || c.isWeak)
              .map((c) => c.title)
              .slice(0, 5)
              .join(", "),
            weakTopics: detectWeaknessTopics(
              academicSubjects,
              academicChapters,
              [...academicTests, ...examMockTests]
            )
              .map((w) => `${w.subjectName}: ${w.chapterTitle}`)
              .join(", "),
            targetCareer: careerProfile.targetCareer,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch response from Abya AI");
      }

      const modelMsg: AbyaMessage = {
        id: "model-" + Date.now(),
        role: "model",
        content: data.text,
        timestamp: Date.now(),
      };

      const finalChat = [...newChatWithUser, modelMsg];
      setAbyaChat(finalChat);
      saveAbyaChat(finalChat);
    } catch (e: any) {
      console.error("Abya AI chat error", e);
      const errorMsg: AbyaMessage = {
        id: "error-" + Date.now(),
        role: "model",
        content: "Abya couldn't respond right now. Please try again or use Local Intelligence.",
        timestamp: Date.now(),
        isError: true,
      };
      const finalChat = [...newChatWithUser, errorMsg];
      setAbyaChat(finalChat);
      saveAbyaChat(finalChat);
    }
  };

  const handleRetryLastMessage = () => {
    if (lastUserPrompt) {
      handleSendAbyaMessage(lastUserPrompt);
    }
  };

  const handleTriggerAbyaFallback = (actionType: any) => {
    const activeStudentData = {
      profile: activeStudent,
      tasks,
      subjects: academicSubjects,
      chapters: academicChapters,
      tests: academicTests,
      examProfile,
      mockTests: examMockTests,
      careerProfile,
      careerRoadmap,
      daysRemaining: calculateExamCountdown(examProfile).daysRemaining,
      readinessScore: calculateExamReadiness(
        examProfile,
        academicSubjects,
        academicChapters,
        [...academicTests, ...examMockTests]
      ).overallScore,
    };

    const fallbackContent = generateAbyaFallbackResponse(
      actionType || "general",
      lastUserPrompt || "Help",
      activeStudentData
    );

    const fallbackMsg: AbyaMessage = {
      id: "fallback-" + Date.now(),
      role: "model",
      content: fallbackContent,
      timestamp: Date.now(),
      isFallback: true,
    };

    const updated = [...abyaChat, fallbackMsg];
    setAbyaChat(updated);
    saveAbyaChat(updated);
  };

  const handleClearChatHistory = () => {
    const initial: AbyaMessage[] = [
      {
        id: "msg-1",
        role: "model",
        content:
          "Chat history cleared! 👋 How can I assist you with your productivity or study schedule today?",
        timestamp: Date.now(),
      },
    ];
    setAbyaChat(initial);
    saveAbyaChat(initial);
  };

  // Goal Handlers
  const handleAddGoal = (newGoal: Omit<Goal, "id" | "createdAt">) => {
    const created: Goal = {
      ...newGoal,
      id: "goal-" + Date.now(),
      createdAt: Date.now(),
    };
    const updated = [created, ...goals];
    setGoals(updated);
    saveGoals(updated);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    const updated = goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    setGoals(updated);
    saveGoals(updated);
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
  };

  // Calendar Event Handlers
  const handleAddCalendarEvent = (newEvent: Omit<CalendarEvent, "id" | "createdAt">) => {
    const created: CalendarEvent = {
      ...newEvent,
      id: "cal-" + Date.now(),
      createdAt: Date.now(),
    };
    const updated = [created, ...calendarEvents];
    setCalendarEvents(updated);
    saveCalendarEvents(updated);
  };

  const handleUpdateCalendarEvent = (updatedEvent: CalendarEvent) => {
    const updated = calendarEvents.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
    setCalendarEvents(updated);
    saveCalendarEvents(updated);
  };

  const handleDeleteCalendarEvent = (id: string) => {
    const updated = calendarEvents.filter((e) => e.id !== id);
    setCalendarEvents(updated);
    saveCalendarEvents(updated);
  };

  const handleClearAllOSData = () => {
    clearAllData();
    setTasks([]);
    setSubjects([]);
    setStudySessions([]);
    setNotes([]);
    setHabits([]);
    setWater({ date: getTodayString(), glasses: 0, goal: 8 });
    setFocusLogs([]);
    setGoals([]);
    setCalendarEvents([]);
    setCareerProfile(loadCareerProfile());
    setCareerAssessment(loadCareerAssessment());
    setCareerRoadmap(loadCareerRoadmap());
    setAcademicSubjects(loadAcademicSubjects());
    setAcademicChapters(loadAcademicChapters());
    setAcademicTests(loadAcademicTests());
    setAcademicPlan(loadAcademicPlan());
    handleClearChatHistory();
  };

  const handleReloadData = () => {
    setTasks(loadTasks());
    setSubjects(loadSubjects());
    setStudySessions(loadStudySessions());
    setNotes(loadNotes());
    setHabits(loadHabits());
    setWater(loadWater());
    setFocusLogs(loadFocusSessions());
    setGoals(loadGoals());
    setCalendarEvents(loadCalendarEvents());
    setAbyaChat(loadAbyaChat());
    setSettings(loadSettings());
    setCareerProfile(loadCareerProfile());
    setCareerAssessment(loadCareerAssessment());
    setCareerRoadmap(loadCareerRoadmap());
    setAcademicSubjects(loadAcademicSubjects());
    setAcademicChapters(loadAcademicChapters());
    setAcademicTests(loadAcademicTests());
    setAcademicPlan(loadAcademicPlan());
  };

  const handleAskAbyaWithContext = (contextText: string) => {
    setAttachedContextNote(contextText);
    setActiveTab("abya");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Top OS Bar */}
      <StatusBar
        settings={settings}
        activeStudent={activeStudent}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        onUpdateSettings={handleUpdateSettings}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsMoreMenuOpen(false);
        }}
        activeTab={activeTab}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar Navigation */}
        <DesktopSidebar
          activeTab={activeTab}
          activeStudent={activeStudent}
          onOpenStudentModal={() => setIsStudentModalOpen(true)}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setIsMoreMenuOpen(false);
          }}
          settings={settings}
        />

        {/* Main Content Stage */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === "home" && (
            <HomeDashboard
              tasks={tasks}
              subjects={subjects}
              notes={notes}
              habits={habits}
              water={water}
              goals={goals}
              events={calendarEvents}
              settings={settings}
              activeStudent={activeStudent}
              onOpenStudentModal={() => setIsStudentModalOpen(true)}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setIsMoreMenuOpen(false);
              }}
              onQuickAddTask={() => setActiveTab("tasks")}
              onQuickAddNote={() => setActiveTab("notes")}
              onAddWaterGlass={() =>
                handleUpdateWater({ ...water, glasses: water.glasses + 1 })
              }
            />
          )}

          {activeTab === "tasks" && (
            <TaskManager
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === "goals" && (
            <GoalsPage
              goals={goals}
              subjects={subjects}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarPage
              events={calendarEvents}
              tasks={tasks}
              studySessions={studySessions}
              goals={goals}
              onAddEvent={handleAddCalendarEvent}
              onUpdateEvent={handleUpdateCalendarEvent}
              onDeleteEvent={handleDeleteCalendarEvent}
              onToggleTaskComplete={handleUpdateTask}
            />
          )}

          {activeTab === "exam" && (
            <ExamCenterPage
              examProfile={examProfile}
              examMilestones={examMilestones}
              examMockTests={examMockTests}
              examPlan={examPlan}
              academicSubjects={academicSubjects}
              academicChapters={academicChapters}
              academicTests={academicTests}
              careerProfile={careerProfile}
              careerRoadmap={careerRoadmap}
              onUpdateExamProfile={handleUpdateExamProfile}
              onUpdateExamMilestones={handleUpdateExamMilestones}
              onUpdateExamMockTests={handleUpdateExamMockTests}
              onUpdateExamPlan={handleUpdateExamPlan}
              onUpdateChapters={handleUpdateAcademicChapters}
              onAskAbyaWithContext={handleAskAbyaWithContext}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setIsMoreMenuOpen(false);
              }}
            />
          )}

          {activeTab === "academic" && (
            <AcademicCenterPage
              careerProfile={careerProfile}
              careerRoadmap={careerRoadmap}
              subjects={academicSubjects}
              chapters={academicChapters}
              tests={academicTests}
              smartPlan={academicPlan}
              onUpdateSubjects={handleUpdateAcademicSubjects}
              onUpdateChapters={handleUpdateAcademicChapters}
              onUpdateTests={handleUpdateAcademicTests}
              onUpdatePlan={handleUpdateAcademicPlan}
              onAskAbyaWithContext={handleAskAbyaWithContext}
            />
          )}

          {activeTab === "career" && (
            <CareerCenterPage
              profile={careerProfile}
              assessment={careerAssessment}
              roadmap={careerRoadmap}
              onUpdateProfile={handleUpdateCareerProfile}
              onUpdateAssessment={handleUpdateCareerAssessment}
              onUpdateRoadmap={handleUpdateCareerRoadmap}
              onAskAbyaWithContext={handleAskAbyaWithContext}
            />
          )}

          {activeTab === "study" && (
            <StudyTracker
              subjects={subjects}
              studySessions={studySessions}
              onAddSubject={handleAddSubject}
              onUpdateSubject={handleUpdateSubject}
              onDeleteSubject={handleDeleteSubject}
              onLogStudySession={handleLogStudySession}
            />
          )}

          {activeTab === "focus" && (
            <FocusTimer
              settings={settings}
              focusLogs={focusLogs}
              onLogFocusSession={handleLogFocusSession}
            />
          )}

          {activeTab === "notes" && (
            <NotesPage
              notes={notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onAskAbyaWithContext={handleAskAbyaWithContext}
            />
          )}

          {activeTab === "water" && (
            <WaterTracker
              water={water}
              onUpdateWater={handleUpdateWater}
            />
          )}

          {activeTab === "habits" && (
            <HabitsPage
              habits={habits}
              onAddHabit={handleAddHabit}
              onToggleHabitDate={handleToggleHabitDate}
              onDeleteHabit={handleDeleteHabit}
            />
          )}

          {activeTab === "abya" && (
            <AbyaAIPage
              messages={abyaChat}
              settings={settings}
              activeStudent={activeStudent}
              insightCards={generateAbyaInsightCards({
                profile: activeStudent,
                tasks,
                subjects: academicSubjects,
                chapters: academicChapters,
                tests: academicTests,
                examProfile,
                mockTests: examMockTests,
                careerProfile,
                careerRoadmap,
                daysRemaining: calculateExamCountdown(examProfile).daysRemaining,
                readinessScore: calculateExamReadiness(
                  examProfile,
                  academicSubjects,
                  academicChapters,
                  [...academicTests, ...examMockTests]
                ).overallScore,
              })}
              onSendMessage={handleSendAbyaMessage}
              onClearChat={handleClearChatHistory}
              onUpdateSettings={handleUpdateSettings}
              attachedContextNote={attachedContextNote}
              onClearAttachedContext={() => setAttachedContextNote("")}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setIsMoreMenuOpen(false);
              }}
              onTriggerFallbackAction={handleTriggerAbyaFallback}
              onRetryLastMessage={handleRetryLastMessage}
            />
          )}

          {activeTab === "stats" && (
            <StatisticsPage
              tasks={tasks}
              subjects={subjects}
              studySessions={studySessions}
              habits={habits}
              focusLogs={focusLogs}
              water={water}
              goals={goals}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage
              settings={settings}
              activeStudent={activeStudent}
              profiles={profiles}
              onOpenStudentModal={() => setIsStudentModalOpen(true)}
              onUpdateSettings={handleUpdateSettings}
              onClearChatHistory={handleClearChatHistory}
              onClearAllOSData={handleClearAllOSData}
              onReloadData={handleReloadData}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsMoreMenuOpen(false);
        }}
        onOpenMore={() => setIsMoreMenuOpen(true)}
        isMoreOpen={isMoreMenuOpen}
      />

      {/* More Menu Overlay */}
      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsMoreMenuOpen(false);
        }}
        activeTab={activeTab}
      />

      {/* Multi-Student Profile Management Modal (v1.5) */}
      <StudentProfileModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        profiles={profiles}
        activeProfile={activeStudent}
        onSwitchProfile={(pId) => {
          handleSwitchProfile(pId);
          setIsStudentModalOpen(false);
        }}
        onAddProfile={handleAddStudentProfile}
        onUpdateProfile={handleUpdateStudentProfile}
        onDeleteProfile={handleDeleteStudentProfile}
        onExportProfile={handleExportStudentProfile}
        onImportProfile={handleImportStudentProfile}
      />
    </div>
  );
}
