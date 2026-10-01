import React, { useState, useRef, useEffect } from "react";
import {
  Sun,
  Moon,
  Trash2,
  Download,
  Upload,
  Info,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Users,
  Globe,
  Calendar as CalendarIcon,
  RefreshCw,
  CheckSquare,
  BookOpen,
  Target,
  Bell,
  Flame,
  CloudUpload,
  CloudDownload,
  HardDrive,
  Sunrise,
  Sunset,
  MapPin,
  Lock,
  Shield,
  KeyRound,
  Palette,
  Pipette,
  RotateCcw,
  Eraser,
  Sliders,
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
  SolarInfo,
  DARK_THEME_OPTIONS,
  resolvePreferredNightTheme,
  isLightOrDayTheme,
} from "../utils/solarTheme";
import {
  exportStudentProfileJSON,
  importStudentProfileJSON,
  getWorkspaceSnapshot,
  restoreWorkspaceSnapshot,
  clearOfflineCache,
  clearStudentWorkspaceData,
} from "../utils/storage";
import { APP_VERSION } from "../constants/version";
import { ProductionVersionBadge } from "../components/ProductionVersionBadge";
import { PWAInstallOption } from "../components/PWAInstallOption";
import { AppLanguage, translations } from "../utils/i18n";
import {
  getStudentDisplayName,
  getStudentAvatarInitials,
} from "../utils/studentNameUtils";
import { useTransientToast } from "../utils/uiUtils";
import { GoogleCalendarSyncModal } from "../components/GoogleCalendarSyncModal";
import {
  PinManagementModal,
  PinModalMode,
} from "../components/PinManagementModal";
import { lockSession } from "../utils/security";
import {
  loadCalendarSyncSettings,
  saveCalendarSyncSettings,
  GoogleCalendarSyncSettings,
  initGoogleAuth,
} from "../utils/googleCalendar";
import {
  auth,
  uploadWorkspaceToCloud,
  downloadWorkspaceFromCloud,
} from "../utils/firebase";
import { User, onAuthStateChanged } from "firebase/auth";

export type SettingsCategoryFilter =
  | "all"
  | "profile_security"
  | "global_config"
  | "appearance"
  | "sync_notifications"
  | "data_clear";

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
  onClearStudentData?: () => void;
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
  onUpdateSettings,
  onClearChatHistory,
  onClearStudentData,
  onClearAllOSData,
  onReloadData,
  onLockApp,
}) => {
  const t = translations[currentLanguage] || translations.en;
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategoryFilter>("all");
  const [showConfirmClearStudent, setShowConfirmClearStudent] = useState(false);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(
    null
  );
  const [pinModalMode, setPinModalMode] = useState<PinModalMode | null>(null);

  // Google Calendar Integration State
  const [, setGcalUser] = useState<User | null>(null);
  const [isGCalModalOpen, setIsGCalModalOpen] = useState(false);
  const [gcalSettings, setGcalSettings] = useState<GoogleCalendarSyncSettings>(
    () => loadCalendarSyncSettings(activeStudent?.id)
  );

  useEffect(() => {
    setGcalSettings(loadCalendarSyncSettings(activeStudent?.id));
  }, [activeStudent?.id]);

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

  useEffect(() => {
    const unsub = initGoogleAuth(
      (u) => {
        setGcalUser(u);
      },
      () => {
        setGcalUser(null);
      }
    );
    return () => unsub();
  }, []);

  const { toastMessage, showToast } = useTransientToast(3500);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpdateGCalSettings = (
    updates: Partial<GoogleCalendarSyncSettings>
  ) => {
    const updated = { ...gcalSettings, ...updates };
    setGcalSettings(updated);
    saveCalendarSyncSettings(updated, activeStudent?.id);
  };

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

  const handleClearOfflineCache = async () => {
    setIsClearingCache(true);
    try {
      const res = await clearOfflineCache();
      showToast(
        currentLanguage === "hi"
          ? `ऑफ़लाइन कैश साफ़ किया गया (~${res.storageFreedKb} KB मुक्त)`
          : `Offline cache cleared (~${res.storageFreedKb} KB freed)`
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

  const handleConfirmClearStudentWorkspace = () => {
    if (onClearStudentData) {
      onClearStudentData();
    } else {
      clearStudentWorkspaceData(activeStudent?.id);
      onReloadData();
    }
    setShowConfirmClearStudent(false);
    showToast(
      currentLanguage === "hi"
        ? "वर्तमान छात्र का अध्ययन डेटा साफ़ कर दिया गया है।"
        : "Active student study data cleared (fresh workspace ready)."
    );
  };

  // Custom Theme Hex State
  const defaultCustomPrimary = "#10B981";
  const defaultCustomBg = "#0B0F19";
  const savedPrimary =
    settings.customTheme?.primary ||
    settings.customThemeColors?.primary ||
    defaultCustomPrimary;
  const savedBg =
    settings.customTheme?.background ||
    settings.customThemeColors?.background ||
    defaultCustomBg;

  const [customPrimaryHex, setCustomPrimaryHex] = useState(savedPrimary);
  const [customBgHex, setCustomBgHex] = useState(savedBg);
  const [hexError, setHexError] = useState<string | null>(null);

  useEffect(() => {
    setCustomPrimaryHex(savedPrimary);
  }, [savedPrimary]);

  useEffect(() => {
    setCustomBgHex(savedBg);
  }, [savedBg]);

  const isValidHex = (hex: string): boolean => {
    return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
  };

  const normalizeHex = (hex: string): string => {
    let clean = hex.trim();
    if (!clean.startsWith("#")) {
      clean = "#" + clean;
    }
    return clean.toUpperCase();
  };

  const handleUpdateCustomColors = (
    newPrimary: string,
    newBg: string,
    setAsActiveTheme: boolean = true
  ) => {
    const validP = isValidHex(newPrimary);
    const validB = isValidHex(newBg);

    if (!validP || !validB) {
      setHexError(
        currentLanguage === "hi"
          ? "कृपया मान्य 3 या 6-अंकीय हेक्स कोड दर्ज करें (उदा. #10B981)"
          : "Please enter valid 3 or 6-character hex codes (e.g. #10B981)"
      );
      return;
    }

    setHexError(null);
    const p = normalizeHex(newPrimary);
    const b = normalizeHex(newBg);
    setCustomPrimaryHex(p);
    setCustomBgHex(b);

    const updatedConfig = {
      primary: p,
      background: b,
    };

    onUpdateSettings({
      ...settings,
      theme: setAsActiveTheme ? "custom" : settings.theme,
      customTheme: updatedConfig,
      customThemeColors: updatedConfig,
    });
  };

  const handleResetCustomTheme = () => {
    setCustomPrimaryHex(defaultCustomPrimary);
    setCustomBgHex(defaultCustomBg);
    setHexError(null);
    const updatedConfig = {
      primary: defaultCustomPrimary,
      background: defaultCustomBg,
    };
    onUpdateSettings({
      ...settings,
      theme: "custom",
      customTheme: updatedConfig,
      customThemeColors: updatedConfig,
    });
  };

  const handleThemeChange = (theme: AppTheme) => {
    const nextNightTheme =
      !isLightOrDayTheme(theme) && theme !== "system"
        ? theme
        : settings.preferredNightTheme || "dark";
    if (theme === "custom") {
      const p =
        settings.customTheme?.primary ||
        settings.customThemeColors?.primary ||
        customPrimaryHex ||
        defaultCustomPrimary;
      const b =
        settings.customTheme?.background ||
        settings.customThemeColors?.background ||
        customBgHex ||
        defaultCustomBg;
      onUpdateSettings({
        ...settings,
        theme: "custom",
        preferredNightTheme: "custom",
        customTheme: { primary: p, background: b },
        customThemeColors: { primary: p, background: b },
      });
    } else {
      onUpdateSettings({
        ...settings,
        theme,
        preferredNightTheme: nextNightTheme,
      });
    }
  };

  // Solar Theme State and Handlers
  const preferredNight = resolvePreferredNightTheme(settings);
  const simMode = settings.solarSimulationMode || "auto";
  const [solarInfo, setSolarInfo] = useState<SolarInfo>(() =>
    getSolarInfo(new Date(), undefined, preferredNight, simMode)
  );
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    setSolarInfo(getSolarInfo(new Date(), undefined, preferredNight, simMode));
    const interval = setInterval(() => {
      setSolarInfo(
        getSolarInfo(new Date(), undefined, preferredNight, simMode)
      );
    }, 60000);
    return () => clearInterval(interval);
  }, [preferredNight, simMode]);

  const handleToggleAutoSolar = (enabled: boolean) => {
    onUpdateSettings({
      ...settings,
      autoSolarTheme: enabled,
      preferredNightTheme: preferredNight,
      solarSimulationMode: "auto",
    });
    if (enabled && !solarInfo.isUsingGeolocation) {
      handleDetectLocation();
    }
  };

  const handlePreferredNightThemeChange = (nightTheme: AppTheme) => {
    onUpdateSettings({
      ...settings,
      preferredNightTheme: nightTheme,
      theme: !settings.autoSolarTheme ? nightTheme : settings.theme,
    });
  };

  const handleSimulationModeChange = (mode: "auto" | "daylight" | "night") => {
    onUpdateSettings({
      ...settings,
      autoSolarTheme: true,
      solarSimulationMode: mode,
    });
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
              ? `प्रोफाइल "${res.profileName || "Imported"}" सफलतापूर्वक आयात किया गया!`
              : `Profile "${res.profileName || "Imported"}" imported successfully!`
          );
          onReloadData();
        } else {
          setImportStatusMessage(
            currentLanguage === "hi"
              ? "JSON प्रोफाइल बैकअप पार्स करने में विफल।"
              : "Failed to parse JSON profile backup."
          );
        }
      }
    };
    reader.readAsText(file);
  };

  const isFocusModeEnabled = Boolean(settings.focusMode);

  const handleToggleFocusMode = () => {
    const nextFocusMode = !isFocusModeEnabled;
    onUpdateSettings({
      ...settings,
      focusMode: nextFocusMode,
    });
    showToast(
      nextFocusMode
        ? currentLanguage === "hi"
          ? "फोकस मोड सक्रिय — गैर-जरूरी डैशबोर्ड विजेट छिपा दिए गए हैं।"
          : "Focus Mode enabled — Non-essential dashboard widgets hidden."
        : currentLanguage === "hi"
        ? "फोकस मोड निष्क्रिय — सभी डैशबोर्ड विजेट बहाल किए गए।"
        : "Focus Mode disabled — All dashboard widgets restored."
    );
  };

  const showProfileSecurity =
    activeCategory === "all" || activeCategory === "profile_security";
  const showAppearance =
    activeCategory === "all" ||
    activeCategory === "global_config" ||
    activeCategory === "appearance";
  const showSyncNotifications =
    activeCategory === "all" ||
    activeCategory === "global_config" ||
    activeCategory === "sync_notifications";
  const showDataClear =
    activeCategory === "all" ||
    activeCategory === "global_config" ||
    activeCategory === "data_clear";

  return (
    <div
      id="settings-page-root"
      data-testid="settings-page-root"
      className="space-y-6 pb-8 md:pb-4 max-w-4xl mx-auto w-full animate-in fade-in duration-300"
    >
      {/* Header & Profile vs Global Navigation Architecture */}
      <div id="settings-navigation-bar" data-testid="settings-navigation-bar" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              {t.settings || "Settings"}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              {currentLanguage === "hi"
                ? "छात्र प्रोफाइल सेटिंग्स और ग्लोबल सिस्टम कॉन्फ़िगरेशन के बीच आसानी से नेविगेट करें।"
                : "Navigate seamlessly between active student Profile Settings and system-wide Global Configuration."}
            </p>
          </div>
        </div>

        {/* Toast Feedback Banner */}
        {toastMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 text-xs font-semibold text-emerald-300 border border-emerald-500/30 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Primary Scope Switcher: Profile Settings vs Global Configuration */}
        <div
          id="settings-scope-switcher"
          data-testid="settings-scope-switcher"
          className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
        >
          <button
            type="button"
            id="settings-tab-all"
            data-testid="settings-tab-all"
            onClick={() => setActiveCategory("all")}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              activeCategory === "all"
                ? "bg-emerald-500/15 border-emerald-400 text-white shadow-sm"
                : "bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/25"
            }`}
          >
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {currentLanguage === "hi" ? "सभी सेटिंग्स (All)" : "All Settings Overview"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {currentLanguage === "hi"
                  ? "प्रोफाइल + ग्लोबल कॉन्फ़िगरेशन"
                  : "Profile + Global Configuration"}
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          </button>

          <button
            type="button"
            id="settings-tab-profile"
            data-testid="settings-tab-profile"
            onClick={() => setActiveCategory("profile_security")}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              activeCategory === "profile_security"
                ? "bg-emerald-500/15 border-emerald-400 text-white shadow-sm"
                : "bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/25"
            }`}
          >
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {currentLanguage === "hi" ? "प्रोफाइल सेटिंग्स" : "Profile Settings"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {currentLanguage === "hi"
                  ? "छात्र पहचान, पिन लॉक व फोकस मोड"
                  : "Student Identity, PIN Lock & Focus"}
              </div>
            </div>
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
          </button>

          <button
            type="button"
            id="settings-tab-global"
            data-testid="settings-tab-global"
            onClick={() => setActiveCategory("global_config")}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              activeCategory === "global_config" ||
              activeCategory === "appearance" ||
              activeCategory === "sync_notifications" ||
              activeCategory === "data_clear"
                ? "bg-emerald-500/15 border-emerald-400 text-white shadow-sm"
                : "bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/25"
            }`}
          >
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {currentLanguage === "hi" ? "ग्लोबल कॉन्फ़िगरेशन" : "Global Configuration"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {currentLanguage === "hi"
                  ? "थीम, लेआउट, क्लाउड सिंक व डेटा रीसेट"
                  : "Theme, Layout, Cloud Sync & Data"}
              </div>
            </div>
            <Globe className="w-4 h-4 text-amber-400 shrink-0" />
          </button>
        </div>

        {/* Classic Settings Command Bar with Dropdowns & Sliders */}
        <div className="classic-paper-header rounded-2xl p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              id="settings-section-dropdown"
              aria-label="Select Settings Section"
              value={activeCategory}
              onChange={(e) =>
                setActiveCategory(e.target.value as SettingsCategoryFilter)
              }
              className="classic-select text-xs font-semibold rounded-lg px-3 py-2 cursor-pointer"
            >
              <option value="all">Section: All Settings</option>
              <option value="profile_security">
                Section: 1. Profile & Security
              </option>
              <option value="global_config">
                Section: Global Configuration
              </option>
              <option value="appearance">Section: 2. Appearance & Theme</option>
              <option value="sync_notifications">
                Section: 3. Cloud Sync & Alerts
              </option>
              <option value="data_clear">Section: 4. Data & Reset</option>
            </select>

            <select
              id="settings-theme-dropdown"
              aria-label="Select App Theme Look"
              value={settings.theme}
              onChange={(e) => handleThemeChange(e.target.value as AppTheme)}
              className="classic-select text-xs font-semibold rounded-lg px-3 py-2 cursor-pointer"
            >
              <option value="classic">Theme: Classic Scholar</option>
              <option value="graphite">Theme: Graphite Slate</option>
              <option value="midnight">Theme: Midnight Navy</option>
              <option value="emerald">Theme: Emerald Academy</option>
              <option value="amoled">Theme: AMOLED Pure Black</option>
              <option value="arctic">Theme: Arctic Light</option>
              <option value="high-contrast">Theme: High Contrast</option>
              <option value="purple">Theme: Royal Purple</option>
              <option value="sunset">Theme: Warm Sunset</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-slate-950/70 px-3 py-2 rounded-xl border border-amber-500/20">
              <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <label
                htmlFor="settings-study-goal-slider"
                className="text-[11px] font-bold text-slate-300 whitespace-nowrap"
              >
                Daily Goal:
              </label>
              <input
                id="settings-study-goal-slider"
                type="range"
                min={30}
                max={480}
                step={15}
                value={settings.dailyStudyGoalMinutes || 120}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    dailyStudyGoalMinutes: Number(e.target.value),
                  })
                }
                aria-label="Daily Study Goal Minutes Slider"
                className="classic-slider flex-1"
              />
              <span className="text-[11px] font-mono font-bold text-amber-300 min-w-[3rem] text-right">
                {settings.dailyStudyGoalMinutes || 120}m
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/70 px-3 py-2 rounded-xl border border-amber-500/20">
              <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <label
                htmlFor="settings-pomodoro-slider"
                className="text-[11px] font-bold text-slate-300 whitespace-nowrap"
              >
                Pomodoro:
              </label>
              <input
                id="settings-pomodoro-slider"
                type="range"
                min={15}
                max={90}
                step={5}
                value={settings.pomodoroFocusMinutes || 25}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    pomodoroFocusMinutes: Number(e.target.value),
                  })
                }
                aria-label="Default Pomodoro Focus Minutes Slider"
                className="classic-slider flex-1"
              />
              <span className="text-[11px] font-mono font-bold text-emerald-300 min-w-[2.5rem] text-right">
                {settings.pomodoroFocusMinutes || 25}m
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Section Quick Filter Bar */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-white/10 overflow-x-auto">
          {[
            {
              id: "all" as SettingsCategoryFilter,
              label: currentLanguage === "hi" ? "सभी सेटिंग्स" : "All Sections",
            },
            {
              id: "profile_security" as SettingsCategoryFilter,
              label:
                currentLanguage === "hi"
                  ? "प्रोफाइल व सुरक्षा"
                  : "1. Profile & Security",
            },
            {
              id: "appearance" as SettingsCategoryFilter,
              label:
                currentLanguage === "hi" ? "दिखावट व थीम" : "2. Appearance & Layout",
            },
            {
              id: "sync_notifications" as SettingsCategoryFilter,
              label:
                currentLanguage === "hi" ? "सिंक व अलर्ट" : "3. Cloud Sync & Alerts",
            },
            {
              id: "data_clear" as SettingsCategoryFilter,
              label:
                currentLanguage === "hi"
                  ? "डेटा व रीसेट (Clear)"
                  : "4. Data, Backup & Clear",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* GROUP 1: STUDENT PROFILE SETTINGS (Identity, Focus Mode & Security)   */}
      {/* ===================================================================== */}
      {showProfileSecurity && (
        <section
          id="settings-group-profile"
          data-testid="settings-group-profile"
          aria-label="Student Profile Settings"
          className="space-y-5"
        >
          <div className="flex items-center justify-between px-1 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm sm:text-base font-extrabold font-heading text-white uppercase tracking-wider">
                {currentLanguage === "hi"
                  ? "अनुभाग I · छात्र प्रोफाइल सेटिंग्स"
                  : "Section I · Student Profile Settings"}
              </h2>
            </div>
            {activeCategory === "profile_security" && (
              <button
                type="button"
                id="settings-nav-to-global-btn"
                onClick={() => setActiveCategory("global_config")}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                {currentLanguage === "hi"
                  ? "ग्लोबल कॉन्फ़िगरेशन पर जाएँ →"
                  : "Go to Global Configuration →"}
              </button>
            )}
          </div>
          {/* 1.1 Active Student Profile & Multi-Student Switcher */}
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                    {t.studentProfiles || "Student Profiles"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentLanguage === "hi"
                      ? "प्रत्येक छात्र के लिए अलग कार्य, अध्ययन, शैक्षणिक और परीक्षा डेटा"
                      : "Isolated tasks, notes, study sessions, and exam data per student"}
                  </p>
                </div>
              </div>

              {onOpenStudentModal && (
                <button
                  type="button"
                  onClick={onOpenStudentModal}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {currentLanguage === "hi"
                      ? "प्रोफाइल प्रबंधित करें"
                      : "Switch / Manage Profiles"}
                  </span>
                </button>
              )}
            </div>

            {activeStudent && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                      activeStudent.avatarColor || "from-cyan-500 to-emerald-500"
                    } flex items-center justify-center text-slate-950 font-bold text-sm font-heading shrink-0`}
                  >
                    {getStudentAvatarInitials(
                      getStudentDisplayName(activeStudent, settings, "Student")
                    )}
                  </div>
                  <div>
                    <h4
                      className="font-bold text-white text-sm font-heading flex items-center gap-2"
                      dir="ltr"
                    >
                      <span>
                        {getStudentDisplayName(
                          activeStudent,
                          settings,
                          "Student"
                        )}
                      </span>
                      <span className="text-xs font-mono text-emerald-400">
                        · Active
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeStudent.classLevel || "Class 12"} ·{" "}
                      {activeStudent.stream || "General"} ·{" "}
                      {activeStudent.board || "CBSE"} Board
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono tabular-nums text-slate-400">
                  {currentLanguage === "hi" ? "पंजीकृत प्रोफाइल: " : "Profiles: "}
                  <span className="text-emerald-400 font-bold">
                    {profiles.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 1.2 Focus Mode Toggle Card */}
          <div
            id="settings-focus-mode-card"
            data-testid="settings-focus-mode-card"
            className={`glass-card p-5 sm:p-6 rounded-3xl border transition-all space-y-4 ${
              isFocusModeEnabled
                ? "border-indigo-500/50 bg-gradient-to-br from-indigo-950/35 via-slate-900/90 to-emerald-950/20"
                : "border-white/10 bg-slate-900/80"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-2xl p-2 flex items-center justify-center font-bold shrink-0 transition-colors ${
                    isFocusModeEnabled
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-indigo-400 border border-white/10"
                  }`}
                >
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                      {currentLanguage === "hi"
                        ? "फोकस मोड (Focus Mode)"
                        : "Focus Mode"}
                    </h3>
                    <span className="text-xs text-slate-500">·</span>
                    <span
                      id="settings-focus-mode-status"
                      className={`text-xs font-mono font-semibold ${
                        isFocusModeEnabled
                          ? "text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      {isFocusModeEnabled
                        ? currentLanguage === "hi"
                          ? "सक्रिय (Distraction-Free)"
                          : "Active — Distractions Hidden"
                        : currentLanguage === "hi"
                        ? "निष्क्रिय (Standard View)"
                        : "Off — Full Dashboard"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    {currentLanguage === "hi"
                      ? "गहन अध्ययन सत्रों के दौरान गैर-जरूरी डैशबोर्ड विजेट (प्रेरणा कोट्स, त्वरित लिंक, विस्तारित एनालिटिक्स और वेलनेस कार्ड) को छिपाता है।"
                      : "Hides non-essential dashboard widgets (Motivation Quotes, Quick Actions, extended Career/Decision cards, and Wellness) to keep your workspace distraction-free."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  id="settings-focus-mode-toggle"
                  data-testid="focus-mode-toggle"
                  role="switch"
                  aria-checked={isFocusModeEnabled}
                  aria-label="Focus Mode"
                  onClick={handleToggleFocusMode}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isFocusModeEnabled ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isFocusModeEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 1.3 Unified Language & Abya AI Language Mode */}
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                  {currentLanguage === "hi"
                    ? "सिस्टम और एआई भाषा प्राथमिकताएं"
                    : "System & Abya AI Language"}
                </h3>
                <p className="text-xs text-slate-400">
                  {currentLanguage === "hi"
                    ? "ऐप इंटरफ़ेस और अव्या एआई मेंटर की भाषा एक ही स्थान से नियंत्रित करें"
                    : "Control app interface language and Abya AI mentor response style in one place"}
                </p>
              </div>
            </div>

            {/* App Interface Language */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {currentLanguage === "hi"
                  ? "1. ऐप इंटरफ़ेस भाषा:"
                  : "1. App Interface Language:"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: "en" as AppLanguage,
                    label: "English",
                    desc: "Full English interface & academic terminology",
                  },
                  {
                    id: "hi" as AppLanguage,
                    label: "हिन्दी (Hindi)",
                    desc: "सम्पूर्ण इंटरफ़ेस, पाठ्यक्रम व प्रश्न बैंक",
                  },
                ].map((langItem) => {
                  const isSelected = currentLanguage === langItem.id;
                  return (
                    <button
                      key={langItem.id}
                      type="button"
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
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-400 text-white font-bold"
                          : "bg-slate-950/60 border-white/10 text-slate-300 hover:border-white/25"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">
                          {langItem.label}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {langItem.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Abya AI Response Language */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  {currentLanguage === "hi"
                    ? "2. अव्या एआई भाषा मोड (Abya AI Response Mode):"
                    : "2. Abya AI Coach Response Language:"}
                </label>
                <span className="text-[11px] font-mono text-emerald-400">
                  Server-Side Gemini Proxy Active
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: "WhatsApp Language" as AbyaLanguageSetting,
                    label: "WhatsApp Mix",
                  },
                  { id: "English" as AbyaLanguageSetting, label: "English" },
                  { id: "Hindi" as AbyaLanguageSetting, label: "Hindi" },
                  { id: "Hinglish" as AbyaLanguageSetting, label: "Hinglish" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (onUpdateAbyaLanguage) onUpdateAbyaLanguage(item.id);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      abyaLanguage === item.id
                        ? "bg-emerald-500 text-slate-950 border-emerald-400"
                        : "bg-slate-950/60 border-white/10 text-slate-300 hover:border-emerald-500/40"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 1.4 Security, PIN Lock & Account Authentication */}
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                    {currentLanguage === "hi"
                      ? "खाता प्रमाणीकरण और पिन सुरक्षा"
                      : "Account & PIN Lock Security"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isPrivateMode
                      ? currentLanguage === "hi"
                        ? "निजी मोड सक्रिय — स्थानीय ब्राउज़र अलगाव"
                        : "Private Mode Active — Local browser storage isolation"
                      : `Signed in as ${
                          settings.account?.email || settings.userName
                        }`}
                  </p>
                </div>
              </div>

              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs transition-all self-start sm:self-auto cursor-pointer"
                >
                  {isPrivateMode
                    ? currentLanguage === "hi"
                      ? "लॉग इन / रजिस्टर"
                      : "Account Sign In"
                    : currentLanguage === "hi"
                    ? "खाता प्रबंधित करें"
                    : "Manage Account"}
                </button>
              )}
            </div>

            {/* PIN Lock Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    {currentLanguage === "hi"
                      ? "पिन लॉक सुरक्षा (4–8 अंक)"
                      : "Numeric PIN App Lock"}
                  </h4>
                  <span className="text-xs font-mono text-slate-400">
                    ·{" "}
                    {settings.security?.enabled && settings.security?.pinHash
                      ? "PIN Active"
                      : "Disabled"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentLanguage === "hi"
                    ? "अपने अध्ययन सत्र, कार्य और नोट्स को सुरक्षित पिन से लॉक करें।"
                    : "Protect your study notes, tasks, and profile with a numeric PIN."}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {settings.security?.enabled && settings.security?.pinHash ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPinModalMode("change")}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                    >
                      {currentLanguage === "hi" ? "पिन बदलें" : "Change PIN"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        lockSession();
                        if (onLockApp) onLockApp();
                      }}
                      className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {currentLanguage === "hi" ? "अभी लॉक करें" : "Lock Now"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinModalMode("remove")}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {currentLanguage === "hi" ? "पिन हटाएं" : "Remove PIN"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPinModalMode("setup")}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>
                      {currentLanguage === "hi"
                        ? "पिन लॉक सेट करें"
                        : "Create PIN Lock"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {settings.security?.enabled && settings.security?.pinHash && (
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {currentLanguage === "hi"
                        ? "ऐप लॉन्च पर लॉक स्क्रीन"
                        : "Require PIN on App Launch"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {currentLanguage === "hi"
                      ? "ब्राउज़र टैब खोलने पर तुरंत पिन मांगें"
                      : "Prompt for PIN verification whenever Garia OS is opened"}
                  </p>
                </div>
                <button
                  type="button"
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
                  className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                    settings.security.lockOnLaunch
                      ? "bg-emerald-500"
                      : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform transform shadow-sm ${
                      settings.security.lockOnLaunch
                        ? "translate-x-4.5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* GROUP 2: GLOBAL CONFIGURATION — APPEARANCE, THEMES & LAYOUT           */}
      {/* ===================================================================== */}
      {(showAppearance || showSyncNotifications || showDataClear) && (
        <div
          id="settings-group-global"
          data-testid="settings-group-global"
          className="flex items-center justify-between px-1 border-b border-white/10 pb-2.5 pt-2"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-extrabold font-heading text-white uppercase tracking-wider">
              {currentLanguage === "hi"
                ? "अनुभाग II · ग्लोबल ओएस कॉन्फ़िगरेशन"
                : "Section II · Global OS Configuration"}
            </h2>
          </div>
          {activeCategory !== "all" && (
            <button
              type="button"
              id="settings-nav-to-profile-btn"
              onClick={() => setActiveCategory("profile_security")}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              {currentLanguage === "hi"
                ? "← प्रोफाइल सेटिंग्स पर वापस जाएँ"
                : "← Back to Profile Settings"}
            </button>
          )}
        </div>
      )}

      {showAppearance && (
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <span>
                  {currentLanguage === "hi"
                    ? "दिखावट व थीम सिस्टम"
                    : "Appearance & Theme System"}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentLanguage === "hi"
                  ? "अपनी पसंद के अनुसार थीम चुनें या सूर्योदय/सूर्यास्त ऑटो-सिंक सक्रिय करें।"
                  : "Switch themes manually or enable automatic daylight/night solar transitions."}
              </p>
            </div>
          </div>

          {/* Geolocation-Based Theme Switcher */}
          <div
            id="geolocation-theme-switcher-card"
            data-testid="geolocation-theme-switcher-card"
            className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  {solarInfo.isDaytime ? (
                    <Sunrise className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Sunset className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-white font-heading">
                      {currentLanguage === "hi"
                        ? "जियोलोकेशन-आधारित थीम स्विचर"
                        : "Geolocation Solar Theme Switcher"}
                    </h4>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-[11px] font-mono text-amber-300 font-semibold">
                      {settings.autoSolarTheme
                        ? solarInfo.isDaytime
                          ? "Active: High Contrast (Daylight)"
                          : `Active: ${preferredNight} (Night)`
                        : "Manual Mode"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {currentLanguage === "hi"
                      ? "दिन के उजाले में 'हाई कॉन्ट्रास्ट' मोड और रात में आपकी पसंदीदा डार्क थीम में स्वचालित रूप से स्विच करता है।"
                      : "Automatically transitions to High Contrast during daylight hours and your preferred dark theme at night."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleAutoSolar(!settings.autoSolarTheme)}
                id="auto-solar-theme-toggle"
                data-testid="geolocation-theme-toggle"
                role="switch"
                aria-checked={Boolean(settings.autoSolarTheme)}
                aria-label="Toggle Geolocation-Based Theme Switcher"
                className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 focus:outline-none flex items-center cursor-pointer ${
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

            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <label
                    htmlFor="preferred-night-theme-select"
                    className="text-xs font-semibold text-slate-300"
                  >
                    Preferred Night Theme:
                  </label>
                  <select
                    id="preferred-night-theme-select"
                    data-testid="preferred-night-theme-select"
                    value={preferredNight}
                    onChange={(e) =>
                      handlePreferredNightThemeChange(
                        e.target.value as AppTheme
                      )
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer"
                  >
                    {DARK_THEME_OPTIONS.map((opt) => (
                      <option
                        key={opt.id}
                        value={opt.id}
                        className="bg-slate-900 text-white"
                      >
                        {opt.label} ({opt.desc})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleSimulationModeChange("auto")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      settings.autoSolarTheme && simMode === "auto"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Auto GPS Solar
                  </button>
                  <button
                    type="button"
                    data-testid="simulate-daylight-high-contrast-btn"
                    onClick={() => handleSimulationModeChange("daylight")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      settings.autoSolarTheme && simMode === "daylight"
                        ? "bg-amber-400 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Daylight
                  </button>
                  <button
                    type="button"
                    data-testid="simulate-night-dark-btn"
                    onClick={() => handleSimulationModeChange("night")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      settings.autoSolarTheme && simMode === "night"
                        ? "bg-indigo-500 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Night ({preferredNight})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Sunrise</div>
                    <div className="font-bold font-mono tabular-nums text-white text-xs">
                      {solarInfo.sunriseFormatted}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Sunset className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Sunset</div>
                    <div className="font-bold font-mono tabular-nums text-white text-xs">
                      {solarInfo.sunsetFormatted}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-slate-300 truncate font-mono tabular-nums">
                      {solarInfo.isUsingGeolocation && solarInfo.coordinatesUsed
                        ? `${solarInfo.coordinatesUsed.lat.toFixed(
                            2
                          )}°, ${solarInfo.coordinatesUsed.lng.toFixed(2)}°`
                        : "Regional Solar"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    data-testid="sync-gps-location-btn"
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/30 transition-all shrink-0 cursor-pointer"
                  >
                    {isLocating ? "Detecting..." : "Sync GPS"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Theme Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {[
              {
                id: "high-contrast",
                label: "High Contrast",
                desc: "Daylight Crisp AAA",
                color: "bg-white border-2 border-slate-950 text-black",
                dot: "bg-black",
              },
              {
                id: "classic",
                label: "Classic Scholar",
                desc: "Ivory & Bronze",
                color: "bg-[#0c1017] border-amber-500/40 text-amber-200",
                dot: "bg-amber-400",
              },
              {
                id: "amoled",
                label: "AMOLED Black",
                desc: "Pure #000000",
                color: "bg-black border-zinc-800",
                dot: "bg-white",
              },
              {
                id: "purple",
                label: "Royal Purple",
                desc: "Deep Violet",
                color: "bg-purple-950 border-purple-800",
                dot: "bg-purple-400",
              },
              {
                id: "midnight",
                label: "Midnight Blue",
                desc: "Navy Horizon",
                color: "bg-sky-950 border-sky-800",
                dot: "bg-cyan-400",
              },
              {
                id: "graphite",
                label: "Graphite Gray",
                desc: "Slate Minimal",
                color: "bg-slate-900 border-slate-700",
                dot: "bg-slate-300",
              },
              {
                id: "arctic",
                label: "Arctic White",
                desc: "Crisp Light",
                color: "bg-slate-100 border-slate-300 text-slate-900",
                dot: "bg-emerald-600",
              },
              {
                id: "frost",
                label: "Frost Glass",
                desc: "Translucent Ice",
                color: "bg-slate-800/60 border-cyan-500/30",
                dot: "bg-cyan-200",
              },
              {
                id: "emerald",
                label: "Emerald Green",
                desc: "Calm Focus",
                color: "bg-emerald-950 border-emerald-800",
                dot: "bg-emerald-400",
              },
              {
                id: "sunset",
                label: "Sunset Orange",
                desc: "Warm Twilight",
                color: "bg-orange-950 border-orange-800",
                dot: "bg-orange-400",
              },
              {
                id: "custom",
                label: "Custom Theme",
                desc: "Hex Color Studio",
                color: "",
                dot: "",
                isCustom: true,
              },
            ].map((themeItem) => {
              const isCustom = themeItem.id === "custom";
              const isActive =
                settings.theme === themeItem.id ||
                (!isCustom &&
                  themeItem.id === "arctic" &&
                  settings.theme === "light") ||
                (!isCustom &&
                  themeItem.id === "midnight" &&
                  settings.theme === "ocean") ||
                (!isCustom &&
                  themeItem.id === "emerald" &&
                  settings.theme === "forest") ||
                (!isCustom &&
                  themeItem.id === "graphite" &&
                  settings.theme === "dark");

              return (
                <button
                  key={themeItem.id}
                  type="button"
                  onClick={() => handleThemeChange(themeItem.id as AppTheme)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-500/15 border-emerald-400 text-white font-bold shadow-sm"
                      : "bg-slate-950/60 border-white/10 text-slate-300 hover:text-white hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {isCustom ? (
                      <div
                        className="w-6 h-6 rounded-lg border border-white/20 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: customBgHex }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: customPrimaryHex }}
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-lg ${themeItem.color} border flex items-center justify-center shrink-0`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${themeItem.dot}`}
                        />
                      </div>
                    )}
                    {isActive && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-heading">
                      {themeItem.label}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {themeItem.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Compact Custom Theme Hex Studio */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  Custom Hex Color Studio
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCustomTheme}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-white/10 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                {settings.theme !== "custom" && (
                  <button
                    type="button"
                    onClick={() => handleThemeChange("custom")}
                    className="text-[11px] px-3 py-1 rounded-lg font-bold bg-emerald-500 text-slate-950 cursor-pointer"
                  >
                    Apply Custom
                  </button>
                )}
              </div>
            </div>

            {hexError && (
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{hexError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-white/10">
                <Pipette className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 shrink-0">Accent:</span>
                <input
                  type="color"
                  value={
                    isValidHex(customPrimaryHex)
                      ? normalizeHex(customPrimaryHex)
                      : "#10B981"
                  }
                  onChange={(e) =>
                    handleUpdateCustomColors(e.target.value, customBgHex)
                  }
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={customPrimaryHex}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomPrimaryHex(val);
                    if (isValidHex(val))
                      handleUpdateCustomColors(val, customBgHex);
                  }}
                  maxLength={7}
                  className="w-full bg-transparent text-white font-mono text-xs uppercase focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-white/10">
                <Moon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-xs text-slate-300 shrink-0">
                  Background:
                </span>
                <input
                  type="color"
                  value={
                    isValidHex(customBgHex)
                      ? normalizeHex(customBgHex)
                      : "#0B0F19"
                  }
                  onChange={(e) =>
                    handleUpdateCustomColors(customPrimaryHex, e.target.value)
                  }
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={customBgHex}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomBgHex(val);
                    if (isValidHex(val))
                      handleUpdateCustomColors(customPrimaryHex, val);
                  }}
                  maxLength={7}
                  className="w-full bg-transparent text-white font-mono text-xs uppercase focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* GROUP 3: CLOUD SYNC, GOOGLE CALENDAR & NOTIFICATIONS                  */}
      {/* ===================================================================== */}
      {showSyncNotifications && (
        <div className="space-y-5">
          {/* 3.1 Firebase Cloud Sync */}
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                    Firebase Firestore Cloud Sync
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cross-device backup and synchronization for all student
                    profiles and modules.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleFbBackup}
                  disabled={isFbSyncing}
                  className="px-3.5 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>{isFbSyncing ? "Syncing..." : "Backup to Cloud"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleFbRestore}
                  disabled={isFbSyncing}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-300">
                {fbUser
                  ? `Connected: ${fbUser.displayName || fbUser.email}`
                  : "Local Offline Session — Sign in to enable cloud backup"}
              </span>
              {fbLastSynced && (
                <span className="text-emerald-400 font-mono">
                  Last synced: {fbLastSynced}
                </span>
              )}
            </div>
          </div>

          {/* 3.2 Google Calendar Sync */}
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                    Google Calendar Sync
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sync tasks, study sessions, exams, and goal deadlines with
                    Google Calendar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gcalSettings.enabled}
                    onChange={(e) =>
                      handleUpdateGCalSettings({ enabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700"
                  />
                  <span>{gcalSettings.enabled ? "Enabled" : "Disabled"}</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsGCalModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Center</span>
                </button>
              </div>
            </div>

            {gcalSettings.enabled && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  {
                    key: "syncTasks",
                    label: "Tasks",
                    checked: gcalSettings.syncTasks,
                    icon: CheckSquare,
                  },
                  {
                    key: "syncStudySessions",
                    label: "Study Sessions",
                    checked: gcalSettings.syncStudySessions,
                    icon: BookOpen,
                  },
                  {
                    key: "syncExams",
                    label: "Exams & Events",
                    checked: gcalSettings.syncExams,
                    icon: Bell,
                  },
                  {
                    key: "syncGoals",
                    label: "Goals",
                    checked: gcalSettings.syncGoals,
                    icon: Target,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <label
                      key={item.key}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between cursor-pointer text-xs text-white"
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-amber-400" />
                        <span>{item.label}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) =>
                          handleUpdateGCalSettings({
                            [item.key]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3.3 Notification Preferences */}
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-400" />
                  <span>{t.notifications || "Notifications"}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure study reminders, deadline alerts, and habit
                  notifications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotifKey("master")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  notifs.master
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-800 text-slate-400 border border-white/10"
                }`}
              >
                {notifs.master ? "Master ON" : "Master OFF"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  key: "study",
                  label: "Study Reminders",
                  desc: "Alerts for scheduled study sessions",
                },
                {
                  key: "tasks",
                  label: "Task Deadlines",
                  desc: "Alerts for due & overdue tasks",
                },
                {
                  key: "revision",
                  label: "Revision Schedule",
                  desc: "Spaced repetition review alerts",
                },
                {
                  key: "habits",
                  label: "Habit Streaks",
                  desc: "Daily routine check-in reminders",
                },
                {
                  key: "water",
                  label: "Hydration Alerts",
                  desc: "Daily water intake reminders",
                },
                {
                  key: "exam",
                  label: "Exam Countdown",
                  desc: "Target exam readiness updates",
                },
              ].map((item) => {
                const isChecked = notifs[item.key as keyof typeof notifs];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      handleToggleNotifKey(item.key as keyof typeof notifs)
                    }
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isChecked
                        ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                        : "bg-slate-950/50 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.desc}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs font-bold shrink-0 ${
                        isChecked
                          ? "bg-emerald-500 border-emerald-400 text-slate-950"
                          : "border-slate-600 bg-slate-900"
                      }`}
                    >
                      {isChecked && "✓"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* GROUP 4: DATA BACKUP, CLEAR & RESET CENTER ("Update clear")           */}
      {/* ===================================================================== */}
      {showDataClear && (
        <div className="space-y-5">
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-400" />
                <span>
                  {currentLanguage === "hi"
                    ? "डेटा बैकअप, सफ़ाई (Clear) और रीसेट केंद्र"
                    : "Data Backup, Clear & Reset Center"}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentLanguage === "hi"
                  ? "एक ही स्थान से अपना डेटा निर्यात/आयात करें या चैट, कैश व अध्ययन डेटा साफ़ करें।"
                  : "Export or import JSON backups, or clear specific data without losing your student profile."}
              </p>
            </div>

            {importStatusMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/15 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                {importStatusMessage}
              </div>
            )}

            {/* 1. Export & Import JSON Backup (Single clean row, no duplicate buttons) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/30 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>
                      {currentLanguage === "hi"
                        ? "JSON बैकअप डाउनलोड करें"
                        : "Export Student Backup (JSON)"}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {currentLanguage === "hi"
                      ? "सक्रिय छात्र के सभी कार्य, नोट्स, लक्ष्य और अध्ययन सत्रों की बैकअप फ़ाइल डाउनलोड करें।"
                      : "Download a complete JSON backup of the active student's tasks, notes, goals, and study logs."}
                  </p>
                </div>
                <button
                  type="button"
                  id="backup-data-btn"
                  onClick={() => {
                    exportStudentProfileJSON(activeStudent?.id);
                    showToast(
                      currentLanguage === "hi"
                        ? "बैकअप JSON सफलतापूर्वक डाउनलोड हो गया!"
                        : "Backup JSON downloaded successfully!"
                    );
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {currentLanguage === "hi" ? "बैकअप डाउनलोड करें" : "Backup Data"}
                  </span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/30 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>
                      {currentLanguage === "hi"
                        ? "JSON बैकअप आयात करें"
                        : "Import Student Backup (JSON)"}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {currentLanguage === "hi"
                      ? "पहले से सहेजी गई JSON बैकअप फ़ाइल से छात्र प्रोफाइल और अध्ययन डेटा बहाल करें।"
                      : "Restore a previously exported Garia OS JSON backup file into your workspace."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {currentLanguage === "hi"
                      ? "डेटा आयात करें (JSON)"
                      : "Import Data (JSON)"}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* 2. Unified Clear & Reset Actions Grid */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="text-xs font-bold text-slate-300">
                {currentLanguage === "hi"
                  ? "डेटा सफ़ाई और रीसेट विकल्प (Clear Options):"
                  : "Clear & Reset Options:"}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: Clear AI Chat History */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>
                        {currentLanguage === "hi"
                          ? "एआई चैट साफ़ करें"
                          : "Clear Abya AI Chat"}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {currentLanguage === "hi"
                        ? "अव्या एआई के सभी चैट संदेश हटाता है"
                        : "Removes all chat messages & sessions with Abya AI"}
                    </p>
                  </div>
                  <button
                    type="button"
                    id="settings-clear-chat-btn"
                    onClick={() => {
                      onClearChatHistory();
                      showToast(
                        currentLanguage === "hi"
                          ? "चैट इतिहास साफ़ किया गया!"
                          : "Abya AI chat history cleared!"
                      );
                    }}
                    className="px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    {currentLanguage === "hi" ? "चैट साफ़ करें" : "Clear Chat"}
                  </button>
                </div>

                {/* Option B: Clear Offline Cache */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {currentLanguage === "hi"
                          ? "ऑफ़लाइन कैश साफ़ करें"
                          : "Clear Offline Cache"}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {currentLanguage === "hi"
                        ? "अस्थायी ब्राउज़र कैश साफ़ करें (डेटा सुरक्षित रहता है)"
                        : "Frees temporary browser cache without deleting study data"}
                    </p>
                  </div>
                  <button
                    type="button"
                    id="settings-clear-cache-btn"
                    onClick={handleClearOfflineCache}
                    disabled={isClearingCache}
                    className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {isClearingCache
                      ? "Clearing..."
                      : currentLanguage === "hi"
                      ? "कैश साफ़ करें"
                      : "Clear Cache"}
                  </button>
                </div>

                {/* Option C: Clear Active Student Workspace Data (Keep Profile) */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Eraser className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {currentLanguage === "hi"
                          ? "वर्तमान छात्र का अध्ययन डेटा साफ़ करें"
                          : "Clear Active Student Study Data"}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {currentLanguage === "hi"
                        ? "प्रोफाइल बनाए रखते हुए सभी कार्य, नोट्स, लक्ष्य और सत्र खाली करें"
                        : "Empties tasks, notes, goals & study logs while keeping your profile & settings"}
                    </p>
                  </div>
                  <button
                    type="button"
                    id="settings-clear-student-data-btn"
                    onClick={() => setShowConfirmClearStudent(true)}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    {currentLanguage === "hi"
                      ? "अध्ययन डेटा साफ़ करें"
                      : "Clear Study Data"}
                  </button>
                </div>

                {/* Option D: Factory Reset All OS Data */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-rose-500/30 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>
                        {currentLanguage === "hi"
                          ? "सम्पूर्ण गारिया ओएस रीसेट करें"
                          : "Factory Reset All OS Data"}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {currentLanguage === "hi"
                        ? "सभी प्रोफाइल, कार्य, नोट्स और सेटिंग्स स्थायी रूप से हटाएं"
                        : "Deletes all student profiles, tasks, notes, and settings"}
                    </p>
                  </div>
                  <button
                    type="button"
                    id="settings-clear-all-data-btn"
                    onClick={() => setShowConfirmClearAll(true)}
                    className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    {currentLanguage === "hi" ? "सब कुछ हटाएं" : "Reset All Data"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* App Installation & System Info */}
          <PWAInstallOption variant="card" currentLanguage={currentLanguage} />

          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold font-heading text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                <span>
                  {currentLanguage === "hi"
                    ? "सिस्टम जानकारी"
                    : "About Garia OS"}
                </span>
              </span>
              <span className="text-xs font-mono text-emerald-400">
                v{APP_VERSION}
              </span>
            </h3>
            <ProductionVersionBadge variant="card" showCopy={true} />
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Active Student Study Data */}
      {showConfirmClearStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setShowConfirmClearStudent(false)}
        >
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-amber-500/40 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-amber-400">
              <Eraser className="w-7 h-7 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                {currentLanguage === "hi"
                  ? "क्या आप वर्तमान छात्र का अध्ययन डेटा साफ़ करना चाहते हैं?"
                  : "Clear Active Student Study Data?"}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentLanguage === "hi"
                ? "यह वर्तमान छात्र के सभी कार्यों, नोट्स, लक्ष्यों, अध्ययन सत्रों और आदतों को खाली कर देगा, लेकिन आपका प्रोफाइल, स्ट्रीम और सेटिंग्स सुरक्षित रहेंगे।"
                : "This will clear all tasks, notes, goals, study sessions, habits, and chat history for the current student so you can start with a clean workspace. Your student profile, stream, theme, and PIN lock will be kept."}
            </p>
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowConfirmClearStudent(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                type="button"
                id="confirm-clear-student-data-btn"
                onClick={handleConfirmClearStudentWorkspace}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                {currentLanguage === "hi"
                  ? "हाँ, अध्ययन डेटा साफ़ करें"
                  : "Yes, Clear Study Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Factory Reset All OS Data */}
      {showConfirmClearAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          onClick={() => setShowConfirmClearAll(false)}
        >
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-rose-500/40 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                {currentLanguage === "hi"
                  ? "क्या आप सम्पूर्ण ओएस डेटा रीसेट करना चाहते हैं?"
                  : "Confirm Factory Reset All OS Data?"}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentLanguage === "hi"
                ? "यह सभी छात्र प्रोफाइल, कार्यों, नोट्स, अध्ययन विषयों, आदतों और सेटिंग्स को स्थायी रूप से हटा देगा।"
                : "This will permanently delete all student profiles, tasks, notes, study subjects, habit streaks, and settings, returning Garia OS to the initial setup screen."}
            </p>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowConfirmClearAll(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                type="button"
                id="confirm-factory-reset-btn"
                onClick={() => {
                  onClearAllOSData();
                  setShowConfirmClearAll(false);
                  showToast(
                    currentLanguage === "hi"
                      ? "गारिया ओएस डेटा रीसेट कर दिया गया है।"
                      : "Garia OS data has been reset."
                  );
                }}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs cursor-pointer"
              >
                {currentLanguage === "hi"
                  ? "हाँ, सभी डेटा हटाएं"
                  : "Yes, Reset Everything"}
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

export default SettingsPage;
