import React, { useState, useRef } from "react";
import {
  Settings,
  Sun,
  Moon,
  Key,
  Trash2,
  Download,
  Upload,
  Info,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  Users,
  UserPlus,
  Check,
  Globe,
} from "lucide-react";
import { UserSettings, StudentProfile, AbyaLanguageSetting } from "../types";
import { exportStudentProfileJSON, importStudentProfileJSON } from "../utils/storage";

interface SettingsPageProps {
  settings: UserSettings;
  activeStudent?: StudentProfile;
  profiles?: StudentProfile[];
  abyaLanguage?: AbyaLanguageSetting;
  onUpdateAbyaLanguage?: (lang: AbyaLanguageSetting) => void;
  onOpenStudentModal?: () => void;
  onOpenAuthModal?: () => void;
  onNavigate?: (tab: any) => void;
  onUpdateSettings: (s: UserSettings) => void;
  onClearChatHistory: () => void;
  onClearAllOSData: () => void;
  onReloadData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  activeStudent,
  profiles = [],
  abyaLanguage = "WhatsApp Language",
  onUpdateAbyaLanguage,
  onOpenStudentModal,
  onOpenAuthModal,
  onNavigate,
  onUpdateSettings,
  onClearChatHistory,
  onClearAllOSData,
  onReloadData,
}) => {
  const [userName, setUserName] = useState(settings.userName || activeStudent?.name || "Student");
  const [apiKey, setApiKey] = useState(settings.customApiKey || "");
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const notifs = settings.notifications || {
    master: true,
    study: true,
    tasks: true,
    revision: true,
    habits: true,
    water: true,
    exam: true,
    suggestions: true,
  };

  const isPrivateMode = settings.account?.isPrivateMode !== false;

  const handleToggleNotifKey = (key: keyof typeof notifs) => {
    const updatedNotifs = { ...notifs, [key]: !notifs[key] };
    onUpdateSettings({
      ...settings,
      notificationsEnabled: updatedNotifs.master,
      notifications: updatedNotifs,
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      userName: userName.trim() || activeStudent?.name || "Student",
      customApiKey: apiKey.trim(),
    });
    alert("Settings saved successfully!");
  };

  const handleThemeChange = (theme: "dark" | "light" | "system") => {
    onUpdateSettings({ ...settings, theme });
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importStudentProfileJSON(content);
        if (res.success) {
          setImportStatusMessage(`✅ Profile "${res.profileName || 'Imported'}" imported successfully!`);
          onReloadData();
        } else {
          setImportStatusMessage("❌ Failed to parse JSON profile backup.");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
          OS Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure preferences, AI API credentials, and multi-student profiles.
        </p>
      </div>

      {/* 0. Multi-Student Intelligence Card (v1.5) */}
      <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-4 bg-gradient-to-br from-emerald-950/20 via-slate-900/80 to-cyan-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-emerald-400 p-2 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                Multi-Student Intelligence
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  v1.5
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Isolate tasks, career, academic, and exam data for each student
              </p>
            </div>
          </div>

          {onOpenStudentModal && (
            <button
              onClick={onOpenStudentModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Manage Profiles
            </button>
          )}
        </div>

        {activeStudent && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                  activeStudent.avatarColor || "from-cyan-500 to-emerald-500"
                } flex items-center justify-center text-white font-bold text-sm font-heading shadow-md`}
              >
                {activeStudent.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm font-heading flex items-center gap-2">
                  {activeStudent.name}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    Active Environment
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeStudent.classLevel} • {activeStudent.stream} • {activeStudent.board} Board
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Total Registered: <span className="text-emerald-400 font-bold">{profiles.length} Students</span>
            </div>
          </div>
        )}
      </div>

      {/* 1. Account & Private Mode */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Authentication & Private Mode</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPrivateMode
                ? "Private Mode Active — Using local browser isolation"
                : `Logged in as ${settings.account?.email || settings.userName}`}
            </p>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md hover:brightness-110 transition-all"
            >
              {isPrivateMode ? "Log In / Register" : "Manage Account"}
            </button>
          )}
        </div>
      </div>

      {/* 2. Notifications Center */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Notifications & Reminders</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Profile-isolated notification preferences and alert triggers
            </p>
          </div>
          <button
            onClick={() => handleToggleNotifKey("master")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              notifs.master
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "glass-pill text-slate-400 border border-white/10"
            }`}
          >
            {notifs.master ? "Master ON" : "Master OFF"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {[
            { key: "study", label: "Study Reminders", desc: "Alerts for study sessions" },
            { key: "tasks", label: "Task Deadlines", desc: "Alerts for pending tasks" },
            { key: "revision", label: "Revision Schedule", desc: "Spaced repetition alerts" },
            { key: "habits", label: "Habit Tracker", desc: "Daily streak reminders" },
            { key: "water", label: "Water Reminders", desc: "Hydration goal alerts" },
            { key: "exam", label: "Exam Countdown", desc: "Exam readiness updates" },
            { key: "suggestions", label: "Smart Suggestions", desc: "OS intelligence insights" },
          ].map((item) => {
            const isChecked = notifs[item.key as keyof typeof notifs];
            return (
              <div
                key={item.key}
                onClick={() => handleToggleNotifKey(item.key as keyof typeof notifs)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isChecked
                    ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                    : "glass-pill border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold font-heading text-white">{item.label}</h4>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs font-bold ${
                    isChecked
                      ? "bg-emerald-500 border-emerald-400 text-slate-950"
                      : "border-slate-600 bg-slate-900"
                  }`}
                >
                  {isChecked && "✓"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Appearance Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-400" />
          <span>Appearance</span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "dark", label: "Dark Mode", icon: Moon },
            { id: "light", label: "Light Mode", icon: Sun },
            { id: "system", label: "System Default", icon: Settings },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = settings.theme === mode.id;

            return (
              <button
                key={mode.id}
                onClick={() =>
                  handleThemeChange(mode.id as "dark" | "light" | "system")
                }
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all ${
                  isActive
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-md"
                    : "glass-pill border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-heading">{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 text-xs text-slate-300 leading-relaxed">
          <p className="flex items-center gap-1.5 font-semibold text-emerald-300 mb-1">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Theme Controls vs Hardware Screen Brightness</span>
          </p>
          <p className="text-slate-400 text-[11px]">
            Interface appearance modes (Light, Dark, or System) adjust visual colors, contrast, and element readability across Garia OS. Physical display backlight brightness is controlled via your device hardware controls or OS control center.
          </p>
        </div>
      </div>

      {/* 3. AI Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span>Abya AI Configuration</span>
        </h3>

        <div>
          <label className="block text-slate-300 text-xs font-medium mb-1">
            Custom Gemini API Key (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="System default active (or enter custom key)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none"
            />
            <button
              onClick={handleSaveProfile}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-900 font-bold text-xs shrink-0"
            >
              Save Key
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Abya AI Language Mode</span>
              </h4>
              <p className="text-xs text-slate-400">
                Isolated setting for <strong className="text-emerald-300">{activeStudent?.name || "Active Student"}</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              { id: "WhatsApp Language" as AbyaLanguageSetting, label: "WhatsApp Language", icon: "💬" },
              { id: "English" as AbyaLanguageSetting, label: "English", icon: "🇬🇧" },
              { id: "Hindi" as AbyaLanguageSetting, label: "Hindi", icon: "🇮🇳" },
              { id: "Hinglish" as AbyaLanguageSetting, label: "Hinglish", icon: "🗣️" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (onUpdateAbyaLanguage) onUpdateAbyaLanguage(item.id);
                }}
                className={`px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  abyaLanguage === item.id
                    ? "bg-emerald-500 text-slate-900 border-emerald-400 shadow-md shadow-emerald-500/20"
                    : "glass-pill border-white/10 text-slate-300 hover:border-emerald-500/40"
                }`}
              >
                <span>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-white/10">
          <div>
            <h4 className="text-sm font-semibold text-white">Clear AI Chat</h4>
            <p className="text-xs text-slate-400">
              Deletes all chat messages with Abya AI.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to clear Abya AI chat history?")) {
                onClearChatHistory();
                alert("Chat history cleared!");
              }
            }}
            className="px-4 py-2 rounded-xl glass-pill border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* 4. Data Management */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-cyan-400" />
          <span>Data Backup & Storage</span>
        </h3>

        {importStatusMessage && (
          <div className="p-3 rounded-xl glass-pill text-xs font-semibold text-emerald-300 border border-emerald-500/30">
            {importStatusMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => exportStudentProfileJSON(activeStudent?.id)}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl glass-pill border border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-300 text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Active Student JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl glass-pill border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300 text-xs font-bold transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import Data (JSON)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFileChange}
            className="hidden"
          />
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-rose-400">
              Clear All Garia OS Data
            </h4>
            <p className="text-xs text-slate-400">
              Resets all tasks, notes, habits, study sessions, and settings.
            </p>
          </div>
          <button
            onClick={() => setShowConfirmClearAll(true)}
            className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 text-xs font-bold transition-colors"
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* 5. About & APK Download Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold font-heading text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-400" />
            <span>About Garia OS</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            v2.4 Release
          </span>
        </h3>

        <div className="text-xs text-slate-300 space-y-1 font-mono">
          <p>
            <strong>System:</strong> Garia OS (Android & Web Edition)
          </p>
          <p>
            <strong>Package:</strong> com.gariaos.app
          </p>
          <p>
            <strong>Built-In AI:</strong> Abya AI (Powered by Google Gemini 3.6 Flash)
          </p>
          <p>
            <strong>Storage Engine:</strong> Profile-Isolated Storage Engine
          </p>
        </div>

        {/* APK Download Banner */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-4 rounded-2xl border border-emerald-500/20">
          <div>
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <span>Official Android APK Download</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Download Garia OS v2.8.2 release APK for Android 8.0+ devices
            </p>
          </div>
          <a
            href="/download"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate("download");
              }
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-950/40 shrink-0"
          >
            <Download className="w-4 h-4" />
            Download APK
          </a>
        </div>
      </div>

      {/* Destructive Confirm Dialog */}
      {showConfirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-rose-500/30 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-lg font-bold font-heading text-white">
                Confirm Reset All OS Data?
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently delete all your tasks, notes, study subjects, habit streaks, water logs, and chat messages. This action cannot be undone unless you exported a backup JSON.
            </p>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                onClick={() => setShowConfirmClearAll(false)}
                className="px-4 py-2 rounded-xl glass-pill text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllOSData();
                  setShowConfirmClearAll(false);
                  alert("Garia OS data has been reset.");
                }}
                className="px-5 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
