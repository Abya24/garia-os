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
  Eye,
  EyeOff,
} from "lucide-react";
import { DashboardWidgetConfig, HomeWidgetId } from "../../types";
import {
  WIDGET_METADATA,
  WIDGET_PRESETS,
  DEFAULT_DASHBOARD_WIDGETS,
  reorderWidgetList,
  toggleWidgetEnabled,
  moveWidgetPosition,
  WidgetMeta,
} from "../../utils/dashboardWidgets";
import { AppLanguage } from "../../utils/i18n";

interface DashboardWidgetCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidgetConfig[];
  onSave: (updatedWidgets: DashboardWidgetConfig[]) => void;
  currentLanguage: AppLanguage;
  profileId?: string;
}

export const DashboardWidgetCustomizer: React.FC<DashboardWidgetCustomizerProps> = ({
  isOpen,
  onClose,
  widgets,
  onSave,
  currentLanguage,
  profileId,
}) => {
  const [localWidgets, setLocalWidgets] = useState<DashboardWidgetConfig[]>(() => [...widgets]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Sync state if props change when opening
  React.useEffect(() => {
    setLocalWidgets([...widgets]);
  }, [widgets, isOpen]);

  if (!isOpen) return null;

  const enabledCount = localWidgets.filter((w) => w.enabled).length;

  const handleToggle = (id: HomeWidgetId) => {
    const updated = localWidgets.map((w) =>
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    setLocalWidgets(updated);
    setSelectedPresetId(null);
  };

  const handleMove = (id: HomeWidgetId, direction: "up" | "down") => {
    const currentIndex = localWidgets.findIndex((w) => w.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= localWidgets.length) return;

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
        return <ListTodo className="w-4 h-4 text-rose-400" />;
      case "BarChart3":
        return <BarChart3 className="w-4 h-4 text-emerald-400" />;
      case "Droplet":
        return <Droplet className="w-4 h-4 text-blue-400" />;
      case "Compass":
        return <Compass className="w-4 h-4 text-cyan-400" />;
      case "Flame":
        return <Flame className="w-4 h-4 text-amber-500" />;
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

  // Filter widgets for the list
  const filteredWidgets = localWidgets.filter((w) => {
    const meta = WIDGET_METADATA[w.id];
    if (!meta) return false;
    if (activeCategory === "all") return true;
    return meta.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-card w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-white/15 bg-slate-900/95 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
                <span>{currentLanguage === "hi" ? "डैशबोर्ड विजेट्स अनुकूलित करें" : "Customize Home Dashboard"}</span>
                <span className="text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {enabledCount}/{localWidgets.length} {currentLanguage === "hi" ? "सक्रिय" : "Active"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {currentLanguage === "hi"
                  ? "विजेट्स जोड़ें, हटाएं या क्रम बदलें।"
                  : "Add, remove, and reorder widgets to match your study flow."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          {/* PRESETS ROW */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>{currentLanguage === "hi" ? "त्वरित लेआउट प्रीसेट" : "Preset Layouts"}</span>
              <span className="text-[10px] text-slate-500">1-Tap Apply</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {WIDGET_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between min-h-[75px] ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm shadow-emerald-500/10"
                        : "bg-slate-950/40 hover:bg-slate-800/60 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        {currentLanguage === "hi" ? preset.nameHi : preset.name.split("(")[0]}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                      {currentLanguage === "hi" ? preset.descriptionHi : preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CATEGORY FILTER TABS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-white/5">
            {[
              { id: "all", label: currentLanguage === "hi" ? "सभी" : "All Widgets", count: localWidgets.length },
              { id: "productivity", label: currentLanguage === "hi" ? "उत्पादकता" : "Productivity", count: 3 },
              { id: "academic", label: currentLanguage === "hi" ? "अध्ययन" : "Academic", count: 3 },
              { id: "wellness", label: currentLanguage === "hi" ? "स्वास्थ्य व आदतें" : "Wellness", count: 3 },
              { id: "core", label: currentLanguage === "hi" ? "कोर सिस्टम" : "Core Systems", count: 3 },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* WIDGETS REORDER & VISIBILITY LIST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>{currentLanguage === "hi" ? "विजेट सूची (क्रम व दृश्यता)" : "Widgets Order & Visibility"}</span>
              <span className="text-[10px] text-slate-500">Use ▲ / ▼ to reorder</span>
            </div>

            <div className="space-y-2">
              {filteredWidgets.map((w, index) => {
                const meta = WIDGET_METADATA[w.id];
                if (!meta) return null;
                const fullIndex = localWidgets.findIndex((item) => item.id === w.id);
                const isFirst = fullIndex === 0;
                const isLast = fullIndex === localWidgets.length - 1;

                return (
                  <div
                    key={w.id}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
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

                    {/* Right: Reorder Buttons & Toggle Switch */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMove(w.id, "up")}
                        disabled={isFirst}
                        title="Move Up"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 hover:text-white transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMove(w.id, "down")}
                        disabled={isLast}
                        title="Move Down"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 hover:text-white transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-white/10 mx-0.5" />

                      {/* Enable/Disable Toggle */}
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
                            <span>{currentLanguage === "hi" ? "सक्रिय" : "Shown"}</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                            <span>{currentLanguage === "hi" ? "छिपा हुआ" : "Hidden"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
