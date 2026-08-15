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
import { UserSettings, StudentProfile, AbyaLanguageSetting, AppTheme } from "../types";
import { exportStudentProfileJSON, importStudentProfileJSON } from "../utils/storage";
import { APP_VERSION } from "../constants/version";
import { AppLanguage, translations } from "../utils/i18n";

interface SettingsPageProps {
  settings: UserSettings;
  activeStudent?: StudentProfile;
  profiles?: StudentProfile[];
  currentLanguage?: AppLanguage;
  onUpdateLanguage?: (lang: AppLanguage) => void;
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
  currentLanguage = "en",
  onUpdateLanguage,
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
  const t = translations[currentLanguage] || translations.en;
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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      userName: userName.trim() || activeStudent?.name || "Student",
      customApiKey: apiKey.trim(),
    });
    showToast(currentLanguage === "hi" ? "सेटिंग्स सफलतापूर्वक सहेजी गईं!" : "Settings saved successfully!");
  };

  const handleThemeChange = (theme: AppTheme) => {
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
          setImportStatusMessage(
            currentLanguage === "hi"
              ? `✅ प्रोफाइल "${res.profileName || 'Imported'}" सफलतापूर्वक आयात किया गया!`
              : `✅ Profile "${res.profileName || 'Imported'}" imported successfully!`
          );
          onReloadData();
        } else {
          setImportStatusMessage(
            currentLanguage === "hi"
              ? "❌ JSON प्रोफाइल बैकअप पार्स करने में विफल।"
              : "❌ Failed to parse JSON profile backup."
          );
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
          {t.settings}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {currentLanguage === "hi"
            ? "प्राथमिकताएं, भाषा, एआई क्रेडेंशियल्स और मल्टी-विद्यार्थी प्रोफाइल कॉन्फ़िगर करें।"
            : "Configure preferences, language, AI credentials, and multi-student profiles."}
        </p>
      </div>

      {/* 0. App Language Selector Card */}
      <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-4 bg-gradient-to-br from-emerald-950/20 via-slate-900/80 to-cyan-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-cyan-400 p-2 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                {t.language}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  OS System
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {currentLanguage === "hi"
                  ? "पूरे ऐप की भाषा चुनें: हिंदी या English"
                  : "Select full system interface language: English or Hindi"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {[
            { id: "en" as AppLanguage, label: "English (UK/US)", flag: "🇬🇧", desc: "Full English UI & Terminology" },
            { id: "hi" as AppLanguage, label: "हिन्दी (Hindi Medium)", flag: "🇮🇳", desc: "सम्पूर्ण इंटरफ़ेस, पाठ्यक्रम व प्रश्न बैंक" },
          ].map((langItem) => {
            const isSelected = currentLanguage === langItem.id;
            return (
              <button
                key={langItem.id}
                onClick={() => {
                  if (onUpdateLanguage) {
                    onUpdateLanguage(langItem.id);
                    showToast(
                      langItem.id === "hi"
                        ? "भाषा हिन्दी में परिवर्तित की गई!"
                        : "Language changed to English!"
                    );
                  }
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                  isSelected
                    ? "bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 font-bold"
                    : "glass-pill border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{langItem.flag}</span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold font-heading text-white">{langItem.label}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{langItem.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Multi-Student Intelligence Card (v1.5) */}
      <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-4 bg-gradient-to-br from-emerald-950/20 via-slate-900/80 to-cyan-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-emerald-400 p-2 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                {t.studentProfiles}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  v1.5
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {currentLanguage === "hi"
                  ? "प्रत्येक छात्र के लिए अलग कार्य, अध्ययन, शैक्षणिक और परीक्षा डेटा"
                  : "Isolate tasks, career, academic, and exam data for each student"}
              </p>
            </div>
          </div>

          {onOpenStudentModal && (
            <button
              onClick={onOpenStudentModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              {currentLanguage === "hi" ? "प्रोफाइल प्रबंधित करें" : "Manage Profiles"}
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
                    {currentLanguage === "hi" ? "सक्रिय परिवेश" : "Active Environment"}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeStudent.classLevel} • {activeStudent.stream} • {activeStudent.board} Board
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400">
              {currentLanguage === "hi" ? "कुल पंजीकृत: " : "Total Registered: "}
              <span className="text-emerald-400 font-bold">
                {profiles.length} {currentLanguage === "hi" ? "विद्यार्थी" : "Students"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Account & Private Mode */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>{currentLanguage === "hi" ? "प्रमाणीकरण और निजी मोड" : "Authentication & Private Mode"}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPrivateMode
                ? (currentLanguage === "hi" ? "निजी मोड सक्रिय — स्थानीय ब्राउज़र अलगाव का उपयोग" : "Private Mode Active — Using local browser isolation")
                : `${currentLanguage === "hi" ? "लॉग इन:" : "Logged in as"} ${settings.account?.email || settings.userName}`}
            </p>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md hover:brightness-110 transition-all"
            >
              {isPrivateMode ? (currentLanguage === "hi" ? "लॉग इन / रजिस्टर" : "Log In / Register") : (currentLanguage === "hi" ? "खाता प्रबंधित करें" : "Manage Account")}
            </button>
          )}
        </div>
      </div>

      {/* 3. Notifications Center */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{t.notifications}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentLanguage === "hi"
                ? "प्रोफ़ाइल-पृथक सूचना प्राथमिकताएं और अलर्ट"
                : "Profile-isolated notification preferences and alert triggers"}
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
            { key: "study", label: currentLanguage === "hi" ? "अध्ययन अनुस्मारक" : "Study Reminders", desc: currentLanguage === "hi" ? "अध्ययन सत्रों के लिए अलर्ट" : "Alerts for study sessions" },
            { key: "tasks", label: currentLanguage === "hi" ? "कार्य समय-सीमा" : "Task Deadlines", desc: currentLanguage === "hi" ? "लंबित कार्यों के लिए अलर्ट" : "Alerts for pending tasks" },
            { key: "revision", label: currentLanguage === "hi" ? "रिवीजन शेड्यूल" : "Revision Schedule", desc: currentLanguage === "hi" ? "स्मार्ट स्पेसड रिपीटिशन अलर्ट" : "Spaced repetition alerts" },
            { key: "habits", label: currentLanguage === "hi" ? "आदत ट्रैकर" : "Habit Tracker", desc: currentLanguage === "hi" ? "दैनिक स्ट्रीक अनुस्मारक" : "Daily streak reminders" },
            { key: "water", label: currentLanguage === "hi" ? "जल अनुस्मारक" : "Water Reminders", desc: currentLanguage === "hi" ? "हाइड्रेशन लक्ष्य अलर्ट" : "Hydration goal alerts" },
            { key: "exam", label: currentLanguage === "hi" ? "परीक्षा उलटी गिनती" : "Exam Countdown", desc: currentLanguage === "hi" ? "परीक्षा तत्परता अपडेट" : "Exam readiness updates" },
            { key: "suggestions", label: currentLanguage === "hi" ? "स्मार्ट सुझाव" : "Smart Suggestions", desc: currentLanguage === "hi" ? "ओएस एआई इनसाइट्स" : "OS intelligence insights" },
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

      {/* 4. Appearance & Multi-Theme System */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <span>{currentLanguage === "hi" ? "दिखावट व थीम सिस्टम" : "Appearance & Theme System"}</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            V3.0 Themes
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {currentLanguage === "hi"
            ? "अपनी पसंद के अनुसार तुरंत थीम स्विच करें। आंखों के तनाव को कम करने और फोकस बढ़ाने के लिए तैयार।"
            : "Switch instantly between 7 high-contrast student-focused themes designed for focus and low eye strain."}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[
            { id: "dark", label: currentLanguage === "hi" ? "डार्क थीम" : "Dark Theme", desc: "Classic Slate", color: "bg-slate-900 border-slate-700", dot: "bg-emerald-400" },
            { id: "light", label: currentLanguage === "hi" ? "लाइट थीम" : "Light Theme", desc: "Crisp & Clean", color: "bg-slate-100 border-slate-300 text-slate-900", dot: "bg-emerald-600" },
            { id: "amoled", label: currentLanguage === "hi" ? "एमोलेड ब्लैक" : "AMOLED Black", desc: "Pure #000000", color: "bg-black border-zinc-800", dot: "bg-white" },
            { id: "ocean", label: currentLanguage === "hi" ? "ओशन ब्लू" : "Ocean Blue", desc: "Midnight Navy", color: "bg-sky-950 border-sky-800", dot: "bg-cyan-400" },
            { id: "forest", label: currentLanguage === "hi" ? "फॉरेस्ट ग्रीन" : "Forest Green", desc: "Calm Emerald", color: "bg-emerald-950 border-emerald-800", dot: "bg-emerald-400" },
            { id: "purple", label: currentLanguage === "hi" ? "पर्पल फोकस" : "Purple Focus", desc: "Deep Violet", color: "bg-purple-950 border-purple-800", dot: "bg-purple-400" },
            { id: "sunset", label: currentLanguage === "hi" ? "सनसेट ऑरेंज" : "Sunset Orange", desc: "Warm Twilight", color: "bg-orange-950 border-orange-800", dot: "bg-orange-400" },
            { id: "system", label: currentLanguage === "hi" ? "सिस्टम डिफ़ॉल्ट" : "System Auto", desc: "OS Preference", color: "bg-slate-800/80 border-white/10", dot: "bg-indigo-400" },
          ].map((themeItem) => {
            const isActive = settings.theme === themeItem.id;

            return (
              <button
                key={themeItem.id}
                onClick={() => handleThemeChange(themeItem.id as AppTheme)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all card-press ${
                  isActive
                    ? "bg-emerald-500/20 border-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/20 scale-[1.02]"
                    : "glass-pill border-white/10 text-slate-300 hover:text-white hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-6 h-6 rounded-lg ${themeItem.color} border flex items-center justify-center`}>
                    <span className={`w-2 h-2 rounded-full ${themeItem.dot}`} />
                  </div>
                  {isActive && (
                    <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold font-heading">{themeItem.label}</h4>
                  <p className="text-[10px] opacity-70 mt-0.5">{themeItem.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. AI Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span>{t.abyaAICoach} {currentLanguage === "hi" ? "कॉन्फ़िगरेशन" : "Configuration"}</span>
        </h3>

        <div>
          <label className="block text-slate-300 text-xs font-medium mb-1">
            {currentLanguage === "hi" ? "कस्टम जेमिनी एपीआई कुंजी (वैकल्पिक)" : "Custom Gemini API Key (Optional)"}
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder={currentLanguage === "hi" ? "सिस्टम डिफ़ॉल्ट सक्रिय है (या कस्टम कुंजी दर्ज करें)" : "System default active (or enter custom key)"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none"
            />
            <button
              onClick={handleSaveProfile}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-900 font-bold text-xs shrink-0"
            >
              {currentLanguage === "hi" ? "सहेजें" : "Save Key"}
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>{currentLanguage === "hi" ? "अव्या एआई भाषा मोड" : "Abya AI Language Mode"}</span>
              </h4>
              <p className="text-xs text-slate-400">
                {currentLanguage === "hi" ? "छात्र के लिए अलग सेटिंग: " : "Isolated setting for "}
                <strong className="text-emerald-300">{activeStudent?.name || "Active Student"}</strong>.
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
            <h4 className="text-sm font-semibold text-white">
              {currentLanguage === "hi" ? "एआई चैट साफ़ करें" : "Clear AI Chat"}
            </h4>
            <p className="text-xs text-slate-400">
              {currentLanguage === "hi" ? "अव्या एआई के सभी चैट संदेश हटाता है।" : "Deletes all chat messages with Abya AI."}
            </p>
          </div>
          <button
            onClick={() => {
              onClearChatHistory();
              showToast(currentLanguage === "hi" ? "चैट इतिहास साफ़ किया गया!" : "Chat history cleared!");
            }}
            className="px-4 py-2 rounded-xl glass-pill border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold"
          >
            {currentLanguage === "hi" ? "चैट साफ़ करें" : "Clear Chat"}
          </button>
        </div>
      </div>

      {/* 6. Data Management */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-cyan-400" />
          <span>{currentLanguage === "hi" ? "डेटा बैकअप और स्टोरेज" : "Data Backup & Storage"}</span>
        </h3>

        {importStatusMessage && (
          <div className="p-3 rounded-xl glass-pill text-xs font-semibold text-emerald-300 border border-emerald-500/30">
            {importStatusMessage}
          </div>
        )}

        {toastMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/20 text-xs font-semibold text-emerald-300 border border-emerald-500/30 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => exportStudentProfileJSON(activeStudent?.id)}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl glass-pill border border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-300 text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{currentLanguage === "hi" ? "सक्रिय छात्र डेटा निर्यात करें" : "Export Active Student JSON"}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl glass-pill border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300 text-xs font-bold transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>{currentLanguage === "hi" ? "डेटा आयात करें (JSON)" : "Import Data (JSON)"}</span>
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
              {currentLanguage === "hi" ? "सम्पूर्ण गारिया ओएस डेटा रीसेट करें" : "Clear All Garia OS Data"}
            </h4>
            <p className="text-xs text-slate-400">
              {currentLanguage === "hi"
                ? "सभी कार्य, नोट्स, आदतें, अध्ययन सत्र और सेटिंग्स रीसेट करता है।"
                : "Resets all tasks, notes, habits, study sessions, and settings."}
            </p>
          </div>
          <button
            onClick={() => setShowConfirmClearAll(true)}
            className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 text-xs font-bold transition-colors"
          >
            {currentLanguage === "hi" ? "सभी डेटा हटाएं" : "Clear All Data"}
          </button>
        </div>
      </div>

      {/* 7. About & APK Download Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold font-heading text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-400" />
            <span>{currentLanguage === "hi" ? "गारिया ओएस के बारे में" : "About Garia OS"}</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            v{APP_VERSION} Release
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
            <strong>Built-In AI:</strong> Abya AI (Powered by Google Gemini 2.5 Flash)
          </p>
          <p>
            <strong>Storage Engine:</strong> Profile-Isolated Storage Engine
          </p>
        </div>

        {/* APK Download Banner */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-4 rounded-2xl border border-emerald-500/20">
          <div>
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <span>{currentLanguage === "hi" ? "आधिकारिक एंड्रॉइड एपीके डाउनलोड" : "Official Android APK Download"}</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentLanguage === "hi"
                ? `Android 8.0+ / 14 / 15 उपकरणों के लिए Garia OS v${APP_VERSION} एपीके डाउनलोड करें`
                : `Download Garia OS v${APP_VERSION} release APK for Android 8.0+ / 14 / 15 devices`}
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
            {t.downloadAPK}
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
                {currentLanguage === "hi" ? "क्या आप सभी ओएस डेटा रीसेट करना चाहते हैं?" : "Confirm Reset All OS Data?"}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentLanguage === "hi"
                ? "यह आपके सभी कार्यों, नोट्स, अध्ययन विषयों, आदतों और चैट संदेशों को स्थायी रूप से हटा देगा।"
                : "This will permanently delete all your tasks, notes, study subjects, habit streaks, water logs, and chat messages. This action cannot be undone unless you exported a backup JSON."}
            </p>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                onClick={() => setShowConfirmClearAll(false)}
                className="px-4 py-2 rounded-xl glass-pill text-slate-300 text-xs"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onClearAllOSData();
                  setShowConfirmClearAll(false);
                  showToast(currentLanguage === "hi" ? "गारिया ओएस डेटा रीसेट कर दिया गया है।" : "Garia OS data has been reset.");
                }}
                className="px-5 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs"
              >
                {currentLanguage === "hi" ? "हाँ, सभी डेटा हटाएं" : "Yes, Reset All Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
