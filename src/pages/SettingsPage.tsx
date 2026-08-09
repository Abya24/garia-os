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
} from "lucide-react";
import { UserSettings, StudentProfile } from "../types";
import { exportStudentProfileJSON, importStudentProfileJSON } from "../utils/storage";

interface SettingsPageProps {
  settings: UserSettings;
  activeStudent?: StudentProfile;
  profiles?: StudentProfile[];
  onOpenStudentModal?: () => void;
  onUpdateSettings: (s: UserSettings) => void;
  onClearChatHistory: () => void;
  onClearAllOSData: () => void;
  onReloadData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  activeStudent,
  profiles = [],
  onOpenStudentModal,
  onUpdateSettings,
  onClearChatHistory,
  onClearAllOSData,
  onReloadData,
}) => {
  const [userName, setUserName] = useState(settings.userName || "Gani");
  const [apiKey, setApiKey] = useState(settings.customApiKey || "");
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      userName: userName.trim() || "Gani",
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

      {/* 1. User Profile */}
      <form
        onSubmit={handleSaveProfile}
        className="glass-card p-6 rounded-3xl border border-white/10 space-y-4"
      >
        <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
          <span>User Profile</span>
        </h3>

        <div>
          <label className="block text-slate-300 text-xs font-medium mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold text-xs"
        >
          Update Profile Name
        </button>
      </form>

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

        <div className="pt-2 flex items-center justify-between">
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

      {/* 5. About Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-3">
        <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-slate-400" />
          <span>About Garia OS</span>
        </h3>

        <div className="text-xs text-slate-300 space-y-1 font-mono">
          <p>
            <strong>System:</strong> Garia OS (PWA Edition)
          </p>
          <p>
            <strong>Version:</strong> v1.4.2 (Exam Intelligence Center)
          </p>
          <p>
            <strong>Built-In AI:</strong> Abya AI (Powered by Google Gemini 3.6 Flash)
          </p>
          <p>
            <strong>Storage Engine:</strong> Client Browser Storage (IndexedDB / LocalStorage)
          </p>
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
