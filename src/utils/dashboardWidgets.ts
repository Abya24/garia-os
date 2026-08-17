import { HomeWidgetId, DashboardWidgetConfig } from "../types";
import { loadActiveProfileId } from "./storage";

export interface WidgetMeta {
  id: HomeWidgetId;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  category: "productivity" | "academic" | "wellness" | "core";
  iconName: string;
  defaultEnabled: boolean;
  defaultColSpan: "full" | "half" | "third" | "two-thirds";
  tags: string[];
}

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  { id: "gamification_card", enabled: true, order: 0 },
  { id: "quote_card", enabled: true, order: 1 },
  { id: "quick_access", enabled: true, order: 2 },
  { id: "quick_actions", enabled: true, order: 3 },
  { id: "continue_learning", enabled: true, order: 4 },
  { id: "todays_tasks", enabled: true, order: 5 },
  { id: "study_progress", enabled: true, order: 6 },
  { id: "water_intake", enabled: true, order: 7 },
  { id: "focus_timer", enabled: true, order: 8 },
  { id: "revision_due", enabled: true, order: 9 },
  { id: "abya_suggestions", enabled: true, order: 10 },
  { id: "habit_tracker", enabled: true, order: 11 },
];

export const WIDGET_METADATA: Record<HomeWidgetId, WidgetMeta> = {
  quick_actions: {
    id: "quick_actions",
    name: "Quick Actions",
    nameHi: "त्वरित क्रियाएँ",
    description: "One-tap action shortcuts for study sessions, adding tasks, focus timer, mail, and Abya AI.",
    descriptionHi: "अध्ययन सत्र, नया कार्य, फोकस टाइमर, जीमेल और अव्या एआई के लिए वन-टैप शॉर्टकट।",
    category: "productivity",
    iconName: "Zap",
    defaultEnabled: true,
    defaultColSpan: "full",
    tags: ["shortcuts", "fast", "timer", "actions"],
  },
  todays_tasks: {
    id: "todays_tasks",
    name: "Today's Tasks",
    nameHi: "आज के कार्य",
    description: "Interactive daily to-do matrix with checkmarks, priority badges, and quick-add creation.",
    descriptionHi: "आज के कार्यों की इंटरैक्टिव चेकलिस्ट, प्राथमिकता टैग और त्वरित नया कार्य जोड़ना।",
    category: "productivity",
    iconName: "ListTodo",
    defaultEnabled: true,
    defaultColSpan: "half",
    tags: ["tasks", "todo", "daily", "planning"],
  },
  study_progress: {
    id: "study_progress",
    name: "Study Progress",
    nameHi: "अध्ययन प्रगति",
    description: "Daily study hours, weekly target score, and subject syllabus completion breakdown.",
    descriptionHi: "दैनिक अध्ययन समय, साप्ताहिक लक्ष्य स्कोर और विषयवार पूर्णता दर।",
    category: "academic",
    iconName: "BarChart3",
    defaultEnabled: true,
    defaultColSpan: "half",
    tags: ["hours", "stats", "score", "subjects"],
  },
  water_intake: {
    id: "water_intake",
    name: "Water Intake",
    nameHi: "जल सेवन ट्रैकर",
    description: "Hydration level tracker with visual glass gauge, daily goal, and 1-tap logging.",
    descriptionHi: "दैनिक जल स्तर ट्रैकर, विजुअल ग्लास और वन-क्लिक लॉगिंग।",
    category: "wellness",
    iconName: "Droplet",
    defaultEnabled: true,
    defaultColSpan: "half",
    tags: ["health", "hydration", "wellness"],
  },
  quick_access: {
    id: "quick_access",
    name: "Quick Access Ecosystem",
    nameHi: "मुख्य शिक्षण केंद्र",
    description: "6 core pillars: Academic Center, Question Bank, Career, Abya AI, Stats, and Tasks.",
    descriptionHi: "6 मुख्य केंद्र: शैक्षणिक केंद्र, प्रश्न बैंक, करियर, अव्या एआई, एनालिटिक्स और कार्य।",
    category: "core",
    iconName: "Compass",
    defaultEnabled: true,
    defaultColSpan: "full",
    tags: ["navigation", "modules", "academic", "career"],
  },
  gamification_card: {
    id: "gamification_card",
    name: "Gamification & Countdown",
    nameHi: "गेमीफिकेशन व काउंटडाउन",
    description: "Your student Level, XP progress, daily study streak, and Board Exam countdown clock.",
    descriptionHi: "विद्यार्थी स्तर, एक्सपी प्रगति, दैनिक अध्ययन स्ट्रीक और बोर्ड परीक्षा काउंटडाउन।",
    category: "core",
    iconName: "Flame",
    defaultEnabled: true,
    defaultColSpan: "full",
    tags: ["xp", "level", "streak", "countdown", "exam"],
  },
  quote_card: {
    id: "quote_card",
    name: "Daily Motivation",
    nameHi: "दैनिक प्रेरणादायक विचार",
    description: "Handpicked inspirational quote rotated daily to keep your exam mindset strong.",
    descriptionHi: "अध्ययन व परीक्षा के लिए प्रेरणादायक दैनिक सुविचार।",
    category: "wellness",
    iconName: "Quote",
    defaultEnabled: true,
    defaultColSpan: "full",
    tags: ["motivation", "mindset", "quote"],
  },
  continue_learning: {
    id: "continue_learning",
    name: "Continue Learning Hero",
    nameHi: "अध्ययन जारी रखें",
    description: "Active board syllabus chapter with real-time progress bar and instant resume button.",
    descriptionHi: "वर्तमान में चालू अध्याय, प्रगति बार और तुरंत अध्ययन शुरू करने का बटन।",
    category: "academic",
    iconName: "BookOpen",
    defaultEnabled: true,
    defaultColSpan: "full",
    tags: ["syllabus", "ncert", "chapters", "reading"],
  },
  focus_timer: {
    id: "focus_timer",
    name: "Focus Timer Launcher",
    nameHi: "पोमोडोरो व फोकस टाइमर",
    description: "Quick launch 25m Pomodoro, 50m Deep Work, and Subject logger sessions.",
    descriptionHi: "25 मिनट पोमोडोरो, 50 मिनट गहन अध्ययन और सत्र लॉग शुरू करें।",
    category: "productivity",
    iconName: "Timer",
    defaultEnabled: true,
    defaultColSpan: "half",
    tags: ["pomodoro", "timer", "deepwork", "focus"],
  },
  revision_due: {
    id: "revision_due",
    name: "Revision Due Today",
    nameHi: "स्मार्ट रिवीजन कतार",
    description: "Spaced repetition (1-3-7-15-30) concepts queued for memory retention and practice.",
    descriptionHi: "विस्मरण रोकने के लिए स्पेस्ड रिपीटिशन (1-3-7-15-30) रिवीजन कतार।",
    category: "academic",
    iconName: "RotateCw",
    defaultEnabled: true,
    defaultColSpan: "half",
    tags: ["spaced-repetition", "revision", "memory", "retention"],
  },
  abya_suggestions: {
    id: "abya_suggestions",
    name: "Abya AI Suggestions",
    nameHi: "अव्या एआई सुझाव",
    description: "Adaptive AI study tips and recommended actions based on your activity and weak areas.",
    descriptionHi: "आपकी अध्ययन गति और कमजोर विषयों पर आधारित वैयक्तिकृत एआई सिफारिशें।",
    category: "core",
    iconName: "Bot",
    defaultEnabled: true,
    defaultColSpan: "half",
    tags: ["ai", "mentor", "suggestions", "smart"],
  },
  habit_tracker: {
    id: "habit_tracker",
    name: "Habit Streaks",
    nameHi: "दैनिक आदतें",
    description: "Track study routines and wellness habits with 1-tap completion and streak counter.",
    descriptionHi: "दैनिक अध्ययन व स्वास्थ्य आदतें, 1-टैप चेक-इन और स्ट्रीक काउंटर।",
    category: "wellness",
    iconName: "Target",
    defaultEnabled: true,
    defaultColSpan: "half",
    tags: ["habits", "streak", "routine", "discipline"],
  },
};

export interface WidgetPreset {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  iconName: string;
  widgets: DashboardWidgetConfig[];
}

export const WIDGET_PRESETS: WidgetPreset[] = [
  {
    id: "balanced",
    name: "Balanced Overview (Recommended)",
    nameHi: "संतुलित डैशबोर्ड (अनुशंसित)",
    description: "Complete harmony of quick actions, tasks, study progress, hydration, and AI guidance.",
    descriptionHi: "क्रियाएं, कार्य, प्रगति, जल स्तर और एआई सुझावों का पूर्ण संतुलन।",
    iconName: "LayoutGrid",
    widgets: [
      { id: "gamification_card", enabled: true, order: 0 },
      { id: "quote_card", enabled: true, order: 1 },
      { id: "quick_access", enabled: true, order: 2 },
      { id: "quick_actions", enabled: true, order: 3 },
      { id: "continue_learning", enabled: true, order: 4 },
      { id: "todays_tasks", enabled: true, order: 5 },
      { id: "study_progress", enabled: true, order: 6 },
      { id: "water_intake", enabled: true, order: 7 },
      { id: "focus_timer", enabled: true, order: 8 },
      { id: "revision_due", enabled: true, order: 9 },
      { id: "abya_suggestions", enabled: true, order: 10 },
      { id: "habit_tracker", enabled: true, order: 11 },
    ],
  },
  {
    id: "productivity",
    name: "High Productivity",
    nameHi: "उच्च उत्पादकता मोड",
    description: "Focused strictly on task execution, interval timers, habit streaks, and hydration.",
    descriptionHi: "कार्यों, टाइमर, आदतों और जल स्तर पर केंद्रित।",
    iconName: "Zap",
    widgets: [
      { id: "quick_actions", enabled: true, order: 0 },
      { id: "todays_tasks", enabled: true, order: 1 },
      { id: "focus_timer", enabled: true, order: 2 },
      { id: "study_progress", enabled: true, order: 3 },
      { id: "water_intake", enabled: true, order: 4 },
      { id: "habit_tracker", enabled: true, order: 5 },
      { id: "gamification_card", enabled: false, order: 6 },
      { id: "quote_card", enabled: false, order: 7 },
      { id: "quick_access", enabled: true, order: 8 },
      { id: "continue_learning", enabled: false, order: 9 },
      { id: "revision_due", enabled: false, order: 10 },
      { id: "abya_suggestions", enabled: false, order: 11 },
    ],
  },
  {
    id: "exam_intensive",
    name: "Exam & Revision Mode",
    nameHi: "परीक्षा व रिवीजन मोड",
    description: "Prioritizes exam countdown, active chapters, spaced repetition revision, and AI analysis.",
    descriptionHi: "काउंटडाउन, अध्याय, रिवीजन कतार और एआई विश्लेषण को प्राथमिकता।",
    iconName: "ShieldAlert",
    widgets: [
      { id: "gamification_card", enabled: true, order: 0 },
      { id: "continue_learning", enabled: true, order: 1 },
      { id: "revision_due", enabled: true, order: 2 },
      { id: "study_progress", enabled: true, order: 3 },
      { id: "todays_tasks", enabled: true, order: 4 },
      { id: "abya_suggestions", enabled: true, order: 5 },
      { id: "quick_actions", enabled: true, order: 6 },
      { id: "water_intake", enabled: true, order: 7 },
      { id: "focus_timer", enabled: true, order: 8 },
      { id: "quote_card", enabled: false, order: 9 },
      { id: "quick_access", enabled: true, order: 10 },
      { id: "habit_tracker", enabled: false, order: 11 },
    ],
  },
  {
    id: "minimalist",
    name: "Minimalist / Distraction-Free",
    nameHi: "सरल व न्यूनतम (क्लीन)",
    description: "Only the cleanest essentials: Quick Actions, Today's Tasks, and Water Intake.",
    descriptionHi: "केवल मुख्य चीजें: त्वरित क्रियाएं, आज के कार्य और जल सेवन।",
    iconName: "MinusCircle",
    widgets: [
      { id: "quick_actions", enabled: true, order: 0 },
      { id: "todays_tasks", enabled: true, order: 1 },
      { id: "water_intake", enabled: true, order: 2 },
      { id: "study_progress", enabled: true, order: 3 },
      { id: "gamification_card", enabled: false, order: 4 },
      { id: "quote_card", enabled: false, order: 5 },
      { id: "quick_access", enabled: false, order: 6 },
      { id: "continue_learning", enabled: false, order: 7 },
      { id: "focus_timer", enabled: false, order: 8 },
      { id: "revision_due", enabled: false, order: 9 },
      { id: "abya_suggestions", enabled: false, order: 10 },
      { id: "habit_tracker", enabled: false, order: 11 },
    ],
  },
];

const WIDGETS_STORAGE_BASE_KEY = "garia_dashboard_widgets_v2";

export const getWidgetsKey = (profileId?: string): string => {
  const pId = profileId || loadActiveProfileId() || "default";
  return `garia_p_${pId}_dashboard_widgets_v2`;
};

export const loadDashboardWidgets = (profileId?: string): DashboardWidgetConfig[] => {
  try {
    const key = getWidgetsKey(profileId);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return [...DEFAULT_DASHBOARD_WIDGETS];
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...DEFAULT_DASHBOARD_WIDGETS];
    }

    // Merge with defaults in case new widgets were added to the codebase
    const existingMap = new Map<HomeWidgetId, DashboardWidgetConfig>();
    parsed.forEach((w: DashboardWidgetConfig) => {
      if (w && w.id) {
        existingMap.set(w.id, w);
      }
    });

    const result: DashboardWidgetConfig[] = [];
    // First keep existing order
    parsed.forEach((w: DashboardWidgetConfig) => {
      if (w && w.id && WIDGET_METADATA[w.id]) {
        result.push({
          id: w.id,
          enabled: typeof w.enabled === "boolean" ? w.enabled : true,
          order: result.length,
        });
      }
    });

    // Add any missing widgets from DEFAULT_DASHBOARD_WIDGETS
    DEFAULT_DASHBOARD_WIDGETS.forEach((def) => {
      if (!existingMap.has(def.id)) {
        result.push({
          id: def.id,
          enabled: def.enabled,
          order: result.length,
        });
      }
    });

    return result;
  } catch (e) {
    console.error("Error loading dashboard widgets config", e);
    return [...DEFAULT_DASHBOARD_WIDGETS];
  }
};

export const saveDashboardWidgets = (
  widgets: DashboardWidgetConfig[],
  profileId?: string
): void => {
  try {
    const key = getWidgetsKey(profileId);
    // Normalize order indices
    const normalized = widgets.map((w, idx) => ({
      id: w.id,
      enabled: w.enabled,
      order: idx,
    }));
    localStorage.setItem(key, JSON.stringify(normalized));
  } catch (e) {
    console.error("Error saving dashboard widgets config", e);
  }
};

export const toggleWidgetEnabled = (
  widgets: DashboardWidgetConfig[],
  id: HomeWidgetId,
  forceState?: boolean,
  profileId?: string
): DashboardWidgetConfig[] => {
  const updated = widgets.map((w) => {
    if (w.id === id) {
      return {
        ...w,
        enabled: typeof forceState === "boolean" ? forceState : !w.enabled,
      };
    }
    return w;
  });
  saveDashboardWidgets(updated, profileId);
  return updated;
};

export const moveWidgetPosition = (
  widgets: DashboardWidgetConfig[],
  id: HomeWidgetId,
  direction: "up" | "down",
  profileId?: string
): DashboardWidgetConfig[] => {
  const currentIndex = widgets.findIndex((w) => w.id === id);
  if (currentIndex === -1) return widgets;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= widgets.length) return widgets;

  const copy = [...widgets];
  const [removed] = copy.splice(currentIndex, 1);
  copy.splice(targetIndex, 0, removed);

  const normalized = copy.map((w, idx) => ({ ...w, order: idx }));
  saveDashboardWidgets(normalized, profileId);
  return normalized;
};

export const reorderWidgetList = (
  widgets: DashboardWidgetConfig[],
  fromIndex: number,
  toIndex: number,
  profileId?: string
): DashboardWidgetConfig[] => {
  if (
    fromIndex < 0 ||
    fromIndex >= widgets.length ||
    toIndex < 0 ||
    toIndex >= widgets.length
  ) {
    return widgets;
  }
  const copy = [...widgets];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);

  const normalized = copy.map((w, idx) => ({ ...w, order: idx }));
  saveDashboardWidgets(normalized, profileId);
  return normalized;
};
