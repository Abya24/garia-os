import React, { useState } from "react";
import {
  X,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  Zap,
  ListTodo,
  BarChart3,
  Droplet,
  Compass,
  Flame,
  Quote,
  BookOpen,
  Timer,
  RotateCw,
  Bot,
  Target,
  Sparkles,
  Layers,
  LayoutGrid,
  ShieldAlert,
  MinusCircle,
  PlusCircle,
  Eye,
  EyeOff,
  Columns,
  Search,
  ArrowUpToLine,
  ArrowDownToLine,
} from "lucide-react";
import { DashboardWidgetConfig, HomeWidgetId, WidgetColSpan } from "../../types";
import {
  WIDGET_METADATA,
  WIDGET_PRESETS,
  DEFAULT_DASHBOARD_WIDGETS,
  reorderWidgetList,
  toggleWidgetEnabled,
  moveWidgetPosition,
  resizeWidgetColSpan,
  WidgetMeta,
} from "../../utils/dashboardWidgets";
import { AppLanguage } from "../../utils/i18n";

interface DashboardWidgetCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidgetConfig[];
  onSave: (updatedWidgets: DashboardWidgetConfig[]) => void;
  currentLanguage?: AppLanguage;
  profileId?: string;
}

export const DashboardWidgetCustomizer: React.FC<DashboardWidgetCustomizerProps> = ({
  isOpen,
  onClose,
  widgets,
  onSave,
  currentLanguage = "en",
  profileId,
}) => {
  const [localWidgets, setLocalWidgets] = useState<DashboardWidgetConfig[]>(() => [...widgets]);
  const [activeTab, setActiveTab] = useState<"arrange" | "gallery" | "presets">("arrange");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Sync state if props change when opening
  React.useEffect(() => {
    setLocalWidgets([...widgets]);
  }, [widgets, isOpen]);

  if (!isOpen) return null;

  const enabledCount = localWidgets.filter((w) => w.enabled).length;

  const handleToggle = (id: HomeWidgetId, forceState?: boolean) => {
    const updated = localWidgets.map((w) =>
      w.id === id
        ? { ...w, enabled: typeof forceState === "boolean" ? forceState : !w.enabled }
        : w
    );
    setLocalWidgets(updated);
    setSelectedPresetId(null);
  };

  const handleResize = (id: HomeWidgetId, colSpan: WidgetColSpan) => {
    const updated = localWidgets.map((w) =>
      w.id === id ? { ...w, colSpan } : w
    );
    setLocalWidgets(updated);
    setSelectedPresetId(null);
  };

  const handleMove = (id: HomeWidgetId, direction: "up" | "down" | "top" | "bottom") => {
    const currentIndex = localWidgets.findIndex((w) => w.id === id);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;
    if (direction === "up") targetIndex = currentIndex - 1;
    else if (direction === "down") targetIndex = currentIndex + 1;
    else if (direction === "top") targetIndex = 0;
    else if (direction === "bottom") targetIndex = localWidgets.length - 1;

    if (targetIndex < 0 || targetIndex >= localWidgets.length || targetIndex === currentIndex) return;

    const copy = [...localWidgets];
    const [removed] = copy.splice(currentIndex, 1);
    copy.splice(targetIndex, 0, removed);

    const normalized = copy.map((w, idx) => ({ ...w, order: idx }));
    setLocalWidgets(normalized);
    setSelectedPresetId(null);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = WIDGET_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setLocalWidgets([...preset.widgets]);
      setSelectedPresetId(presetId);
    }
  };

  const handleResetDefaults = () => {
    setLocalWidgets([...DEFAULT_DASHBOARD_WIDGETS]);
    setSelectedPresetId("balanced");
  };

  const handleSaveAndApply = () => {
    onSave(localWidgets);
    onClose();
  };

  const getWidgetIcon = (iconName: string) => {
    switch (iconName) {
      case "Zap":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "ListTodo":
        return <ListTodo className="w-4 h-4 text-emerald-400" />;
      case "BarChart3":
        return <BarChart3 className="w-4 h-4 text-cyan-400" />;
      case "Droplet":
        return <Droplet className="w-4 h-4 text-blue-400" />;
      case "Compass":
        return <Compass className="w-4 h-4 text-indigo-400" />;
      case "Flame":
        return <Flame className="w-4 h-4 text-rose-500" />;
      case "Quote":
        return <Quote className="w-4 h-4 text-amber-300" />;
      case "BookOpen":
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case "Timer":
        return <Timer className="w-4 h-4 text-amber-400" />;
      case "RotateCw":
        return <RotateCw className="w-4 h-4 text-cyan-400" />;
      case "Bot":
        return <Bot className="w-4 h-4 text-purple-400" />;
      case "Target":
        return <Target className="w-4 h-4 text-amber-400" />;
      default:
        return <LayoutGrid className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSizeLabel = (span?: WidgetColSpan) => {
    switch (span) {
      case "full":
        return "100% Full Width";
      case "half":
        return "50% Half Width";
      case "third":
        return "33% Compact (1/3)";
      case "two-thirds":
        return "67% Wide (2/3)";
      default:
        return "50% Half Width";
    }
  };

  // Filter widgets for search and categories
  const filteredWidgets = localWidgets.filter((w) => {
    const meta = WIDGET_METADATA[w.id];
    if (!meta) return false;

    if (activeCategory !== "all" && meta.category !== activeCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = meta.name.toLowerCase().includes(q) || meta.nameHi.toLowerCase().includes(q);
      const matchDesc = meta.description.toLowerCase().includes(q) || meta.descriptionHi.toLowerCase().includes(q);
      const matchTag = meta.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTag) return false;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-card w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-white/15 bg-slate-900/95 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
                <span>
                  {currentLanguage === "hi"
                    ? "डैशबोर्ड विजेट्स अनुकूलन"
                    : "Customize Dashboard Widgets"}
                </span>
                <span className="text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {enabledCount}/{localWidgets.length} {currentLanguage === "hi" ? "सक्रिय" : "Active"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {currentLanguage === "hi"
                  ? "विजेट्स जोड़ें, हटाएं, आकार बदलें (50%/100%) और क्रम व्यवस्थित करें।"
                  : "Add, remove, resize (50%/100%/33%), and arrange your home workspace."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Customizer"
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NAVIGATION TABS & SEARCH BAR */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-white/5 bg-slate-950/30 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-white/5 self-start">
              <button
                onClick={() => setActiveTab("arrange")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "arrange"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {currentLanguage === "hi" ? "क्रम व आकार" : "Arrange & Resize"}
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "gallery"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {currentLanguage === "hi" ? "+ विजेट गैलरी" : "+ Add Widgets"}
              </button>
              <button
                onClick={() => setActiveTab("presets")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "presets"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {currentLanguage === "hi" ? "लेआउट प्रीसेट" : "Presets"}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentLanguage === "hi" ? "विजेट खोजें..." : "Filter widgets..."}
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: "all", label: currentLanguage === "hi" ? "सभी" : "All Categories" },
              { id: "productivity", label: currentLanguage === "hi" ? "उत्पादकता" : "Productivity" },
              { id: "academic", label: currentLanguage === "hi" ? "शैक्षणिक" : "Academic" },
              { id: "wellness", label: currentLanguage === "hi" ? "स्वास्थ्य व आदतें" : "Wellness" },
              { id: "core", label: currentLanguage === "hi" ? "कोर इकोसिस्टम" : "Core Systems" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* MODAL SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {/* TAB 1: PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>{currentLanguage === "hi" ? "क्यूरेटेड लेआउट प्रीसेट" : "Curated Dashboard Layouts"}</span>
                <span className="text-[10px] text-slate-500">1-Tap Instant Setup</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WIDGET_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset.id)}
                      className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                          : "bg-slate-950/50 hover:bg-slate-800/60 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{currentLanguage === "hi" ? preset.nameHi : preset.name}</span>
                            {isSelected && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {currentLanguage === "hi" ? preset.descriptionHi : preset.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                        <span>{preset.widgets.filter((w) => w.enabled).length} Widgets Enabled</span>
                        <span className="text-emerald-400 font-bold hover:underline">Apply Layout →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GALLERY / ADD WIDGETS */}
          {activeTab === "gallery" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>{currentLanguage === "hi" ? "विजेट गैलरी" : "Predefined Widget Gallery"}</span>
                <span className="text-[10px] text-slate-500">Tap to Add or Remove</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredWidgets.map((w) => {
                  const meta = WIDGET_METADATA[w.id];
                  if (!meta) return null;

                  return (
                    <div
                      key={w.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        w.enabled
                          ? "bg-slate-900/90 border-emerald-500/30 shadow-sm"
                          : "bg-slate-950/40 border-white/5 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                          {getWidgetIcon(meta.iconName)}
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">
                              {currentLanguage === "hi" ? meta.nameHi : meta.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 capitalize font-mono border border-white/5">
                              {meta.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {currentLanguage === "hi" ? meta.descriptionHi : meta.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Default: {getSizeLabel(w.colSpan || meta.defaultColSpan)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggle(w.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            w.enabled
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                          }`}
                        >
                          {w.enabled ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>{currentLanguage === "hi" ? "हटाएं" : "Remove"}</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>{currentLanguage === "hi" ? "+ जोड़ें" : "+ Add to Home"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ARRANGE & RESIZE (MAIN LIST) */}
          {activeTab === "arrange" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>
                  {currentLanguage === "hi"
                    ? "सक्रिय विजेट क्रम व आकार"
                    : "Active Widgets (Order & Sizing)"}
                </span>
                <span className="text-[10px] text-slate-500">
                  Use ▲ / ▼ to reorder • Change width directly
                </span>
              </div>

              <div className="space-y-2">
                {filteredWidgets.map((w) => {
                  const meta = WIDGET_METADATA[w.id];
                  if (!meta) return null;
                  const fullIndex = localWidgets.findIndex((item) => item.id === w.id);
                  const isFirst = fullIndex === 0;
                  const isLast = fullIndex === localWidgets.length - 1;
                  const currentSpan = w.colSpan || meta.defaultColSpan || "half";

                  return (
                    <div
                      key={w.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
                        w.enabled
                          ? "bg-slate-900/90 border-white/10 shadow-sm"
                          : "bg-slate-950/40 border-white/5 opacity-50"
                      }`}
                    >
                      {/* Left: Drag / Index & Icon & Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-[11px] font-mono font-bold text-slate-500 w-5 text-center shrink-0">
                          #{fullIndex + 1}
                        </span>

                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                          {getWidgetIcon(meta.iconName)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {currentLanguage === "hi" ? meta.nameHi : meta.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 capitalize font-mono border border-white/5">
                              {meta.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {currentLanguage === "hi" ? meta.descriptionHi : meta.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Size Selector & Reorder Controls & Toggle */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        {/* Size Picker Dropdown/Pills */}
                        {w.enabled && (
                          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                            {(["half", "full", "third"] as WidgetColSpan[]).map((spanOpt) => (
                              <button
                                key={spanOpt}
                                type="button"
                                onClick={() => handleResize(w.id, spanOpt)}
                                title={getSizeLabel(spanOpt)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-colors ${
                                  currentSpan === spanOpt
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                {spanOpt === "full" ? "100%" : spanOpt === "half" ? "50%" : "33%"}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMove(w.id, "top")}
                            disabled={isFirst}
                            title="Move to Top"
                            aria-label="Move to Top"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 hover:text-white transition-colors"
                          >
                            <ArrowUpToLine className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMove(w.id, "up")}
                            disabled={isFirst}
                            title="Move Up"
                            aria-label="Move Up"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 hover:text-white transition-colors"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMove(w.id, "down")}
                            disabled={isLast}
                            title="Move Down"
                            aria-label="Move Down"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 hover:text-white transition-colors"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Visibility Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggle(w.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            w.enabled
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border border-white/5 hover:bg-slate-700 hover:text-white"
                          }`}
                        >
                          {w.enabled ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden sm:inline">
                                {currentLanguage === "hi" ? "सक्रिय" : "Shown"}
                              </span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">
                                {currentLanguage === "hi" ? "छिपा" : "Hidden"}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{currentLanguage === "hi" ? "डिफ़ॉल्ट रीसेट" : "Reset Defaults"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              {currentLanguage === "hi" ? "रद्द करें" : "Cancel"}
            </button>

            <button
              onClick={handleSaveAndApply}
              id="save-dashboard-widgets-btn"
              className="px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{currentLanguage === "hi" ? "सहेजें व लागू करें" : "Save & Apply"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
