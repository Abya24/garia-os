import React, { useState } from "react";
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
  LogIn,
  BookOpen,
  Compass,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { StreamType } from "../types";

interface WelcomeScreenProps {
  onCreateAccount: (data: {
    name: string;
    email: string;
    pass: string;
    stream: StreamType;
    classLevel: string;
    board: string;
  }) => void;
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onContinuePrivately: (data: {
    name?: string;
    stream: StreamType;
    classLevel: string;
    board: string;
  }) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateAccount,
  onLogin,
  onContinuePrivately,
}) => {
  const [activeTab, setActiveTab] = useState<"signup" | "login" | "private">("private");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stream, setStream] = useState<StreamType>("Commerce");
  const [classLevel, setClassLevel] = useState("Class 12");
  const [board, setBoard] = useState("CBSE");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    onCreateAccount({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      pass: password,
      stream,
      classLevel,
      board,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    setIsLoading(true);
    const success = await onLogin(email.trim().toLowerCase(), password);
    setIsLoading(false);

    if (!success) {
      setErrorMessage("No matching account found on this browser device. You can create an account or continue privately.");
    }
  };

  const handlePrivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinuePrivately({
      name: name.trim() || "Student",
      stream,
      classLevel,
      board,
    });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg glass-card rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl relative z-10 bg-[#0c101c]/90 backdrop-blur-xl space-y-6">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center">
              <img
                src="/icon.svg"
                alt="Garia OS Logo"
                className="w-full h-full object-contain rounded-[14px]"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
                Welcome to Garia OS
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                v2.4.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Student Productivity &amp; AI Academic Operating System
            </p>
          </div>
        </div>

        {/* Top Option Selector Tabs (Requirement #6) */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-900/80 border border-white/10 text-xs gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("private");
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "private"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Private</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("signup");
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "signup"
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>Create</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "login"
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>Log In</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Content Area */}
        {activeTab === "private" && (
          <form onSubmit={handlePrivateSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Private Local Session</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                No account or internet sign-in required. All your tasks, notes, study logs, and exam data are stored exclusively on this browser device.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    dir="ltr"
                    style={{ direction: "ltr", textAlign: "left" }}
                    placeholder="e.g. Alex Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400 text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1">
                    Stream
                  </label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value as StreamType)}
                    className="w-full px-3 py-2.5 rounded-xl glass-pill bg-slate-900 text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Commerce">Commerce</option>
                    <option value="Science">Science</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1">
                    Class
                  </label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-pill bg-slate-900 text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                    <option value="Dropper">Dropper</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">
                  Education Board
                </label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-pill bg-slate-900 text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400"
                >
                  <option value="CBSE">CBSE Board</option>
                  <option value="BSEB">Bihar Board (BSEB)</option>
                  <option value="ICSE">ICSE / ISC</option>
                  <option value="State Board">Other State Board</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Continue Privately &amp; Launch Garia OS</span>
            </button>
          </form>
        )}

        {activeTab === "signup" && (
          <form onSubmit={handleSignupSubmit} className="space-y-3">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  dir="ltr"
                  style={{ direction: "ltr", textAlign: "left" }}
                  placeholder="e.g. Alex Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400 text-left"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  dir="ltr"
                  style={{ direction: "ltr", textAlign: "left" }}
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400 text-left"
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
                  dir="ltr"
                  style={{ direction: "ltr", textAlign: "left" }}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400 text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">
                  Stream
                </label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value as StreamType)}
                  className="w-full px-3 py-2.5 rounded-xl glass-pill bg-slate-900 text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400"
                >
                  <option value="Commerce">Commerce</option>
                  <option value="Science">Science</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">
                  Class
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-pill bg-slate-900 text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400"
                >
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Dropper">Dropper</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account &amp; Start</span>
            </button>
          </form>
        )}

        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  dir="ltr"
                  style={{ direction: "ltr", textAlign: "left" }}
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400 text-left"
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
                  dir="ltr"
                  style={{ direction: "ltr", textAlign: "left" }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400 text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? "Signing In..." : "Log In to Account"}</span>
            </button>
          </form>
        )}

        {/* Feature Highlights Footer */}
        <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-2 text-[10px] text-slate-400 text-center">
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-900/50">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Multi-Subject Sync</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-900/50">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Abya AI Coach</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-900/50">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Browser Isolated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
