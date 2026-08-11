import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  LogOut,
  UserCheck,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { UserSettings } from "../types";
import { hashPassword } from "../utils/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (s: UserSettings) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,}) => {
  const account = settings.account || {
    email: "private@gariaos.local",
    passwordHash: "",
    name: settings.userName || "Private Student",
    isPrivateMode: true,
    createdAt: Date.now(),
  };

  const [mode, setMode] = useState<"view" | "login" | "signup">(
    account.isPrivateMode ? "login" : "view"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(settings.userName || "");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    const hashed = await hashPassword(password);

    const newAccount = {
      email: email.trim().toLowerCase(),
      passwordHash: hashed,
      name: name.trim() || "Student",
      isPrivateMode: false,
      createdAt: Date.now(),
    };

    onUpdateSettings({
      ...settings,
      userName: newAccount.name,
      account: newAccount,
    });

    setIsLoading(false);
    setSuccessMessage("Account created successfully!");
    setMode("view");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    setIsLoading(true);
    const hashed = await hashPassword(password);

    if (account.passwordHash && account.passwordHash !== hashed) {
      setIsLoading(false);
      setErrorMessage("Incorrect password. Please try again.");
      return;
    }

    const updatedAccount = {
      ...account,
      email: email.trim().toLowerCase(),
      name: account.name || name || "Student",
      isPrivateMode: false,
    };

    onUpdateSettings({
      ...settings,
      userName: updatedAccount.name,
      account: updatedAccount,
    });

    setIsLoading(false);
    setSuccessMessage("Logged in successfully!");
    setMode("view");
  };

  const handleContinuePrivately = () => {
    onUpdateSettings({
      ...settings,
      account: {
        ...account,
        isPrivateMode: true,
      },
    });
    setSuccessMessage("Private Mode Active — No account required.");
    onClose();
  };

  const handleLogout = () => {
    onUpdateSettings({
      ...settings,
      account: {
        ...account,
        isPrivateMode: true,
      },
    });
    setMode("login");
    setSuccessMessage("Logged out. Private Mode active.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl relative space-y-5 bg-[#0b0f19] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl glass-pill text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-xl shadow-emerald-500/20">
            <img
              src="/icon.svg"
              alt="Garia OS Logo"
              className="w-full h-full object-contain rounded-[14px]"
            />
          </div>
          <div>
            <h2 className="text-xl font-extrabold font-heading text-white tracking-tight flex items-center justify-center gap-2">
              Garia OS Account
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                v2.4.0
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Secure authentication & private browser storage
            </p>
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* View mode: Logged In Account Info */}
        {mode === "view" && !account.isPrivateMode && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 font-bold font-heading">
                {account.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-white text-sm font-heading truncate flex items-center gap-2">
                  {account.name}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    Authenticated
                  </span>
                </h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {account.email}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/50 border border-white/5 text-xs text-slate-300 space-y-1">
              <p className="flex items-center gap-1.5 font-medium text-emerald-300">
                <ShieldCheck className="w-4 h-4" /> Password digest encrypted locally
              </p>
              <p className="text-[11px] text-slate-400">
                Your data stays isolated on this browser instance and syncs with your active profile.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* View mode: Currently in Private Mode */}
        {(mode === "login" || mode === "signup" || account.isPrivateMode) && (
          <div className="space-y-4">
            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-white/10 text-xs">
              <button
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-xl font-semibold transition-all ${
                  mode === "login"
                    ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setMode("signup");
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-xl font-semibold transition-all ${
                  mode === "signup"
                    ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={mode === "signup" ? handleSignup : handleLogin} className="space-y-3">
              {mode === "signup" && (
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  "Processing..."
                ) : mode === "signup" ? (
                  <>
                    <KeyRound className="w-4 h-4" /> Create Account
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" /> Log In
                  </>
                )}
              </button>
            </form>

            {/* Continue Privately option */}
            <div className="pt-3 border-t border-white/10 text-center space-y-2">
              <p className="text-[11px] text-slate-400">
                Want to use Garia OS without an account?
              </p>
              <button
                type="button"
                onClick={handleContinuePrivately}
                className="w-full py-2.5 rounded-xl glass-pill text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Continue Privately (No Login Needed)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
