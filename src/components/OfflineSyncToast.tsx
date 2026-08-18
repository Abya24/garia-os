import React, { useState, useEffect, useRef } from "react";
import { CloudCheck, CheckCircle2, Cloud, Sparkles, X, ArrowUpRight, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { subscribeToOfflineQueue, OfflineQueueState } from "../utils/offlineQueue";
import { AppLanguage } from "../utils/i18n";

interface OfflineSyncToastProps {
  currentLanguage?: AppLanguage;
}

interface ToastPayload {
  id: string;
  title: string;
  description: string;
  syncedCount: number;
  timestamp: number;
}

export const OfflineSyncToast: React.FC<OfflineSyncToastProps> = ({
  currentLanguage = "en",
}) => {
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null);
  const prevReconcilingRef = useRef<boolean>(false);
  const prevPendingCountRef = useRef<number>(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = subscribeToOfflineQueue((state: OfflineQueueState) => {
      const wasReconciling = prevReconcilingRef.current;
      const isNowFinished = wasReconciling && !state.isReconciling;
      const hadPending = prevPendingCountRef.current > 0;
      const isSuccess = state.lastReconciliationStatus === "success";

      // Trigger toast when a reconciliation finishes successfully after having queued actions
      if ((isNowFinished && isSuccess && hadPending) || (isSuccess && state.syncProgress.stage === "complete" && hadPending)) {
        const count = prevPendingCountRef.current || 1;
        
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }

        const newToast: ToastPayload = {
          id: `sync-toast-${Date.now()}`,
          title: currentLanguage === "hi" ? "डेटा सफलतापूर्वक सिंक हुआ" : "Data Synced with Firestore",
          description:
            currentLanguage === "hi"
              ? `${count} ऑफ़लाइन बदलाव क्लाउड डेटाबेस में सुरक्षित हो गए हैं। आपका डेटा अप-टू-डेट है।`
              : `${count} offline action${count > 1 ? "s" : ""} flushed to cloud. Your academic data is now up-to-date.`,
          syncedCount: count,
          timestamp: Date.now(),
        };

        setActiveToast(newToast);
        prevPendingCountRef.current = 0;

        toastTimeoutRef.current = setTimeout(() => {
          setActiveToast(null);
        }, 5000);
      }

      prevReconcilingRef.current = state.isReconciling;
      if (state.pendingCount > 0) {
        prevPendingCountRef.current = state.pendingCount;
      }
    });

    return () => {
      unsub();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [currentLanguage]);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 pointer-events-none flex flex-col items-end gap-2 max-w-sm w-full px-2">
      <AnimatePresence>
        {activeToast && (
          <motion.div
            key={activeToast.id}
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="pointer-events-auto w-full glass-card p-4 rounded-2xl border border-emerald-500/30 bg-slate-950/90 shadow-2xl backdrop-blur-xl flex items-start gap-3.5 relative overflow-hidden"
          >
            {/* Top Accent Light Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

            {/* Glowing Icon with Checkmark Animation */}
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-heading text-white tracking-tight">
                  {activeToast.title}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {activeToast.syncedCount} Synced
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                {activeToast.description}
              </p>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-400/90 font-medium">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Cloud Firestore Database Up-to-Date</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setActiveToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss Toast"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
