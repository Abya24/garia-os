import { Task, Note, WaterLog, Goal, ActiveTab, AbyaExecutedAction } from "../types";
import {
  saveTasks,
  saveNotes,
  saveWater,
  saveGoals,
  getTodayString,
  getOffsetLocalDateString,
} from "./storage";

export interface AbyaActionContext {
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  notes: Note[];
  setNotes: (notes: Note[] | ((prev: Note[]) => Note[])) => void;
  water: WaterLog;
  setWater: (water: WaterLog | ((prev: WaterLog) => WaterLog)) => void;
  goals: Goal[];
  setGoals: (goals: Goal[] | ((prev: Goal[]) => Goal[])) => void;
  activeStudentId?: string;
  onNavigate?: (tab: ActiveTab) => void;
  defaultSubject?: string;
}

export interface ParsedAbyaAction {
  action: "create_task" | "create_note" | "log_water" | "create_goal" | "navigate_module" | "start_focus";
  title?: string;
  subject?: string;
  priority?: "high" | "medium" | "low";
  date?: string;
  content?: string;
  category?: string;
  tags?: string[];
  amount?: number;
  targetTab?: ActiveTab;
  targetDate?: string;
  description?: string;
}

/**
 * Parses structured action blocks embedded in the AI response:
 * ```garia-action
 * { "action": "create_task", ... }
 * ```
 */
export function parseActionFromResponse(text: string): {
  cleanText: string;
  action: ParsedAbyaAction | null;
} {
  if (!text) return { cleanText: "", action: null };

  const actionBlockRegex = /```(?:garia-action|action|json-action)\s*([\s\S]*?)\s*```/i;
  const match = text.match(actionBlockRegex);

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && typeof parsed.action === "string") {
        const cleanText = text.replace(actionBlockRegex, "").trim();
        return {
          cleanText,
          action: parsed as ParsedAbyaAction,
        };
      }
    } catch (e) {
      console.warn("[AbyaActions] Could not parse action block JSON:", e);
    }
  }

  return { cleanText: text, action: null };
}

/**
 * Natural language intent parser for direct student commands.
 * Runs on student prompt for offline fallback or when AI does not embed action tags.
 */
export function parseActionFromPrompt(
  prompt: string,
  context?: { defaultSubject?: string }
): ParsedAbyaAction | null {
  if (!prompt || typeof prompt !== "string") return null;
  const clean = prompt.trim();
  const lower = clean.toLowerCase();

  // 1. Tasks: "add a task to my to-do list: ...", "add a task to ...", "create a task ...", "add task ..."
  const taskPatterns = [
    /^(?:please\s+)?(?:add|create)\s+(?:a\s+)?task\s+(?:to\s+(?:my\s+)?(?:to-do\s+list|todo\s+list|tasks?)[:\s]+)?(?:to\s+|for\s+)?(.+)$/i,
    /^(?:please\s+)?(?:remind\s+me\s+to|todo:?|task:?)\s+(.+)$/i,
    /^(?:please\s+)?add\s+(.+?)\s+to\s+(?:my\s+)?(?:to-do\s+list|todo\s+list|tasks)$/i,
  ];

  for (const pattern of taskPatterns) {
    const m = clean.match(pattern);
    if (m && m[1]) {
      let rawTitle = m[1].trim();
      // Remove leading colons or quotes
      rawTitle = rawTitle.replace(/^[:"']+\s*/, "").replace(/["']+$/, "").trim();

      // Check if title mentions priority
      let priority: "high" | "medium" | "low" = "medium";
      if (/urgent|high\s+priority|vvi|important/i.test(rawTitle)) {
        priority = "high";
      } else if (/low\s+priority|whenever|optional/i.test(rawTitle)) {
        priority = "low";
      }

      // Check for subject hint
      let subject = context?.defaultSubject || "General";
      const subjectMatch = rawTitle.match(/\b(physics|chemistry|mathematics|maths?|biology|accountancy|accounts?|economics|business\s+studies|english|history|geography)\b/i);
      if (subjectMatch) {
        subject = subjectMatch[1].charAt(0).toUpperCase() + subjectMatch[1].slice(1);
      }

      if (rawTitle.length > 2) {
        return {
          action: "create_task",
          title: rawTitle,
          subject,
          priority,
          date: getTodayString(),
        };
      }
    }
  }

  // 2. Notes: "create a new note about ...", "create note: ...", "take a note: ...", "make a note about ..."
  const notePatterns = [
    /^(?:please\s+)?(?:create|take|make|add)\s+(?:a\s+)?(?:new\s+)?note\s+(?:about|on|for)?[:\s]+(.+)$/i,
    /^(?:please\s+)?note:?\s+(.+)$/i,
  ];

  for (const pattern of notePatterns) {
    const m = clean.match(pattern);
    if (m && m[1]) {
      const rawContent = m[1].trim();
      const parts = rawContent.split(/[:\n]/);
      let title = parts[0].trim().slice(0, 60);
      let content = parts.slice(1).join("\n").trim() || rawContent;

      if (!title) title = "Study Note";
      if (!content) content = rawContent;

      return {
        action: "create_note",
        title,
        content,
        category: "Study",
        tags: ["Abya AI"],
      };
    }
  }

  // 3. Water Log: "log a glass of water", "drank water", "add water", "log water"
  if (
    /(?:log|add|record|track|drank|drink)\s+(?:a\s+glass\s+of\s+|1\s+glass\s+of\s+|some\s+)?water/i.test(lower) ||
    /^(?:drank|drink)\s+water$/i.test(lower) ||
    /^(?:pani\s+piya|pani\s+log\s+karo)$/i.test(lower)
  ) {
    let amount = 1;
    const numMatch = lower.match(/(\d+)\s+glass(?:es)?\s+of\s+water/i);
    if (numMatch && numMatch[1]) {
      amount = Math.max(1, parseInt(numMatch[1], 10));
    }
    return {
      action: "log_water",
      amount,
    };
  }

  // 4. Goals: "add a goal to ...", "create a goal to ...", "set a goal: ..."
  const goalPatterns = [
    /^(?:please\s+)?(?:add|create|set)\s+(?:a\s+)?(?:study\s+)?goal\s+(?:to\s+|for\s+)?(.+)$/i,
  ];

  for (const pattern of goalPatterns) {
    const m = clean.match(pattern);
    if (m && m[1]) {
      const rawGoal = m[1].trim().replace(/^[:"']+\s*/, "").replace(/["']+$/, "").trim();
      if (rawGoal.length > 2) {
        return {
          action: "create_goal",
          title: rawGoal,
          category: "Academic",
          targetDate: getOffsetLocalDateString(14),
        };
      }
    }
  }

  // 5. Navigation: "open exam center", "go to notes", "open tasks", etc.
  const navMatch = clean.match(/^(?:please\s+)?(?:open|go\s+to|show|navigate\s+to|take\s+me\s+to)\s+(.+)$/i);
  if (navMatch && navMatch[1]) {
    const target = navMatch[1].toLowerCase().trim();
    let targetTab: ActiveTab | null = null;
    if (target.includes("task") || target.includes("to-do") || target.includes("todo")) {
      targetTab = "tasks";
    } else if (target.includes("note")) {
      targetTab = "notes";
    } else if (target.includes("exam") || target.includes("test")) {
      targetTab = "exam";
    } else if (target.includes("study") || target.includes("curriculum") || target.includes("syllabus")) {
      targetTab = "study";
    } else if (target.includes("habit") || target.includes("water") || target.includes("routine")) {
      targetTab = "habits";
    } else if (target.includes("goal")) {
      targetTab = "goals";
    } else if (target.includes("focus") || target.includes("timer") || target.includes("pomodoro")) {
      targetTab = "focus";
    } else if (target.includes("career")) {
      targetTab = "career";
    } else if (target.includes("stat") || target.includes("analytic")) {
      targetTab = "stats";
    } else if (target.includes("dashboard") || target.includes("home")) {
      targetTab = "home";
    }

    if (targetTab) {
      return {
        action: "navigate_module",
        targetTab,
      };
    }
  }

  return null;
}

/**
 * Executes a parsed action directly on Garia OS module state and durable storage.
 */
export function executeAbyaModuleAction(
  action: ParsedAbyaAction,
  context: AbyaActionContext
): AbyaExecutedAction | null {
  if (!action || !action.action) return null;

  try {
    switch (action.action) {
      case "create_task": {
        const title = (action.title || "New Task").trim();
        const subject = action.subject || context.defaultSubject || "General";
        const newTask: Task = {
          id: "task-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          title,
          description: subject !== "General" ? `Subject: ${subject}` : undefined,
          category: "study",
          priority: action.priority || "medium",
          date: action.date || getTodayString(),
          completed: false,
          createdAt: Date.now(),
        };

        const updated = [newTask, ...context.tasks];
        context.setTasks(updated);
        saveTasks(updated, context.activeStudentId);

        return {
          type: "create_task",
          status: "success",
          summary: `Added task: "${newTask.title}"`,
          module: "tasks",
          details: { ...newTask, subject },
          targetTab: "tasks",
        };
      }

      case "create_note": {
        const title = (action.title || "Study Note").trim();
        const content = action.content || "";
        const noteTags = action.tags && action.tags.length > 0 ? action.tags : ["Abya AI"];
        if (action.category && !noteTags.includes(action.category)) {
          noteTags.unshift(action.category);
        }
        const newNote: Note = {
          id: "note-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          title,
          content,
          pinned: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: noteTags,
        };

        const updated = [newNote, ...context.notes];
        context.setNotes(updated);
        saveNotes(updated, context.activeStudentId);

        return {
          type: "create_note",
          status: "success",
          summary: `Created note: "${newNote.title}"`,
          module: "notes",
          details: newNote,
          targetTab: "notes",
        };
      }

      case "log_water": {
        const addAmount = Math.max(1, action.amount || 1);
        const currentGlasses = context.water?.glasses || 0;
        const currentGoal = context.water?.goal || 8;
        const newTotal = Math.min(20, currentGlasses + addAmount);

        const updatedWater: WaterLog = {
          date: getTodayString(),
          glasses: newTotal,
          goal: currentGoal,
        };

        context.setWater(updatedWater);
        saveWater(updatedWater, context.activeStudentId);

        return {
          type: "log_water",
          status: "success",
          summary: `Logged ${addAmount} glass${addAmount > 1 ? "es" : ""} of water (${newTotal}/${currentGoal} today)`,
          module: "wellness",
          details: updatedWater,
          targetTab: "home",
        };
      }

      case "create_goal": {
        const title = (action.title || "Study Goal").trim();
        const newGoal: Goal = {
          id: "goal-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          title,
          description: action.description || "Created via Abya AI",
          category: action.category || "Academic",
          targetDate: action.targetDate || getOffsetLocalDateString(14),
          progress: 0,
          completed: false,
          createdAt: Date.now(),
        };

        const updated = [newGoal, ...context.goals];
        context.setGoals(updated);
        saveGoals(updated, context.activeStudentId);

        return {
          type: "create_goal",
          status: "success",
          summary: `Created goal: "${newGoal.title}"`,
          module: "goals",
          details: newGoal,
          targetTab: "goals",
        };
      }

      case "navigate_module": {
        const target = action.targetTab;
        if (target && typeof context.onNavigate === "function") {
          context.onNavigate(target);
        }
        return {
          type: "navigate_module",
          status: "success",
          summary: `Opened ${target}`,
          module: (target as any) || "home",
          targetTab: target,
        };
      }

      default:
        return null;
    }
  } catch (err: any) {
    console.error("[AbyaActions] Error executing action:", err);
    return {
      type: (action.action as any) || "create_task",
      status: "error",
      summary: `Failed to execute action: ${err?.message || "Unknown error"}`,
      module: "tasks",
    };
  }
}
