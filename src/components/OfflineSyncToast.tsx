import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, AlertTriangle, X, Database, HardDrive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToOfflineQueue, OfflineQueueState } from "../utils/offlineQueue";
import { onStorageFailure, StorageOperationResult } from "../utils/storage";
import { AppLanguage } from "../utils/i18n";

interface OfflineSyncToastProps {
  currentLanguage?: AppLanguage;
}

interface ToastPayload {
  id: string;
  title: string;
  description: string;
  syncedCount?: number;
  timestamp: number;
  variant: "success" | "warning";
}

export const OfflineSyncToast: React.FC<OfflineSyncToastProps> = ({
  currentLanguage = "en",
}) => {
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null);
  const prevReconcilingRef = useRef<boolean>(false);
  const prevPendingCountRef = useRef<number>(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 1. Listen for storage write errors (quota exceeded, storage unavailable, serialization failure)
    const unsubStorage = onStorageFailure((result: StorageOperationResult) => {
      if (result.error) {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        const isQuota = result.error.code === "QUOTA_EXCEEDED";
        const newToast: ToastPayload = {
          id: `storage-toast-${Date.now()}`,
          title:
            currentLanguage === "hi"
              ? isQuota
                ? "चेतावनी: स्टोरेज कोटा भर गया"
                : "स्टोरेज चेतावनी: डेटा सहेज नहीं पाया"
              : isQuota
              ? "Storage Warning: Quota Reached"
              : "Storage Warning: Unsaved Changes",
          description:
            currentLanguage === "hi"
              ? "ब्राउज़र का लोकल स्टोरेज भर गया है। आपके बदलाव मेमोरी में सुरक्षित हैं, कृपया क्लाउड सिंक करें।"
              : "Browser storage is full. Your pending changes are safely held in memory and will sync when online.",
          variant: "warning",
          timestamp: Date.now(),
        };
        setActiveToast(newToast);
        toastTimeoutRef.current = setTimeout(() => {
          setActiveToast(null);
        }, 7000);
      }
    });

    // 2. Listen for offline queue flush updates
    const unsubQueue = subscribeToOfflineQueue((state: OfflineQueueState) => {
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
          variant: "success",
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
      unsubStorage();
      unsubQueue();
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
            className={`pointer-events-auto w-full glass-card p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3.5 relative overflow-hidden ${
              activeToast.variant === "warning"
                ? "border-amber-500/40 bg-slate-950/95 shadow-amber-500/10"
                : "border-emerald-500/30 bg-slate-950/90 shadow-emerald-500/20"
            }`}
          >
            {/* Top Accent Light Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                activeToast.variant === "warning"
                  ? "from-amber-500 via-orange-400 to-amber-600"
                  : "from-emerald-500 via-teal-400 to-cyan-500"
              }`}
            />

            {/* Glowing Icon */}
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-lg ${
                activeToast.variant === "warning"
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-amber-500/20"
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20"
              }`}
            >
              {activeToast.variant === "warning" ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-heading text-white tracking-tight">
                  {activeToast.title}
                </span>
                {typeof activeToast.syncedCount === "number" && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    {activeToast.syncedCount} Synced
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                {activeToast.description}
              </p>
              <div
                className={`flex items-center gap-1 mt-2 text-[10px] font-medium ${
                  activeToast.variant === "warning"
                    ? "text-amber-400/90"
                    : "text-emerald-400/90"
                }`}
              >
                {activeToast.variant === "warning" ? (
                  <>
                    <HardDrive className="w-3 h-3 text-amber-400" />
                    <span>Memory & Queue Protected</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3 h-3 text-emerald-400" />
                    <span>Cloud Firestore Database Up-to-Date</span>
                  </>
                )}
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
