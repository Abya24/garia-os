import React, { useState, useRef, useEffect } from "react";
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
  Calendar as CalendarIcon,
  ExternalLink,
  RefreshCw,
  Sliders,
  CheckSquare,
  BookOpen,
  Target,
  Bell,
  LogOut,
  Flame,
  CloudUpload,
  CloudDownload,
  Database,
  Cloud,
  ArrowLeft,
  HardDrive,
  Sunrise,
  Sunset,
  MapPin,
  Compass,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import {
  UserSettings,
  StudentProfile,
  AbyaLanguageSetting,
  AppTheme,
  Task,
  StudySession,
  CalendarEvent,
  Goal,
} from "../types";
import {
  getSolarInfo,
  requestDeviceLocation,
  getCachedSolarCoordinates,
  SolarInfo,
} from "../utils/solarTheme";
import {
  exportStudentProfileJSON,
  importStudentProfileJSON,
  getWorkspaceSnapshot,
  restoreWorkspaceSnapshot,
  clearOfflineCache,
} from "../utils/storage";
import { APP_VERSION } from "../constants/version";
import { ProductionVersionBadge } from "../components/ProductionVersionBadge";
import { AppLanguage, translations } from "../utils/i18n";
import { GoogleCalendarSyncModal } from "../components/GoogleCalendarSyncModal";
import { PinManagementModal, PinModalMode } from "../components/PinManagementModal";
import { lockSession } from "../utils/security";
import {
  loadCalendarSyncSettings,
  saveCalendarSyncSettings,
  GoogleCalendarSyncSettings,
  signInWithGoogle,
  signOutGoogle,
  initGoogleAuth,
} from "../utils/googleCalendar";
import {
  auth,
  uploadWorkspaceToCloud,
  downloadWorkspaceFromCloud,
  signInWithGoogle as fbSignInWithGoogle,
  signOutFromFirebase,
} from "../utils/firebase";
import { User, onAuthStateChanged } from "firebase/auth";

interface SettingsPageProps {
  settings: UserSettings;
  activeStudent?: StudentProfile;
  profiles?: StudentProfile[];
  tasks?: Task[];
  studySessions?: StudySession[];
  events?: CalendarEvent[];
  goals?: Goal[];
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
  onBack?: () => void;
  onLockApp?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  activeStudent,
  profiles = [],
  tasks = [],
  studySessions = [],
  events = [],
  goals = [],
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
  onBack,
  onLockApp,
}) => {
  const t = translations[currentLanguage] || translations.en;
  const [userName, setUserName] = useState(settings.userName || activeStudent?.name || "Student");
  const [apiKey, setApiKey] = useState(settings.customApiKey || "");
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [pinModalMode, setPinModalMode] = useState<PinModalMode | null>(null);

  // Google Calendar Integration State
  const [gcalUser, setGcalUser] = useState<User | null>(null);
  const [gcalToken, setGcalToken] = useState<string | null>(null);
  const [isGCalModalOpen, setIsGCalModalOpen] = useState(false);
  const [gcalSettings, setGcalSettings] = useState<GoogleCalendarSyncSettings>(() =>
    loadCalendarSyncSettings(activeStudent?.id)
  );

  // Firebase Firestore Cloud Sync State
  const [fbUser, setFbUser] = useState<User | null>(auth.currentUser);
  const [isFbSyncing, setIsFbSyncing] = useState(false);
  const [fbLastSynced, setFbLastSynced] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setFbUser(u);
    });
    return () => unsubAuth();
  }, []);

  const handleFbBackup = async () => {
    if (!fbUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    setIsFbSyncing(true);
    try {
      const snap = getWorkspaceSnapshot();
      const res = await uploadWorkspaceToCloud(fbUser.uid, {
        activeProfileId: snap.activeProfileId,
        profiles: snap.profiles,
        fullStorageDump: snap.fullStorageDump,
      });
      setFbLastSynced(new Date(res.timestamp).toLocaleTimeString());
      showToast("Workspace backed up to Firebase Firestore!");
    } catch (e) {
      console.error(e);
      showToast("Failed to backup to Firebase.");
    } finally {
      setIsFbSyncing(false);
    }
  };

  const handleFbRestore = async () => {
    if (!fbUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    setIsFbSyncing(true);
    try {
      const cloudData = await downloadWorkspaceFromCloud(fbUser.uid);
      if (!cloudData || !cloudData.payloadJson) {
        showToast("No Firestore cloud backup found.");
        return;
      }
      const restored = restoreWorkspaceSnapshot({
        activeProfileId: cloudData.activeProfileId,
        profiles: cloudData.profiles,
        fullStorageDump: cloudData.payloadJson,
      });
      if (restored) {
        showToast("Workspace restored from Firestore!");
        onReloadData();
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to restore from Firebase.");
    } finally {
      setIsFbSyncing(false);
    }
  };

  useEffect(() => {
    const unsub = initGoogleAuth(
      (u, token) => {
        setGcalUser(u);
        setGcalToken(token);
      },
      () => {
        setGcalUser(null);
        setGcalToken(null);
      }
    );
    return () => unsub();
  }, []);

  const handleUpdateGCalSettings = (updates: Partial<GoogleCalendarSyncSettings>) => {
    const updated = { ...gcalSettings, ...updates };
    setGcalSettings(updated);
    saveCalendarSyncSettings(updated, activeStudent?.id);
  };

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
  const [isClearingCache, setIsClearingCache] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleClearOfflineCache = async () => {
    setIsClearingCache(true);
    try {
      const res = await clearOfflineCache();
      showToast(
        currentLanguage === "hi"
          ? `ऑफ़लाइन कैश सफलतापूर्वक साफ़ किया गया! (~${res.storageFreedKb} KB मेमोरी मुक्त)`
          : `Offline cache cleared successfully! (~${res.storageFreedKb} KB freed)`
      );
    } catch (e) {
      console.error(e);
      showToast(
        currentLanguage === "hi"
          ? "ऑफ़लाइन कैश साफ़ करने में विफल।"
          : "Failed to clear offline cache."
      );
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings = {
      ...settings,
      userName: userName.trim() || activeStudent?.name || "Student",
      customApiKey: apiKey.trim(),
    };
    onUpdateSettings(updatedSettings);
    if (fbUser) {
      const snap = getWorkspaceSnapshot();
      uploadWorkspaceToCloud(fbUser.uid, {
        activeProfileId: snap.activeProfileId,
        profiles: snap.profiles,
        fullStorageDump: {
          ...snap.fullStorageDump,
          garia_os_settings: JSON.stringify(updatedSettings),
        },
      })
        .then((res) => {
          setFbLastSynced(new Date(res.timestamp).toLocaleTimeString());
        })
        .catch((err) => console.warn("Background cloud sync on settings update:", err));
    }
    showToast(
      currentLanguage === "hi"
        ? "सेटिंग्स और एपीआई कुंजी सुरक्षित रूप से सहेजी गईं!"
        : "Settings & API key saved securely!"
    );
  };

  const handleThemeChange = (theme: AppTheme) => {
    onUpdateSettings({ ...settings, theme });
  };

  // Solar Theme State and Handlers
  const [solarInfo, setSolarInfo] = useState<SolarInfo>(() => getSolarInfo());
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSolarInfo(getSolarInfo());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAutoSolar = (enabled: boolean) => {
    onUpdateSettings({
      ...settings,
      autoSolarTheme: enabled,
    });
    if (enabled && !solarInfo.isUsingGeolocation) {
      handleDetectLocation();
    }
  };

  const handleDetectLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await requestDeviceLocation();
      if (coords) {
        setSolarInfo(getSolarInfo(new Date(), coords));
        showToast(
          currentLanguage === "hi"
            ? "सटीक सूर्योदय/सूर्यास्त के लिए स्थान अपडेट किया गया!"
            : "GPS location calibrated for precise sunrise/sunset times!"
        );
      } else {
        showToast(
          currentLanguage === "hi"
            ? "स्थान अनुमति नहीं मिली। मानक सौर समय का उपयोग किया जा रहा है।"
            : "Location unavailable. Using regional solar approximation."
        );
      }
    } finally {
      setIsLocating(false);
    }
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
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            {t.settings}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {currentLanguage === "hi"
              ? "प्राथमिकताएं, भाषा, एआई क्रेडेंशियल्स और मल्टी-विद्यार्थी प्रोफाइल कॉन्फ़िगर करें।"
              : "Configure preferences, language, AI credentials, and multi-student profiles."}
          </p>
        </div>
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

      {/* 2.1 PIN Lock & Security Settings */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-5 bg-gradient-to-br from-purple-500/5 via-slate-900/40 to-transparent shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-md shadow-purple-500/10">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                  Garia Security Engine
                </span>
                {settings.security?.enabled && settings.security?.pinHash ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>PIN Active</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium border border-white/10">
                    Disabled
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold font-heading text-white">
                {currentLanguage === "hi" ? "पिन लॉक और सुरक्षा सेटिंग्स" : "PIN Lock & Security Settings"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentLanguage === "hi"
                  ? "अपने अध्ययन सत्र, कार्य और नोट्स को 4-8 अंकों के सुरक्षित पिन से लॉक करें।"
                  : "Protect your study sessions, confidential notes, exams, and habits with a secure numeric PIN."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {settings.security?.enabled && settings.security?.pinHash ? (
              <button
                onClick={() => setPinModalMode("remove")}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
              >
                {currentLanguage === "hi" ? "पिन हटाएं" : "Remove PIN"}
              </button>
            ) : (
              <button
                onClick={() => setPinModalMode("setup")}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{currentLanguage === "hi" ? "पिन लॉक सेट करें" : "Create PIN Lock"}</span>
              </button>
            )}
          </div>
        </div>

        {/* PIN Configuration Options when Enabled */}
        {settings.security?.enabled && settings.security?.pinHash && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Launch Lock Toggle */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{currentLanguage === "hi" ? "ऐप लॉन्च पर लॉक स्क्रीन" : "Lock Screen on App Launch"}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {currentLanguage === "hi"
                      ? "ब्राउज़र टैब खोलने पर तुरंत पिन मांगें"
                      : "Require PIN verification when opening Garia OS"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (settings.security) {
                      onUpdateSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          lockOnLaunch: !settings.security.lockOnLaunch,
                        },
                      });
                    }
                  }}
                  className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    settings.security.lockOnLaunch ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform transform shadow-sm ${
                      settings.security.lockOnLaunch ? "translate-x-4.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons: Change PIN & Lock Now */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white">
                    {currentLanguage === "hi" ? "सत्र प्रबंधन" : "Session Controls"}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {currentLanguage === "hi" ? "पिन बदलें या अभी लॉक करें" : "Update PIN or lock your screen now"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPinModalMode("change")}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    {currentLanguage === "hi" ? "पिन बदलें" : "Change PIN"}
                  </button>

                  <button
                    onClick={() => {
                      lockSession();
                      if (onLockApp) onLockApp();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{currentLanguage === "hi" ? "अभी लॉक करें" : "Lock Now"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2.2 Firebase Firestore Cloud Sync Section */}
      <div className="glass-card p-6 rounded-3xl border border-orange-500/30 space-y-5 bg-gradient-to-br from-orange-500/5 via-slate-900/40 to-transparent shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/10">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 font-mono">
                  Firebase Database
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Cloud Firestore
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  tokyo-pipe-lf6jr
                </span>
              </div>
              <h3 className="text-lg font-bold font-heading text-white mt-0.5">
                Firebase Firestore Cloud Sync
              </h3>
              <p className="text-xs text-slate-400">
                Persistent cross-device synchronization for all student profiles, tasks, notes, habits, and exam data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFbBackup}
              disabled={isFbSyncing}
              className="px-3.5 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{isFbSyncing ? "Syncing..." : "Backup to Cloud"}</span>
            </button>
            <button
              onClick={handleFbRestore}
              disabled={isFbSyncing}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <CloudDownload className="w-3.5 h-3.5" />
              <span>Restore</span>
            </button>
          </div>
        </div>

        {/* Firebase Config Meta Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {fbUser?.photoURL ? (
              <img
                src={fbUser.photoURL}
                alt="Firebase user avatar"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-orange-500/40 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-orange-400">
                <Flame className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{fbUser ? (fbUser.displayName || fbUser.email) : "Guest / Local Offline Session"}</span>
                {fbUser && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Online
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {fbUser ? fbUser.email : "Sign in via Auth Modal to enable automatic cloud backup"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <div>
              Region: <span className="text-slate-200">asia-southeast1</span>
            </div>
            {fbLastSynced && (
              <div className="text-emerald-400 font-bold">
                Synced at: {fbLastSynced}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2.5 Google Calendar API Sync Settings */}
      <div className="glass-card p-6 rounded-3xl border border-amber-500/30 space-y-5 bg-gradient-to-br from-amber-500/5 via-slate-900/40 to-transparent shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Google Workspace
                </span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Calendar API
                </span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  Gmail API
                </span>
              </div>
              <h3 className="text-lg font-bold font-heading text-white mt-0.5">
                Google Workspace & Calendar Sync
              </h3>
              <p className="text-xs text-slate-400">
                Sync academic tasks, study sessions, exams, and access your Student Gmail directly in Garia OS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Master Toggle */}
            <div className="flex items-center gap-2.5 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-white/10">
              <span className="text-xs font-semibold text-slate-300">
                {gcalSettings.enabled ? "Sync Enabled" : "Sync Disabled"}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gcalSettings.enabled}
                  onChange={(e) => handleUpdateGCalSettings({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <button
              onClick={() => setIsGCalModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 hover:scale-105 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Open Sync Center</span>
            </button>
          </div>
        </div>

        {/* Account Info Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {gcalUser?.photoURL ? (
              <img
                src={gcalUser.photoURL}
                alt="Google avatar"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-amber-500/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-amber-300">
                {gcalUser?.email ? gcalUser.email[0].toUpperCase() : "G"}
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-white">
                {gcalUser ? (gcalUser.displayName || gcalUser.email) : "No Google account connected"}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {gcalUser ? gcalUser.email : "Sign in to allow direct API synchronization"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {gcalUser ? (
              <>
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                  <span>Google Calendar</span>
                </a>
                <button
                  onClick={async () => {
                    await signOutGoogle();
                    setGcalUser(null);
                    setGcalToken(null);
                    showToast("Google account disconnected");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                onClick={async () => {
                  try {
                    const res = await signInWithGoogle();
                    if (res) {
                      setGcalUser(res.user);
                      setGcalToken(res.accessToken);
                      showToast("Google Account Connected Successfully!");
                    }
                  } catch (e: any) {
                    showToast(e.message || "Failed to sign in with Google");
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Granular Sync Selection Checkboxes */}
        {gcalSettings.enabled && (
          <div className="space-y-3 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-heading block">
              Choose Items to Sync:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Tasks */}
              <label className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between cursor-pointer hover:border-amber-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Tasks</span>
                </div>
                <input
                  type="checkbox"
                  checked={gcalSettings.syncTasks}
                  onChange={(e) => handleUpdateGCalSettings({ syncTasks: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                />
              </label>

              {/* Study Sessions */}
              <label className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between cursor-pointer hover:border-amber-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Study Sessions</span>
                </div>
                <input
                  type="checkbox"
                  checked={gcalSettings.syncStudySessions}
                  onChange={(e) => handleUpdateGCalSettings({ syncStudySessions: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                />
              </label>

              {/* Exams */}
              <label className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between cursor-pointer hover:border-amber-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white">Exams & Events</span>
                </div>
                <input
                  type="checkbox"
                  checked={gcalSettings.syncExams}
                  onChange={(e) => handleUpdateGCalSettings({ syncExams: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                />
              </label>

              {/* Goals */}
              <label className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between cursor-pointer hover:border-amber-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Goal Targets</span>
                </div>
                <input
                  type="checkbox"
                  checked={gcalSettings.syncGoals}
                  onChange={(e) => handleUpdateGCalSettings({ syncGoals: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                />
              </label>
            </div>
          </div>
        )}
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
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <span>{currentLanguage === "hi" ? "दिखावट व थीम सिस्टम" : "Appearance & Theme System"}</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            8 Premium Themes
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {currentLanguage === "hi"
            ? "अपनी पसंद के अनुसार तुरंत थीम स्विच करें। आंखों के तनाव को कम करने और फोकस बढ़ाने के लिए तैयार।"
            : "Switch instantly between 8 high-contrast student-focused themes designed for focus and low eye strain."}
        </p>

        {/* Sunrise / Sunset Automatic Toggle Option */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20 space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                {solarInfo.isDaytime ? (
                  <Sunrise className="w-5 h-5 text-amber-400" />
                ) : (
                  <Sunset className="w-5 h-5 text-indigo-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white font-heading">
                    {currentLanguage === "hi"
                      ? "सूर्योदय / सूर्यास्त ऑटो-थीम टॉगल"
                      : "Automatic Sunrise / Sunset Theme"}
                  </h4>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    Day & Night
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {currentLanguage === "hi"
                    ? "दिन में लाइट मोड और शाम के बाद डार्क मोड में स्वचालित रूप से स्विच करें।"
                    : "Automatically switches to Light mode during daylight hours and Dark mode at dusk."}
                </p>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={() => handleToggleAutoSolar(!settings.autoSolarTheme)}
              id="auto-solar-theme-toggle"
              aria-label="Toggle Auto Solar Theme"
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 focus:outline-none flex items-center ${
                settings.autoSolarTheme ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center text-[10px] text-slate-900 font-bold ${
                  settings.autoSolarTheme ? "translate-x-5.5" : "translate-x-0"
                }`}
              >
                {settings.autoSolarTheme ? "☀️" : "🌙"}
              </div>
            </button>
          </div>

          {/* Solar Live Status Banner */}
          {settings.autoSolarTheme && (
            <div className="pt-2 border-t border-white/10 space-y-2.5 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                      solarInfo.isDaytime ? "bg-amber-400" : "bg-indigo-400"
                    }`}
                  />
                  <span className="font-semibold text-white">
                    {solarInfo.isDaytime
                      ? currentLanguage === "hi"
                        ? "☀️ दिन का समय सक्रिय: लाइट मोड लागू है"
                        : "☀️ Daytime Active: Light Mode is currently active"
                      : currentLanguage === "hi"
                      ? "🌙 रात का समय सक्रिय: डार्क मोड लागू है"
                      : "🌙 Nighttime Active: Dark Mode is currently active"}
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-white/10 text-slate-300">
                  {solarInfo.nextTransitionLabel}
                </span>
              </div>

              {/* Sunrise & Sunset Times & Location */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Sunrise</div>
                    <div className="font-bold font-mono text-white text-xs">
                      {solarInfo.sunriseFormatted}
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Sunset className="w-4 h-4 text-orange-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Sunset</div>
                    <div className="font-bold font-mono text-white text-xs">
                      {solarInfo.sunsetFormatted}
                    </div>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-slate-300 truncate">
                      {solarInfo.isUsingGeolocation ? "GPS Calibrated" : "Regional Solar"}
                    </span>
                  </div>
                  <button
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/30 transition-all shrink-0 active:scale-95"
                  >
                    {isLocating
                      ? currentLanguage === "hi"
                        ? "खोज रहा है..."
                        : "Detecting..."
                      : currentLanguage === "hi"
                      ? "स्थान अपडेट"
                      : "Sync GPS"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-300 mb-2">
            {settings.autoSolarTheme
              ? currentLanguage === "hi"
                ? "रात के लिए पसंदीदा डार्क थीम चुनें:"
                : "Select your preferred Dark Theme for nighttime:"
              : currentLanguage === "hi"
              ? "मैन्युअल थीम चयन:"
              : "Manual Theme Palette:"}
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[
            { id: "amoled", label: "AMOLED Black", desc: "Pure #000000", color: "bg-black border-zinc-800", dot: "bg-white" },
            { id: "purple", label: "Royal Purple", desc: "Deep Violet", color: "bg-purple-950 border-purple-800", dot: "bg-purple-400" },
            { id: "midnight", label: "Midnight Blue", desc: "Navy Horizon", color: "bg-sky-950 border-sky-800", dot: "bg-cyan-400" },
            { id: "graphite", label: "Graphite Gray", desc: "Slate Minimal", color: "bg-slate-900 border-slate-700", dot: "bg-slate-300" },
            { id: "arctic", label: "Arctic White", desc: "Crisp & Clean", color: "bg-slate-100 border-slate-300 text-slate-900", dot: "bg-emerald-600" },
            { id: "frost", label: "Frost Glass", desc: "Translucent Ice", color: "bg-slate-800/60 border-cyan-500/30", dot: "bg-cyan-200" },
            { id: "emerald", label: "Emerald Green", desc: "Calm Focus", color: "bg-emerald-950 border-emerald-800", dot: "bg-emerald-400" },
            { id: "sunset", label: "Sunset Orange", desc: "Warm Twilight", color: "bg-orange-950 border-orange-800", dot: "bg-orange-400" },
          ].map((themeItem) => {
            const isActive =
              settings.theme === themeItem.id ||
              (themeItem.id === "arctic" && settings.theme === "light") ||
              (themeItem.id === "midnight" && settings.theme === "ocean") ||
              (themeItem.id === "emerald" && settings.theme === "forest") ||
              (themeItem.id === "graphite" && settings.theme === "dark");

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

        {/* Offline Cache Cleanup Feature */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white font-heading">
                {currentLanguage === "hi" ? "ऑफ़लाइन कैश साफ़ करें" : "Clear Offline Cache"}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                {currentLanguage === "hi" ? "सुरक्षित सफ़ाई" : "Safe Cleanup"}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {currentLanguage === "hi"
                ? "अस्थायी ब्राउज़र कैश, सर्विस वर्कर रिस्पॉन्स और नेटवर्क कैश को साफ़ करके स्टोरेज खाली करता है। आपका छात्र डेटा (नोट्स, टास्क, स्कोर) पूरी तरह सुरक्षित रहता है।"
                : "Frees up local browser cache, service worker assets, and temporary diagnostic queries without deleting your saved tasks, notes, habits, or student profile data."}
            </p>
          </div>
          <button
            onClick={handleClearOfflineCache}
            disabled={isClearingCache}
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 card-press"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isClearingCache ? "animate-spin" : ""}`} />
            <span>
              {isClearingCache
                ? currentLanguage === "hi"
                  ? "सफ़ाई जारी..."
                  : "Clearing..."
                : currentLanguage === "hi"
                ? "ऑफ़लाइन कैश साफ़ करें"
                : "Clear Offline Cache"}
            </span>
          </button>
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

      {/* 7. About & System Information Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold font-heading text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-400" />
            <span>{currentLanguage === "hi" ? "गारिया ओएस के बारे में व सिस्टम जानकारी" : "About Garia OS & System Information"}</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            v{APP_VERSION} Release
          </span>
        </h3>

        {/* Permanent Production Version Badge */}
        <ProductionVersionBadge variant="card" showCopy={true} />

        <div className="text-xs text-slate-300 space-y-1 font-mono p-3 rounded-2xl bg-slate-900/50 border border-white/5">
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

      {/* Google Calendar Sync Modal */}
      <GoogleCalendarSyncModal
        isOpen={isGCalModalOpen}
        onClose={() => setIsGCalModalOpen(false)}
        tasks={tasks}
        studySessions={studySessions}
        events={events}
        goals={goals}
        activeProfile={activeStudent}
      />

      {/* PIN Management Modal */}
      {pinModalMode && (
        <PinManagementModal
          isOpen={Boolean(pinModalMode)}
          mode={pinModalMode}
          onClose={() => setPinModalMode(null)}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onSuccessMessage={(msg) => showToast(msg)}
        />
      )}
    </div>
  );
};
