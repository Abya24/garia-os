import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  CheckSquare,
  BookOpen,
  Target,
  Bell,
  ExternalLink,
  LogOut,
  X,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  signInWithGoogle,
  signOutGoogle,
  getGoogleAccessToken,
  initGoogleAuth,
  loadCalendarSyncSettings,
  saveCalendarSyncSettings,
  compileSyncableItems,
  batchSyncItemsToGoogleCalendar,
  GoogleCalendarSyncSettings,
  SyncableAcademicItem,
} from "../utils/googleCalendar";
import { Task, StudySession, CalendarEvent, Goal, StudentProfile } from "../types";

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  studySessions: StudySession[];
  events: CalendarEvent[];
  goals: Goal[];
  activeProfile?: StudentProfile | null;
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  tasks,
  studySessions,
  events,
  goals,
  activeProfile,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<GoogleCalendarSyncSettings>(() =>
    loadCalendarSyncSettings(activeProfile?.id)
  );

  // Item Selection State
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Sync Action State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
    itemName: string;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    successCount: number;
    errors: { title: string; error: string }[];
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load and compile syncable list
  const syncableItems = compileSyncableItems(
    tasks,
    studySessions,
    events,
    goals,
    settings
  );

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        setAuthError(null);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Update selected items map when settings or syncableItems change
  useEffect(() => {
    const map: Record<string, boolean> = {};
    syncableItems.forEach((item) => {
      map[item.id] = true;
    });
    setSelectedItems(map);
  }, [
    settings.syncTasks,
    settings.syncStudySessions,
    settings.syncExams,
    settings.syncGoals,
    settings.tasksFilter,
    tasks.length,
    studySessions.length,
    events.length,
    goals.length,
  ]);

  if (!isOpen) return null;

  const handleUpdateSettings = (newSettings: Partial<GoogleCalendarSyncSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveCalendarSyncSettings(updated, activeProfile?.id);
  };

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await signInWithGoogle();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (e: any) {
      console.error("Google Auth failed", e);
      setAuthError(
        e?.message ||
          "Could not authenticate with Google Calendar. Please check popup permissions and try again."
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await signOutGoogle();
      setCurrentUser(null);
      setAccessToken(null);
      setSyncResult(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAll = (select: boolean) => {
    const map: Record<string, boolean> = {};
    syncableItems.forEach((item) => {
      map[item.id] = select;
    });
    setSelectedItems(map);
  };

  const itemsToSync = syncableItems.filter((item) => selectedItems[item.id]);

  const handleStartSync = () => {
    if (itemsToSync.length === 0) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmExecuteSync = async () => {
    setShowConfirmDialog(false);
    if (!accessToken) {
      setAuthError("Active Google session required. Please sign in first.");
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);
    setSyncProgress({ current: 0, total: itemsToSync.length, itemName: "Preparing items..." });

    try {
      const result = await batchSyncItemsToGoogleCalendar(
        accessToken,
        itemsToSync,
        (current, total, itemName) => {
          setSyncProgress({ current, total, itemName });
        }
      );

      setSyncResult(result);
      const updatedSettings = {
        ...settings,
        lastSyncedAt: Date.now(),
        syncedEventCount: (settings.syncedEventCount || 0) + result.successCount,
      };
      setSettings(updatedSettings);
      saveCalendarSyncSettings(updatedSettings, activeProfile?.id);
    } catch (err: any) {
      setAuthError(err.message || "Failed to complete Google Calendar sync.");
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card max-w-2xl w-full p-6 rounded-3xl border border-amber-500/30 shadow-2xl space-y-5 max-h-[92vh] flex flex-col justify-between overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Google Workspace Integration
                </span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Calendar API
                </span>
              </div>
              <h2 className="text-xl font-bold text-white font-heading">
                Sync Garia OS with Google Calendar
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="space-y-5 overflow-y-auto pr-1 flex-1">
          {/* Account Status Card */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading block">
                  Google Account Connection
                </span>
                {currentUser ? (
                  <div className="flex items-center gap-2.5 mt-1">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || "User"}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full border border-amber-500/40"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold font-mono">
                        {(currentUser.displayName || currentUser.email || "G")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white leading-tight">
                        {currentUser.displayName || "Connected Account"}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{currentUser.email}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">
                    Connect your Google Account to sync academic tasks, study sessions, and exams directly to Google Calendar.
                  </p>
                )}
              </div>

              {currentUser ? (
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open Calendar</span>
                  </a>
                  <button
                    onClick={handleGoogleLogout}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Disconnect Google Account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              ) : (
                /* Official Google Sign In Button */
                <button
                  onClick={handleGoogleLogin}
                  disabled={isAuthenticating}
                  className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg transition-all flex items-center gap-2.5 border border-slate-300 shrink-0 disabled:opacity-50 hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isAuthenticating ? "Connecting..." : "Sign in with Google"}</span>
                </button>
              )}
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}
          </div>

          {/* Master Enable/Disable & Choose Items To Sync */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">
                  Google Calendar Sync Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Select which items from Garia OS should be uploaded to your Google Calendar
                </p>
              </div>

              {/* Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleUpdateSettings({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {settings.enabled && (
              <div className="space-y-3 pt-2 border-t border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-heading block">
                  Choose Items To Sync:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Sync Tasks */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Academic & Daily Tasks</div>
                        <div className="text-[10px] text-slate-400">
                          {tasks.length} total tasks
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.syncTasks}
                      onChange={(e) => handleUpdateSettings({ syncTasks: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                    />
                  </div>

                  {/* Sync Study Sessions */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Study & Focus Sessions</div>
                        <div className="text-[10px] text-slate-400">
                          {studySessions.length} logged sessions
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.syncStudySessions}
                      onChange={(e) =>
                        handleUpdateSettings({ syncStudySessions: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                    />
                  </div>

                  {/* Sync Exams & Deadlines */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Exams & Academic Deadlines</div>
                        <div className="text-[10px] text-slate-400">
                          {events.length} calendar events
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.syncExams}
                      onChange={(e) => handleUpdateSettings({ syncExams: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                    />
                  </div>

                  {/* Sync Goal Target Dates */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Goal Target Milestones</div>
                        <div className="text-[10px] text-slate-400">
                          {goals.length} target goals
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.syncGoals}
                      onChange={(e) => handleUpdateSettings({ syncGoals: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>

                {/* Filter Selector */}
                {settings.syncTasks && (
                  <div className="pt-2 flex items-center gap-3 text-xs">
                    <span className="text-slate-400 font-medium">Task Scope Filter:</span>
                    <select
                      value={settings.tasksFilter}
                      onChange={(e) =>
                        handleUpdateSettings({
                          tasksFilter: e.target.value as "all" | "high_only" | "pending_only",
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">All Tasks (Completed & Pending)</option>
                      <option value="pending_only">Pending Tasks Only</option>
                      <option value="high_only">High Priority Tasks Only</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Item Preview & Granular Selection Accordion */}
          {settings.enabled && syncableItems.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-heading">
                    Syncable Items Queue ({itemsToSync.length}/{syncableItems.length} selected)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAll(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => handleToggleAll(false)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Items List Preview */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {syncableItems.map((item) => {
                  const isChecked = !!selectedItems[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? "bg-amber-500/10 border-amber-500/30 text-white"
                          : "bg-white/[0.02] border-white/5 text-slate-400 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 truncate">
                          <div className="text-xs font-bold truncate">{item.title}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span className="flex items-center gap-1 font-mono text-amber-300">
                              <CalendarIcon className="w-3 h-3" />
                              {item.date}
                            </span>
                            {item.time && (
                              <span className="flex items-center gap-1 font-mono text-cyan-300">
                                <Clock className="w-3 h-3" />
                                {item.time}
                              </span>
                            )}
                            <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-white/5">
                              {item.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {item.priority && (
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0">
                          {item.priority}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sync Progress or Result Feedback */}
          {isSyncing && syncProgress && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Syncing to Google Calendar...</span>
                </span>
                <span className="font-mono">
                  {syncProgress.current} / {syncProgress.total}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200"
                  style={{
                    width: `${Math.round((syncProgress.current / syncProgress.total) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                Current: {syncProgress.itemName}
              </p>
            </div>
          )}

          {syncResult && (
            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                syncResult.errors.length === 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Sync Completed Successfully!</span>
                </div>
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold underline flex items-center gap-1 text-white hover:text-amber-300"
                >
                  <span>View in Google Calendar</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-slate-300">
                Created <strong>{syncResult.successCount}</strong> calendar event(s) in your Google
                Calendar schedule.
              </p>
            </div>
          )}

          {/* Sync History & Diagnostics */}
          {settings.lastSyncedAt && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
              <span>Last synced: {new Date(settings.lastSyncedAt).toLocaleString()}</span>
              <span>Total events synced: {settings.syncedEventCount || 0}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {!currentUser ? (
              <button
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <span>Connect Google Calendar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleStartSync}
                disabled={isSyncing || itemsToSync.length === 0 || !settings.enabled}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                <span>
                  {isSyncing
                    ? "Syncing..."
                    : `Sync ${itemsToSync.length} Selected Item${itemsToSync.length === 1 ? "" : "s"}`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before batch write */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-amber-500/40 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                Confirm Google Calendar Sync
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                You are about to export and add <strong>{itemsToSync.length}</strong> academic
                items (tasks, study sessions, exams, and goals) to your primary Google Calendar
                account (<strong>{currentUser?.email}</strong>).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-400 max-h-32 overflow-y-auto space-y-1">
              {itemsToSync.slice(0, 5).map((it) => (
                <div key={it.id} className="truncate text-slate-300">
                  • {it.title} ({it.date})
                </div>
              ))}
              {itemsToSync.length > 5 && (
                <div className="text-[11px] text-amber-400 font-mono">
                  + and {itemsToSync.length - 5} more items
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExecuteSync}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                Confirm & Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
