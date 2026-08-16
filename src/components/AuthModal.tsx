import React, { useState, useEffect } from "react";
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
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Database,
  Flame,
} from "lucide-react";
import { UserSettings } from "../types";
import { hashPassword } from "../utils/auth";
import { APP_VERSION } from "../constants/version";
import {
  auth,
  signInWithGoogle,
  signOutFromFirebase,
  uploadWorkspaceToCloud,
  downloadWorkspaceFromCloud,
} from "../utils/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  getWorkspaceSnapshot,
  restoreWorkspaceSnapshot,
  loadProfiles,
  loadActiveProfileId,
} from "../utils/storage";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (s: UserSettings) => void;
  onReloadData?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onReloadData,
}) => {
  const account = settings.account || {
    email: "private@gariaos.local",
    passwordHash: "",
    name: settings.userName || "Private Student",
    isPrivateMode: true,
    createdAt: Date.now(),
  };

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [mode, setMode] = useState<"view" | "login" | "signup">(
    account.isPrivateMode && !auth.currentUser ? "login" : "view"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(settings.userName || "");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (u) {
        setMode("view");
        // Update user settings userName if not set
        if (!settings.userName || settings.userName === "Student") {
          onUpdateSettings({
            ...settings,
            userName: u.displayName || settings.userName || "Student",
            account: {
              ...account,
              email: u.email || account.email,
              name: u.displayName || account.name,
              isPrivateMode: false,
            },
          });
        }
      }
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const cred = await signInWithGoogle();
      const u = cred.user;
      setFirebaseUser(u);
      const newAcc = {
        email: u.email || "student@google.com",
        passwordHash: "",
        name: u.displayName || name || "Google Student",
        isPrivateMode: false,
        createdAt: Date.now(),
      };
      onUpdateSettings({
        ...settings,
        userName: newAcc.name,
        account: newAcc,
      });
      setSuccessMessage("Signed in with Google Firebase Auth!");
      setMode("view");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setErrorMessage(err.message || "Failed to sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupToCloud = async () => {
    const u = auth.currentUser;
    if (!u) {
      setErrorMessage("Please sign in with Google Firebase to sync data.");
      return;
    }
    setIsSyncingCloud(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const snap = getWorkspaceSnapshot();
      const res = await uploadWorkspaceToCloud(u.uid, {
        activeProfileId: snap.activeProfileId,
        profiles: snap.profiles,
        fullStorageDump: snap.fullStorageDump,
      });
      setLastSyncedTime(new Date(res.timestamp).toLocaleTimeString());
      setSuccessMessage("Cloud sync complete! Your workspace is backed up to Firestore.");
    } catch (err: any) {
      console.error("Cloud backup error:", err);
      setErrorMessage("Cloud backup failed. Check your connection.");
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    const u = auth.currentUser;
    if (!u) {
      setErrorMessage("Please sign in with Google Firebase to restore data.");
      return;
    }
    setIsSyncingCloud(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const cloudData = await downloadWorkspaceFromCloud(u.uid);
      if (!cloudData || !cloudData.payloadJson) {
        setErrorMessage("No cloud backup found for this account in Firestore.");
        return;
      }
      const restored = restoreWorkspaceSnapshot({
        activeProfileId: cloudData.activeProfileId,
        profiles: cloudData.profiles,
        fullStorageDump: cloudData.payloadJson,
      });
      if (restored) {
        setSuccessMessage("Cloud restore successful! Workspace updated from Firestore.");
        if (onReloadData) onReloadData();
      } else {
        setErrorMessage("Could not parse cloud data.");
      }
    } catch (err: any) {
      console.error("Cloud restore error:", err);
      setErrorMessage("Failed to restore from cloud.");
    } finally {
      setIsSyncingCloud(false);
    }
  };

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
    setSuccessMessage("Private Mode Active — Local storage only.");
    onClose();
  };

  const handleLogout = async () => {
    try {
      await signOutFromFirebase();
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    setFirebaseUser(null);
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
        className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl relative space-y-5 bg-[#0b0f19] text-slate-100 max-h-[90vh] overflow-y-auto"
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-400 p-0.5 shadow-xl shadow-orange-500/20">
            <img
              src="/icon.svg"
              alt="Garia OS Logo"
              className="w-full h-full object-contain rounded-[14px]"
            />
          </div>
          <div>
            <h2 className="text-xl font-extrabold font-heading text-white tracking-tight flex items-center justify-center gap-2">
              Garia OS Account & Cloud
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" /> Firebase
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Google Firebase Auth & Firestore Multi-Device Sync
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
        {mode === "view" && (!account.isPrivateMode || firebaseUser) && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 flex items-center gap-3">
              {firebaseUser?.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl border border-emerald-400/40 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 font-bold font-heading">
                  {(firebaseUser?.displayName || account.name || "S").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-white text-sm font-heading truncate flex items-center gap-2">
                  {firebaseUser?.displayName || account.name}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    {firebaseUser ? "Firebase Sync" : "Local Account"}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {firebaseUser?.email || account.email}
                </p>
              </div>
            </div>

            {/* Cloud Sync Controller Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-orange-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold text-white">Firestore Cloud Sync</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {firebaseUser ? "Connected" : "Offline"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Synchronize all student profiles, tasks, notes, syllabus, and mock exams across all your devices securely via Firebase.
              </p>

              {lastSyncedTime && (
                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Last synced: {lastSyncedTime}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleBackupToCloud}
                  disabled={isSyncingCloud || !firebaseUser}
                  className="py-2 px-3 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  {isSyncingCloud ? "Syncing..." : "Backup to Cloud"}
                </button>
                <button
                  type="button"
                  onClick={handleRestoreFromCloud}
                  disabled={isSyncingCloud || !firebaseUser}
                  className="py-2 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  Restore Cloud
                </button>
              </div>
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

        {/* Login / Signup mode */}
        {(mode === "login" || mode === "signup" || (account.isPrivateMode && !firebaseUser)) && (
          <div className="space-y-4">
            {/* Google Firebase Auth Direct Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
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
                <span>Continue with Google & Firebase Cloud</span>
              </button>
              <div className="flex items-center gap-2 my-2 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <div className="flex-1 h-px bg-white/10" />
                <span>or local credentials</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </div>

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
                      dir="ltr"
                      style={{ direction: "ltr", textAlign: "left" }}
                      placeholder="e.g. Alex Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:border-emerald-400 text-left"
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
                Want to use Garia OS offline without an account?
              </p>
              <button
                type="button"
                onClick={handleContinuePrivately}
                className="w-full py-2.5 rounded-xl glass-pill text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Continue Privately (Offline Storage)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
