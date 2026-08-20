import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  EyeOff,
  Settings2,
  Maximize2,
  Minimize2,
  Columns,
  MoreHorizontal,
  MoveUp,
  MoveDown,
  Trash2,
} from "lucide-react";
import { HomeWidgetId, WidgetColSpan } from "../../../types";
import { WIDGET_METADATA, getWidgetColSpanClasses } from "../../../utils/dashboardWidgets";

interface WidgetCardWrapperProps {
  id: HomeWidgetId;
  children: React.ReactNode;
  colSpan?: WidgetColSpan;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onResize?: (newColSpan: WidgetColSpan) => void;
  onHide?: () => void;
  onOpenCustomizer?: () => void;
  showControls?: boolean;
  className?: string;
}

export const WidgetCardWrapper: React.FC<WidgetCardWrapperProps> = ({
  id,
  children,
  colSpan,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
  onResize,
  onHide,
  onOpenCustomizer,
  showControls = true,
  className = "",
}) => {
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const meta = WIDGET_METADATA[id];
  const effectiveColSpan = colSpan || meta?.defaultColSpan || "half";
  const gridSpanClass = getWidgetColSpanClasses(effectiveColSpan);

  const handleNextSize = () => {
    if (!onResize) return;
    const sizes: WidgetColSpan[] = ["half", "full", "third", "two-thirds"];
    const currentIdx = sizes.indexOf(effectiveColSpan);
    const nextIdx = (currentIdx + 1) % sizes.length;
    onResize(sizes[nextIdx]);
  };

  const getSizeLabel = (span: WidgetColSpan) => {
    switch (span) {
      case "full":
        return "100% Full";
      case "half":
        return "50% Half";
      case "third":
        return "33% 1/3";
      case "two-thirds":
        return "67% 2/3";
    }
  };

  return (
    <div
      id={`widget-container-${id}`}
      className={`group relative transition-all duration-200 ${gridSpanClass} ${className}`}
    >
      {/* Top Right Quick Widget Controls Bar */}
      {showControls && (
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-xl border border-white/10 shadow-xl">
          {/* Move Up */}
          {!isFirst && onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              title="Move Widget Up"
              aria-label="Move Widget Up"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Move Down */}
          {!isLast && onMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              title="Move Widget Down"
              aria-label="Move Widget Down"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Resize Selector / Cycle Button */}
          {onResize && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSizeMenu((prev) => !prev);
                }}
                title={`Resize Widget (Current: ${getSizeLabel(effectiveColSpan)})`}
                aria-label="Resize Widget"
                className="px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1 transition-colors"
              >
                <Columns className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">{getSizeLabel(effectiveColSpan)}</span>
              </button>

              {/* Dropdown Menu for Sizes */}
              {showSizeMenu && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-32 bg-slate-900 border border-white/15 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(["full", "half", "third", "two-thirds"] as WidgetColSpan[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onResize(s);
                        setShowSizeMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        effectiveColSpan === s
                          ? "bg-emerald-500/20 text-emerald-300 font-bold"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>{getSizeLabel(s)}</span>
                      {effectiveColSpan === s && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hide / Remove Widget */}
          {onHide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHide();
              }}
              title="Remove/Hide Widget"
              aria-label="Remove/Hide Widget"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Open Full Customizer */}
          {onOpenCustomizer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenCustomizer();
              }}
              title="Customize All Widgets"
              aria-label="Customize All Widgets"
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  );
};
