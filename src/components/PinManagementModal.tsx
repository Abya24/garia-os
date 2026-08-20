import React, { useState } from "react";
import {
  X,
  Lock,
  KeyRound,
  ShieldCheck,
  Check,
  AlertCircle,
  ShieldAlert,
  Trash2,
  RefreshCw,
  Copy,
  CheckCheck,
} from "lucide-react";
import { UserSettings } from "../types";
import {
  setupNewPin,
  changeExistingPin,
  removePin,
  MIN_PIN_LENGTH,
  MAX_PIN_LENGTH,
  isValidPinFormat,
} from "../utils/security";

export type PinModalMode = "setup" | "change" | "remove";

interface PinManagementModalProps {
  isOpen: boolean;
  mode: PinModalMode;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (s: UserSettings) => void;
  onSuccessMessage?: (msg: string) => void;
}

export const PinManagementModal: React.FC<PinManagementModalProps> = ({
  isOpen,
  mode,
  onClose,
  settings,
  onUpdateSettings,
  onSuccessMessage,
}) => {
  const [currentPin, setCurrentPin] = useState<string>("");
  const [newPin, setNewPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [step, setStep] = useState<"input" | "success">("input");
  const [generatedRecoveryCode, setGeneratedRecoveryCode] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setErrorMsg(null);
    setStep("input");
    setGeneratedRecoveryCode("");
    setCopiedCode(false);
    onClose();
  };

  const handleCopyCode = () => {
    if (!generatedRecoveryCode) return;
    navigator.clipboard?.writeText(generatedRecoveryCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (mode === "setup") {
      if (!isValidPinFormat(newPin)) {
        setErrorMsg(`PIN must be between ${MIN_PIN_LENGTH} and ${MAX_PIN_LENGTH} digits (numbers only).`);
        return;
      }
      if (newPin !== confirmPin) {
        setErrorMsg("PINs do not match. Please re-enter.");
        return;
      }

      setIsSubmitting(true);
      const res = await setupNewPin(newPin, settings, onUpdateSettings);
      setIsSubmitting(false);

      if (res.success) {
        setGeneratedRecoveryCode(res.recoveryCode);
        setStep("success");
        if (onSuccessMessage) onSuccessMessage("PIN Lock enabled successfully!");
      } else {
        setErrorMsg("Failed to setup PIN. Please try again.");
      }
    } else if (mode === "change") {
      if (!currentPin) {
        setErrorMsg("Please enter your current PIN.");
        return;
      }
      if (!isValidPinFormat(newPin)) {
        setErrorMsg(`New PIN must be between ${MIN_PIN_LENGTH} and ${MAX_PIN_LENGTH} digits (numbers only).`);
        return;
      }
      if (newPin !== confirmPin) {
        setErrorMsg("New PINs do not match.");
        return;
      }

      setIsSubmitting(true);
      const res = await changeExistingPin(currentPin, newPin, settings, onUpdateSettings);
      setIsSubmitting(false);

      if (res.success) {
        if (res.recoveryCode) setGeneratedRecoveryCode(res.recoveryCode);
        setStep("success");
        if (onSuccessMessage) onSuccessMessage("PIN changed successfully!");
      } else {
        setErrorMsg(res.error || "Failed to change PIN.");
      }
    } else if (mode === "remove") {
      if (!currentPin && settings.security?.pinHash) {
        setErrorMsg("Please enter your current PIN to confirm removal.");
        return;
      }

      setIsSubmitting(true);
      const res = await removePin(currentPin, settings, onUpdateSettings);
      setIsSubmitting(false);

      if (res.success) {
        setStep("success");
        if (onSuccessMessage) onSuccessMessage("PIN Lock removed.");
        setTimeout(handleClose, 1500);
      } else {
        setErrorMsg(res.error || "Failed to remove PIN.");
      }
    }
  };


  return (
    <div
      id="pin-management-modal"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-5 bg-slate-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              {mode === "remove" ? (
                <Trash2 className="w-5 h-5 text-rose-400" />
              ) : mode === "change" ? (
                <RefreshCw className="w-5 h-5 text-cyan-400" />
              ) : (
                <KeyRound className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold font-heading text-white">
                {mode === "setup"
                  ? "Create PIN Lock"
                  : mode === "change"
                  ? "Change Security PIN"
                  : "Remove PIN Lock"}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === "setup"
                  ? "Protect Garia OS with a 4-8 digit numeric PIN"
                  : mode === "change"
                  ? "Update your current lock screen PIN"
                  : "Disable PIN lock protection on app launch"}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {step === "success" ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white font-heading">
              {mode === "setup"
                ? "PIN Set Successfully!"
                : mode === "change"
                ? "PIN Updated!"
                : "PIN Lock Removed"}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              {mode === "setup"
                ? "Your workspace is now protected with PIN lock."
                : mode === "change"
                ? "Your new PIN will be required on the next session."
                : "App lock has been disabled."}
            </p>

            {generatedRecoveryCode && (mode === "setup" || mode === "change") && (
              <div className="w-full mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Your Secret Recovery Code
                  </span>
                  <span className="text-[10px] text-amber-300/80">Save this code</span>
                </div>
                <div className="flex items-center justify-between bg-slate-950/80 px-3.5 py-2.5 rounded-xl border border-white/10">
                  <span className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
                    {generatedRecoveryCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  If you ever forget your PIN, you can enter this recovery code or your account email to regain immediate access.
                </p>
              </div>
            )}

            <div className="pt-2 w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Current PIN (for Change and Remove) */}
            {(mode === "change" || mode === "remove") && (
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Current PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter current PIN"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-white/10 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-emerald-400 transition-colors"
                  autoFocus
                />
              </div>
            )}

            {/* New PIN (for Setup and Change) */}
            {(mode === "setup" || mode === "change") && (
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  {mode === "setup" ? "Enter 4-8 Digit PIN" : "New PIN"}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-white/10 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-emerald-400 transition-colors"
                  autoFocus={mode === "setup"}
                />
              </div>
            )}

            {/* Confirm New PIN (for Setup and Change) */}
            {(mode === "setup" || mode === "change") && (
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-white/10 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            )}

            {mode === "remove" && (
              <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl">
                ⚠️ Disabling PIN lock means the app will open directly without asking for a code on launch.
              </p>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all ${
                  mode === "remove"
                    ? "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                } disabled:opacity-50`}
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : mode === "setup" ? (
                  <span>Set PIN</span>
                ) : mode === "change" ? (
                  <span>Update PIN</span>
                ) : (
                  <span>Remove PIN</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
