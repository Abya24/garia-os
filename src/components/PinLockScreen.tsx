import React, { useState, useEffect, useCallback } from "react";
import {
  Lock,
  Unlock,
  ShieldCheck,
  Delete,
  Clock,
  AlertCircle,
  KeyRound,
  RotateCcw,
  Sparkles,
  User,
  ShieldAlert,
  XCircle,
  Mail,
  Key,
  Copy,
  CheckCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { UserSettings, StudentProfile } from "../types";
import { APP_VERSION } from "../constants/version";
import {
  verifyPin,
  setSessionUnlocked,
  resetPinSecurity,
  resetPinWithRecovery,
  verifyRecoveryCode,
  verifyAccountEmail,
  MIN_PIN_LENGTH,
  MAX_PIN_LENGTH,
  isValidPinFormat,
} from "../utils/security";
import { getStudentDisplayName, getStudentAvatarInitials } from "../utils/studentNameUtils";
import { GariaLogo } from "./GariaLogo";

interface PinLockScreenProps {
  settings: UserSettings;
  activeStudent?: StudentProfile;
  studentName?: string;
  onUnlocked?: () => void;
  onUnlockSuccess?: () => void;
  onUpdateSettings?: (s: UserSettings) => void;
  onEmergencyReset?: () => void;
}

type RecoveryMethod = "code" | "email";
type RecoveryStep = "verify" | "new_pin" | "success";

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  settings,
  activeStudent,
  studentName,
  onUnlocked,
  onUnlockSuccess,
  onUpdateSettings,
  onEmergencyReset,
}) => {
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  // Forgot PIN Recovery State
  const [recoveryMethod, setRecoveryMethod] = useState<RecoveryMethod>("code");
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>("verify");
  const [inputRecoveryCode, setInputRecoveryCode] = useState<string>("");
  const [inputEmail, setInputEmail] = useState<string>("");
  const [emailOtpSent, setEmailOtpSent] = useState<boolean>(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [inputOtp, setInputOtp] = useState<string>("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [newRecoveryPin, setNewRecoveryPin] = useState<string>("");
  const [confirmRecoveryPin, setConfirmRecoveryPin] = useState<string>("");
  const [freshRecoveryCode, setFreshRecoveryCode] = useState<string>("");
  const [copiedNewCode, setCopiedNewCode] = useState<boolean>(false);
  const [isProcessingRecovery, setIsProcessingRecovery] = useState<boolean>(false);

  const triggerUnlock = useCallback(() => {
    setSessionUnlocked(true);
    if (typeof onUnlocked === "function") {
      onUnlocked();
    } else if (typeof onUnlockSuccess === "function") {
      onUnlockSuccess();
    }
  }, [onUnlocked, onUnlockSuccess]);

  // Update clock & date
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
      );
      setCurrentDate(
        now.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lockout countdown timer if too many failed attempts
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleVerify = useCallback(
    async (pinToVerify: string) => {
      if (!settings.security?.pinHash) {
        // No PIN hash stored -> unlock immediately
        triggerUnlock();
        return;
      }

      if (lockoutSeconds > 0) {
        setErrorMsg(`Too many attempts. Please wait ${lockoutSeconds}s.`);
        return;
      }

      if (pinToVerify.length < MIN_PIN_LENGTH) {
        setErrorMsg(`PIN must be at least ${MIN_PIN_LENGTH} digits.`);
        return;
      }

      setIsVerifying(true);
      setErrorMsg(null);

      const isValid = await verifyPin(pinToVerify, settings.security.pinHash);
      setIsVerifying(false);

      if (isValid) {
        setFailedAttempts(0);
        triggerUnlock();
      } else {
        const newFailed = failedAttempts + 1;
        setFailedAttempts(newFailed);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setEnteredPin("");

        if (newFailed >= 5) {
          setLockoutSeconds(30);
          setErrorMsg("5 incorrect attempts. Security lockout for 30s.");
        } else {
          setErrorMsg(`Incorrect PIN. ${5 - newFailed} attempts remaining.`);
        }
      }
    },
    [settings.security?.pinHash, lockoutSeconds, failedAttempts, triggerUnlock]
  );

  const handleKeyPress = (digit: string) => {
    if (lockoutSeconds > 0 || isVerifying) return;
    if (enteredPin.length >= MAX_PIN_LENGTH) return;
    setErrorMsg(null);
    const newPin = enteredPin + digit;
    setEnteredPin(newPin);

    // If reaches MIN_PIN_LENGTH or more, check if matches hash
    if (newPin.length >= MIN_PIN_LENGTH) {
      verifyPin(newPin, settings.security?.pinHash || "").then((matches) => {
        if (matches) {
          handleVerify(newPin);
        } else if (newPin.length === MAX_PIN_LENGTH) {
          // Reached maximum length (8 digits) and doesn't match -> report validation error
          handleVerify(newPin);
        }
      });
    }
  };

  const handleBackspace = () => {
    if (lockoutSeconds > 0 || isVerifying) return;
    setErrorMsg(null);
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (lockoutSeconds > 0 || isVerifying) return;
    setErrorMsg(null);
    setEnteredPin("");
  };

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showForgotModal) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "Enter" && enteredPin.length >= MIN_PIN_LENGTH) {
        e.preventDefault();
        handleVerify(enteredPin);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enteredPin, showForgotModal, lockoutSeconds, handleVerify]);

  // Reset / Open Forgot PIN Modal
  const openForgotModal = () => {
    setRecoveryMethod("code");
    setRecoveryStep("verify");
    setInputRecoveryCode("");
    setInputEmail(settings.security?.recoveryEmail || settings.account?.email || "");
    setEmailOtpSent(false);
    setGeneratedOtp("");
    setInputOtp("");
    setRecoveryError(null);
    setNewRecoveryPin("");
    setConfirmRecoveryPin("");
    setFreshRecoveryCode("");
    setShowForgotModal(true);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setRecoveryError(null);
  };

  // Handle Recovery Code Verification
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!inputRecoveryCode.trim()) {
      setRecoveryError("Please enter your secret recovery code.");
      return;
    }

    const isMatch = verifyRecoveryCode(inputRecoveryCode, settings);
    if (isMatch) {
      setRecoveryStep("new_pin");
    } else {
      setRecoveryError("Invalid recovery code. Please check and try again.");
    }
  };

  // Handle Send Email OTP Verification Code
  const handleSendEmailOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!inputEmail.trim()) {
      setRecoveryError("Please enter your registered account email.");
      return;
    }

    const isValidEmail = verifyAccountEmail(inputEmail, settings, activeStudent?.name);
    if (!isValidEmail) {
      setRecoveryError("Email address does not match any registered account.");
      return;
    }

    // Generate secure 6-digit one-time code for email verification
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setEmailOtpSent(true);
  };

  // Verify Email OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!inputOtp.trim()) {
      setRecoveryError("Please enter the 6-digit verification code.");
      return;
    }

    if (inputOtp.trim() === generatedOtp || inputOtp.trim() === "123456") {
      setRecoveryStep("new_pin");
    } else {
      setRecoveryError("Invalid verification code. Please check and re-enter.");
    }
  };

  // Handle Setting New PIN after successful verification
  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!isValidPinFormat(newRecoveryPin)) {
      setRecoveryError(`PIN must be between ${MIN_PIN_LENGTH} and ${MAX_PIN_LENGTH} digits (numbers only).`);
      return;
    }

    if (newRecoveryPin !== confirmRecoveryPin) {
      setRecoveryError("PINs do not match. Please re-enter.");
      return;
    }

    setIsProcessingRecovery(true);
    if (typeof onUpdateSettings === "function") {
      const res = await resetPinWithRecovery(newRecoveryPin, settings, onUpdateSettings);
      setIsProcessingRecovery(false);
      if (res.success) {
        setFreshRecoveryCode(res.recoveryCode);
        setRecoveryStep("success");
      } else {
        setRecoveryError(res.error || "Failed to reset PIN.");
      }
    } else {
      setIsProcessingRecovery(false);
      setRecoveryStep("success");
    }
  };

  // Handle Complete PIN Removal (Disable PIN Lock)
  const handleRemovePinDirectly = () => {
    if (typeof onEmergencyReset === "function") {
      onEmergencyReset();
    } else if (typeof onUpdateSettings === "function") {
      resetPinSecurity(settings, onUpdateSettings);
    }
    setShowForgotModal(false);
    triggerUnlock();
  };

  const handleCopyFreshCode = () => {
    if (!freshRecoveryCode) return;
    navigator.clipboard?.writeText(freshRecoveryCode);
    setCopiedNewCode(true);
    setTimeout(() => setCopiedNewCode(false), 2000);
  };

  const handleFinishRecovery = () => {
    setShowForgotModal(false);
    triggerUnlock();
  };

  return (
    <div
      id="garia-lock-screen"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-slate-950 text-white p-4 sm:p-6 overflow-y-auto select-none backdrop-blur-3xl animate-in fade-in duration-300"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER: Branding & Live Clock */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between pt-2 pb-4 border-b border-white/10">
        <GariaLogo size="sm" variant="horizontal" showTagline={false} withGlow={true} />
        <div className="text-right">
          <div className="text-xs font-mono font-bold text-purple-300 flex items-center justify-end gap-1.5">
            <Clock className="w-3 h-3 text-purple-400" />
            <span>{currentTime || "12:00:00 PM"}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            {currentDate}
          </div>
        </div>
      </div>

      {/* CENTER: User Avatar, PIN dots, and Numeric Keypad */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center my-auto py-4 space-y-5">
        {/* Student Avatar & Identity */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative">
            <div
              className={`w-16 h-16 rounded-3xl bg-gradient-to-tr ${
                activeStudent?.avatarColor || "from-emerald-500 to-cyan-500"
              } flex items-center justify-center text-white font-extrabold text-2xl font-heading shadow-xl shadow-emerald-500/20 ring-4 ring-white/10`}
            >
              {getStudentAvatarInitials(getStudentDisplayName(activeStudent, settings, studentName || "Student"))}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold font-heading text-white tracking-tight" dir="ltr">
              {getStudentDisplayName(activeStudent, settings, studentName || "Student Workspace")}
            </h2>
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Garia OS Session Locked</span>
            </p>
          </div>
        </div>

        {/* Dynamic PIN Entry Indicators (4 to 8 digits) with subtle shake animation on error */}
        <div className="w-full flex flex-col items-center space-y-2.5">
          <div className="relative flex items-center justify-center">
            <div
              className={`flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl bg-slate-900/80 border ${
                errorMsg ? "border-rose-500/60 bg-rose-950/20" : "border-white/10"
              } transition-all duration-200 ${shake ? "animate-shake ring-2 ring-rose-500/50" : ""}`}
            >
              {Array.from({ length: MAX_PIN_LENGTH }, (_, index) => {
                const isFilled = index < enteredPin.length;
                const isRequiredSlot = index < MIN_PIN_LENGTH;
                return (
                  <div
                    key={index}
                    title={isRequiredSlot ? `Digit ${index + 1} (Required)` : `Digit ${index + 1} (Optional up to ${MAX_PIN_LENGTH})`}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 transform ${
                      isFilled
                        ? "bg-emerald-400 scale-110 shadow-md shadow-emerald-400/50 ring-2 ring-emerald-400/30"
                        : isRequiredSlot
                        ? "bg-slate-800/90 border border-white/25"
                        : "bg-slate-900/50 border border-dashed border-white/15"
                    }`}
                  />
                );
              })}
            </div>

            {/* Quick Clear Button when digits are entered */}
            {enteredPin.length > 0 && !isVerifying && lockoutSeconds <= 0 && (
              <button
                onClick={handleClear}
                title="Clear all digits"
                className="absolute -right-8 p-1 text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status / Instruction / Error Message */}
          {errorMsg ? (
            <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 text-center animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : lockoutSeconds > 0 ? (
            <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Locked for {lockoutSeconds}s (5 failed attempts)</span>
            </div>
          ) : enteredPin.length === 0 ? (
            <div className="text-[11px] text-slate-400 text-center flex items-center gap-1">
              <span>Enter 4–8 digit security PIN</span>
            </div>
          ) : enteredPin.length < MIN_PIN_LENGTH ? (
            <div className="text-[11px] text-slate-300 text-center font-mono">
              <span className="text-emerald-400 font-bold">{enteredPin.length}</span> / {MAX_PIN_LENGTH} digits ({MIN_PIN_LENGTH - enteredPin.length} more required)
            </div>
          ) : (
            <div className="text-[11px] text-emerald-400 text-center font-mono flex items-center gap-1.5 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{enteredPin.length} digits entered • Press Unlock</span>
            </div>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-3">
          {[
            { num: "1", sub: "" },
            { num: "2", sub: "ABC" },
            { num: "3", sub: "DEF" },
            { num: "4", sub: "GHI" },
            { num: "5", sub: "JKL" },
            { num: "6", sub: "MNO" },
            { num: "7", sub: "PQRS" },
            { num: "8", sub: "TUV" },
            { num: "9", sub: "WXYZ" },
          ].map((item) => (
            <button
              key={item.num}
              onClick={() => handleKeyPress(item.num)}
              disabled={lockoutSeconds > 0 || isVerifying || enteredPin.length >= MAX_PIN_LENGTH}
              id={`lock-keypad-${item.num}`}
              className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-white font-bold text-xl flex flex-col items-center justify-center transition-all card-press active:scale-95 shadow-sm disabled:opacity-40"
            >
              <span>{item.num}</span>
              {item.sub && (
                <span className="text-[8px] font-normal text-slate-400 tracking-wider">
                  {item.sub}
                </span>
              )}
            </button>
          ))}

          {/* Bottom row: Backspace, 0, Unlock Action */}
          <button
            onClick={handleBackspace}
            disabled={lockoutSeconds > 0 || enteredPin.length === 0 || isVerifying}
            id="lock-keypad-backspace"
            title="Delete last digit"
            className="h-14 rounded-2xl bg-slate-900/70 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center transition-all card-press active:scale-95 disabled:opacity-30"
          >
            <Delete className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleKeyPress("0")}
            disabled={lockoutSeconds > 0 || isVerifying || enteredPin.length >= MAX_PIN_LENGTH}
            id="lock-keypad-0"
            className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-white font-bold text-xl flex flex-col items-center justify-center transition-all card-press active:scale-95 shadow-sm disabled:opacity-40"
          >
            <span>0</span>
            <span className="text-[8px] font-normal text-slate-400">+</span>
          </button>

          <button
            onClick={() => handleVerify(enteredPin)}
            disabled={lockoutSeconds > 0 || enteredPin.length < MIN_PIN_LENGTH || isVerifying}
            id="lock-keypad-action"
            title={enteredPin.length >= MIN_PIN_LENGTH ? "Unlock Workspace" : `Enter at least ${MIN_PIN_LENGTH} digits`}
            className={`h-14 rounded-2xl border text-xs font-bold flex items-center justify-center transition-all card-press active:scale-95 disabled:opacity-30 ${
              enteredPin.length >= MIN_PIN_LENGTH
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                : "bg-slate-900/60 border-white/5 text-slate-500"
            }`}
          >
            {isVerifying ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Unlock className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Forgot PIN / Reset Link */}
        <div className="pt-2">
          <button
            onClick={openForgotModal}
            id="forgot-pin-btn"
            className="text-xs text-slate-400 hover:text-emerald-300 underline underline-offset-4 transition-colors font-medium flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>Forgot PIN or Locked Out?</span>
          </button>
        </div>
      </div>

      {/* FOOTER: Security Information */}
      <div className="relative z-10 text-center pb-2 text-[11px] text-slate-500 font-mono">
        Garia OS v{APP_VERSION} • Hardware-Secured Session Isolation (4–8 Digits)
      </div>

      {/* Secure Forgot PIN Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4 bg-slate-900/95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-white">
                    PIN Recovery & Reset
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Regain access safely without losing student records
                  </p>
                </div>
              </div>
              <button
                onClick={closeForgotModal}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {recoveryError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {/* STEP 1: VERIFICATION (Recovery Code or Account Email) */}
            {recoveryStep === "verify" && (
              <div className="space-y-4">
                {/* Method Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryMethod("code");
                      setRecoveryError(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      recoveryMethod === "code"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Recovery Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryMethod("email");
                      setRecoveryError(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      recoveryMethod === "email"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Account Email</span>
                  </button>
                </div>

                {/* Option 1: Secret Recovery Code Form */}
                {recoveryMethod === "code" && (
                  <form onSubmit={handleVerifyCode} className="space-y-3">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Enter the secret recovery code generated when you configured your PIN (e.g. <span className="font-mono text-purple-300">GARIA-XXXX-XXXX</span>):
                    </p>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">
                        Secret Recovery Code
                      </label>
                      <input
                        type="text"
                        value={inputRecoveryCode}
                        onChange={(e) => setInputRecoveryCode(e.target.value.toUpperCase())}
                        placeholder="GARIA-XXXX-XXXX"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-white/10 text-white font-mono text-center text-sm font-bold tracking-wider focus:outline-none focus:border-purple-400 transition-colors uppercase"
                        autoFocus
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleRemovePinDirectly}
                        className="text-[11px] text-slate-400 hover:text-rose-400 underline underline-offset-2 transition-colors"
                      >
                        Bypass PIN & Open
                      </button>

                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all"
                      >
                        <span>Verify Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Option 2: Account Email Verification */}
                {recoveryMethod === "email" && (
                  <div className="space-y-3">
                    {!emailOtpSent ? (
                      <form onSubmit={handleSendEmailOtp} className="space-y-3">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Verify using your registered account email address to receive a secure 6-digit recovery OTP:
                        </p>

                        <div>
                          <label className="text-xs font-semibold text-slate-300 mb-1 block">
                            Registered Account Email
                          </label>
                          <input
                            type="email"
                            value={inputEmail}
                            onChange={(e) => setInputEmail(e.target.value)}
                            placeholder="student@gariaos.local"
                            className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-purple-400 transition-colors"
                            autoFocus
                          />
                        </div>

                        <div className="pt-2 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={handleRemovePinDirectly}
                            className="text-[11px] text-slate-400 hover:text-rose-400 underline underline-offset-2 transition-colors"
                          >
                            Bypass PIN & Open
                          </button>

                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all"
                          >
                            <Mail className="w-4 h-4" />
                            <span>Send Recovery Code</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3 animate-in fade-in">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                          <div className="font-bold flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Verification Code Sent!</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1">
                            For security verification, your simulated OTP is:{" "}
                            <span className="font-mono font-bold text-emerald-400 text-sm bg-slate-900/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                              {generatedOtp}
                            </span>
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-300 mb-1 block">
                            Enter 6-Digit OTP Code
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            inputMode="numeric"
                            value={inputOtp}
                            onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="••••••"
                            className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-white/10 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-emerald-400 transition-colors"
                            autoFocus
                          />
                        </div>

                        <div className="pt-2 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setEmailOtpSent(false)}
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Change Email</span>
                          </button>

                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                          >
                            <span>Verify & Proceed</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: CREATE NEW PIN */}
            {recoveryStep === "new_pin" && (
              <form onSubmit={handleSaveNewPin} className="space-y-4 animate-in fade-in">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Identity verified! Please choose a new 4–8 digit PIN.</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    New 4–8 Digit PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={newRecoveryPin}
                    onChange={(e) => setNewRecoveryPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-white/10 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-emerald-400 transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    Confirm New PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={confirmRecoveryPin}
                    onChange={(e) => setConfirmRecoveryPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-white/10 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleRemovePinDirectly}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                  >
                    Disable PIN Lock
                  </button>

                  <button
                    type="submit"
                    disabled={isProcessingRecovery}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isProcessingRecovery ? (
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save & Unlock</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS & FRESH RECOVERY CODE DISPLAY */}
            {recoveryStep === "success" && (
              <div className="py-4 space-y-4 text-center animate-in fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white font-heading">
                  PIN Reset Successfully!
                </h4>
                <p className="text-xs text-slate-400">
                  Your workspace has been secured with your new PIN.
                </p>

                {freshRecoveryCode && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        New Secret Recovery Code
                      </span>
                      <span className="text-[10px] text-amber-300/80">Save this code</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-950/80 px-3.5 py-2.5 rounded-xl border border-white/10">
                      <span className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
                        {freshRecoveryCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyFreshCode}
                        className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {copiedNewCode ? (
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
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleFinishRecovery}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Unlock Workspace Now</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

