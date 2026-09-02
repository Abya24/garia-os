import React, { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "motion/react";
import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

interface SwipeableItemCardProps {
  id: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  children: React.ReactNode;
  className?: string;
  completedText?: string;
  uncompletedText?: string;
  disabled?: boolean;
}

export const SwipeableItemCard: React.FC<SwipeableItemCardProps> = ({
  id,
  isCompleted,
  onToggleComplete,
  children,
  className = "",
  completedText = "Mark Complete",
  uncompletedText = "Mark Incomplete",
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);

  // Background visual cues that react to drag distance
  const bgOpacity = useTransform(x, [0, 50, 100], [0, 0.6, 1]);
  const iconScale = useTransform(x, [0, 60, 100], [0.7, 1.1, 1.25]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    // If swiped right past 65px with sufficient velocity or distance
    if (info.offset.x > 65 || (info.offset.x > 40 && info.velocity.x > 300)) {
      onToggleComplete();
    }
  };

  if (disabled) {
    return <div className={`relative ${className}`}>{children}</div>;
  }

  return (
    <div
      id={`swipeable-container-${id}`}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl group select-none touch-pan-y"
    >
      {/* Background revealed action during swipe */}
      <motion.div
        style={{ opacity: bgOpacity }}
        className={`absolute inset-0 flex items-center justify-between px-5 rounded-2xl sm:rounded-3xl transition-colors pointer-events-none ${
          isCompleted
            ? "bg-gradient-to-r from-amber-600/60 to-slate-900/80 text-amber-200"
            : "bg-gradient-to-r from-emerald-600/80 via-teal-600/70 to-slate-900/80 text-emerald-200"
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm font-heading">
          <motion.div style={{ scale: iconScale }}>
            {isCompleted ? (
              <RotateCcw className="w-5 h-5 text-amber-300" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            )}
          </motion.div>
          <span className="drop-shadow-sm font-mono">
            {isCompleted ? uncompletedText : completedText}
          </span>
        </div>

        <span className="text-[10px] uppercase font-mono tracking-wider opacity-70 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Swipe to Toggle
        </span>
      </motion.div>

      {/* Foreground Draggable Card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 110 }}
        dragElastic={{ left: 0, right: 0.4 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className={`relative z-10 ${className} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        {children}
      </motion.div>
    </div>
  );
};
