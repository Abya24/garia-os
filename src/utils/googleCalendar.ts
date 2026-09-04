import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { Task, StudySession, CalendarEvent, Goal } from "../types";
import { APP_VERSION } from "../constants/version";

// Scopes required for Google Calendar and Gmail sync
export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
];

export const GMAIL_SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.addons.current.action.compose",
  "https://www.googleapis.com/auth/gmail.addons.current.message.action",
  "https://www.googleapis.com/auth/gmail.addons.current.message.metadata",
  "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.insert",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.settings.basic",
  "https://www.googleapis.com/auth/gmail.settings.sharing",
];

export const WORKSPACE_SCOPES = [...CALENDAR_SCOPES, ...GMAIL_SCOPES];

// Initialize Firebase app singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
// Force prompt to ensure refresh/access tokens if needed
provider.setCustomParameters({
  prompt: "consent",
  access_type: "online",
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;
// In-memory token cache (NEVER persisted to localStorage per security guidelines)
let cachedAccessToken: string | null = null;

export interface GoogleCalendarSyncSettings {
  enabled: boolean;
  autoSyncOnCreate: boolean;
  syncTasks: boolean;
  tasksFilter: "all" | "high_only" | "pending_only";
  syncStudySessions: boolean;
  syncExams: boolean;
  syncGoals: boolean;
  lastSyncedAt?: number;
  syncedEventCount?: number;
}

export const DEFAULT_SYNC_SETTINGS: GoogleCalendarSyncSettings = {
  enabled: true,
  autoSyncOnCreate: false,
  syncTasks: true,
  tasksFilter: "all",
  syncStudySessions: true,
  syncExams: true,
  syncGoals: true,
};

const SYNC_SETTINGS_STORAGE_KEY = "garia_gcal_sync_settings";

export function loadCalendarSyncSettings(profileId?: string): GoogleCalendarSyncSettings {
  const key = profileId ? `${SYNC_SETTINGS_STORAGE_KEY}_${profileId}` : SYNC_SETTINGS_STORAGE_KEY;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...DEFAULT_SYNC_SETTINGS };
    return { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_SYNC_SETTINGS };
  }
}

export function saveCalendarSyncSettings(
  settings: GoogleCalendarSyncSettings,
  profileId?: string
): void {
  const key = profileId ? `${SYNC_SETTINGS_STORAGE_KEY}_${profileId}` : SYNC_SETTINGS_STORAGE_KEY;
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save calendar sync settings", e);
  }
}

// Auth State Listener
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might have expired or reloaded without signin in memory
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to obtain OAuth access token from Google");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const signOutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface SyncableAcademicItem {
  id: string;
  type: "task" | "session" | "exam" | "goal" | "event";
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  durationMinutes?: number;
  category?: string;
  priority?: string;
  selected?: boolean;
}

export interface GoogleEventResponse {
  id: string;
  htmlLink?: string;
  summary: string;
  status: string;
}

/**
 * Format local date & time into ISO RFC3339 string with local timezone offset
 */
function toISOWithOffset(dateStr: string, timeStr?: string, addMinutes: number = 60): {
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
} {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  if (!timeStr) {
    // All-day event
    const [y, m, d] = dateStr.split("-").map(Number);
    const startDate = `${dateStr}`;
    // Next day for all day end date
    const nextDateObj = new Date(y, m - 1, d + 1);
    const nextY = nextDateObj.getFullYear();
    const nextM = String(nextDateObj.getMonth() + 1).padStart(2, "0");
    const nextD = String(nextDateObj.getDate()).padStart(2, "0");
    const endDate = `${nextY}-${nextM}-${nextD}`;

    return {
      start: { date: startDate },
      end: { date: endDate },
    };
  }

  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);
    const startDateObj = new Date(year, month - 1, day, hours, minutes, 0);

    const endDateObj = new Date(startDateObj.getTime() + addMinutes * 60 * 1000);

    return {
      start: { dateTime: startDateObj.toISOString(), timeZone },
      end: { dateTime: endDateObj.toISOString(), timeZone },
    };
  } catch (e) {
    return {
      start: { date: dateStr },
      end: { date: dateStr },
    };
  }
}

/**
 * Insert a single event into Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  item: SyncableAcademicItem
): Promise<GoogleEventResponse> {
  const times = toISOWithOffset(item.date, item.time, item.durationMinutes || 45);

  const prefixMap: Record<string, string> = {
    task: "📋 [Task]",
    session: "⏱️ [Study Session]",
    exam: "🎯 [Exam]",
    goal: "🏆 [Goal Target]",
    event: "📅 [Garia OS]",
  };

  const summary = `${prefixMap[item.type] || "📅"} ${item.title}`;

  let description = item.description || "";
  if (item.category) description += `\nCategory: ${item.category}`;
  if (item.priority) description += `\nPriority: ${item.priority.toUpperCase()}`;
  description += `\n\n— Synced from Garia OS V${APP_VERSION} Academic Hub`;

  const payload: any = {
    summary,
    description: description.trim(),
    start: times.start,
    end: times.end,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 15 },
        { method: "popup", minutes: 60 },
      ],
    },
    transparency: item.type === "task" ? "transparent" : "opaque",
  };

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Google Calendar API error (${res.status})`
    );
  }

  return await res.json();
}

/**
 * Batch sync selected items to Google Calendar with detailed progress callbacks
 */
export async function batchSyncItemsToGoogleCalendar(
  accessToken: string,
  items: SyncableAcademicItem[],
  onProgress?: (current: number, total: number, itemName: string) => void
): Promise<{ successCount: number; errors: { title: string; error: string }[] }> {
  let successCount = 0;
  const errors: { title: string; error: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (onProgress) {
      onProgress(i + 1, items.length, item.title);
    }

    try {
      await createGoogleCalendarEvent(accessToken, item);
      successCount++;
      // Brief delay to stay safely under Google Calendar rate limits
      await new Promise((r) => setTimeout(r, 120));
    } catch (err: any) {
      console.error(`Failed to sync item "${item.title}":`, err);
      errors.push({
        title: item.title,
        error: err.message || "Failed to create event",
      });
    }
  }

  return { successCount, errors };
}

/**
 * Convert Garia OS state items into standardized syncable items
 */
export function compileSyncableItems(
  tasks: Task[],
  studySessions: StudySession[],
  events: CalendarEvent[],
  goals: Goal[],
  settings: GoogleCalendarSyncSettings
): SyncableAcademicItem[] {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeStudySessions = Array.isArray(studySessions) ? studySessions : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const safeGoals = Array.isArray(goals) ? goals : [];

  const result: SyncableAcademicItem[] = [];

  // 1. Tasks
  if (settings.syncTasks) {
    safeTasks.forEach((t) => {
      if (!t) return;
      if (settings.tasksFilter === "high_only" && t.priority !== "high") return;
      if (settings.tasksFilter === "pending_only" && t.completed) return;

      result.push({
        id: `task-${t.id}`,
        type: "task",
        title: t.title,
        description: t.description || `Status: ${t.completed ? "Completed" : "Pending"}`,
        date: t.date,
        time: t.time,
        category: t.category,
        priority: t.priority,
        selected: true,
      });
    });
  }

  // 2. Study Sessions
  if (settings.syncStudySessions) {
    safeStudySessions.forEach((s) => {
      if (!s) return;
      const minutes = Math.round((s.durationSeconds || 0) / 60);
      const timeStr = s.timestamp
        ? new Date(s.timestamp).toTimeString().slice(0, 5)
        : undefined;

      result.push({
        id: `session-${s.id}`,
        type: "session",
        title: `${s.subjectName || "Study"} Session (${minutes}m)`,
        description: s.notes || `Focus time logged: ${minutes} minutes`,
        date: s.date,
        time: timeStr,
        durationMinutes: minutes > 0 ? minutes : 30,
        category: "Study",
        selected: true,
      });
    });
  }

  // 3. Calendar Events & Exams
  if (settings.syncExams) {
    safeEvents.forEach((ev) => {
      if (!ev) return;
      result.push({
        id: `event-${ev.id}`,
        type: ev.category === "exam" ? "exam" : "event",
        title: ev.title,
        description: ev.description,
        date: ev.date,
        time: ev.time,
        category: ev.category,
        selected: true,
      });
    });
  }

  // 4. Goals Target
  if (settings.syncGoals) {
    safeGoals.forEach((g) => {
      if (!g) return;
      result.push({
        id: `goal-${g.id}`,
        type: "goal",
        title: `Goal Deadline: ${g.title}`,
        description: `Category: ${g.category}\nProgress: ${g.progress}%`,
        date: g.targetDate,
        category: g.category,
        selected: true,
      });
    });
  }

  return result;
}
