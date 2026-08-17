import React from "react";
import { ChevronUp, ChevronDown, EyeOff, Settings2, MoreHorizontal } from "lucide-react";
import { HomeWidgetId } from "../../../types";
import { WIDGET_METADATA } from "../../../utils/dashboardWidgets";

interface WidgetCardWrapperProps {
  id: HomeWidgetId;
  children: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onOpenCustomizer?: () => void;
  showControls?: boolean;
  className?: string;
}

export const WidgetCardWrapper: React.FC<WidgetCardWrapperProps> = ({
  id,
  children,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
  onHide,
  onOpenCustomizer,
  showControls = true,
  className = "",
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const meta = WIDGET_METADATA[id];

  return (
    <div
      id={`widget-container-${id}`}
      className={`group relative transition-all duration-200 ${className}`}
    >
      {/* Mini Top-Right Quick Widget Controls */}
      {showControls && (
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 backdrop-blur-md px-1.5 py-1 rounded-xl border border-white/10 shadow-lg">
          {!isFirst && onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              title="Move Up"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}

          {!isLast && onMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              title="Move Down"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          {onHide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHide();
              }}
              title="Hide this widget"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenCustomizer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenCustomizer();
              }}
              title="Customize Dashboard Widgets"
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
