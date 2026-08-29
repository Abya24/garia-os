import React, { useState } from "react";
import {
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
  Sparkles,
} from "lucide-react";
import { StreamType } from "../types";
import { GariaLogo } from "./GariaLogo";
import { APP_VERSION } from "../constants/version";
import { signInWithGoogle } from "../utils/firebase";
import { capitalizeWords } from "../utils/studentNameUtils";

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
  onContinuePrivately?: (data: {
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
  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup");

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

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const cred = await signInWithGoogle();
      const u = cred.user;
      onCreateAccount({
        name: u.displayName || name || "Student",
        email: u.email || `${u.uid}@gmail.com`,
        pass: "google_oauth_auth",
        stream,
        classLevel,
        board,
      });
    } catch (err: any) {
      console.error("Google login error:", err);
      setErrorMessage(err.message || "Failed to sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

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
      setErrorMessage("No matching account found on this device. Please verify your credentials or create a new student account.");
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg glass-card rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl relative z-10 bg-[#0c101c]/90 backdrop-blur-xl space-y-6">
        {/* Official Garia OS Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <GariaLogo size="xl" variant="full" showTagline={true} withGlow={true} />
          <div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                Production Release v{APP_VERSION}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1.5 max-w-sm">
              Smart Student Productivity, Focus &amp; Exam Intelligence OS
            </p>
          </div>
        </div>

        {/* Quick Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          id="welcome-google-signin-btn"
          className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-98 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#0c101c] px-3 text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider absolute">
            Or with email
          </span>
        </div>

        {/* Option Selector Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900/80 border border-white/10 text-xs gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("signup");
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "signup"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>Create Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "login"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
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
                  placeholder="e.g. Alex Sharma"
                  value={name}
                  onChange={(e) => {
                    const formatted = capitalizeWords(e.target.value);
                    setName(formatted);
                  }}
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
