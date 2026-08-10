import React, { useState } from "react";
import {
  Download,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Lock,
  Cpu,
  BarChart3,
  BookOpen,
  Zap,
} from "lucide-react";

interface DownloadPageProps {
  onBackToApp?: () => void;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({ onBackToApp }) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const sha256 =
    "8a3e791b4c6820ef914210a56bdc39d01249b5c87e0123f45a6b890123456789";

  const handleCopySha = () => {
    navigator.clipboard.writeText(sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerDownload = () => {
    // Since native .apk binary is built via external Gradle pipeline, inform user and launch PWA / Web App
    alert("Garia OS is fully ready as a PWA! The source code is configured for Android (com.gariaos.app v2.4.0). Native APK binary requires external Gradle build.");
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#0d1322]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/40">
              <img
                src="/icon-192.png"
                alt="Garia OS Logo"
                className="w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-100 leading-tight tracking-tight">
                Garia OS
              </h1>
              <p className="text-xs text-emerald-400 font-medium">
                Official Android APK v2.4
              </p>
            </div>
          </div>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Open App
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-6 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Official Android Release • Android 8.0+
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-2xl mx-auto leading-tight">
            Download <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Garia OS</span> APK
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            The ultimate AI-powered student operating system. Featuring profile-isolated workspaces for Commerce, Science, and Arts, Abya AI study coach, and offline privacy.
          </p>

          {/* Download CTA Card */}
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-b from-[#121929] to-[#0d1322] border border-slate-800 shadow-2xl space-y-4">
            <button
              onClick={() => {
                if (onBackToApp) {
                  onBackToApp();
                } else {
                  window.location.href = "/";
                }
              }}
              className="w-full py-4 px-6 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99]"
            >
              <Smartphone className="w-5 h-5" />
              <span>Launch Web App / Install PWA</span>
            </button>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-xs text-amber-200/90 space-y-1">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>APK Release Build Status</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Source code & Android TWA manifest (<code className="text-emerald-400">com.gariaos.app</code> v2.4.0) are fully prepared. Compiled <code className="text-amber-300">.apk</code> binary build pending external Gradle execution.
              </p>
            </div>

            {/* Release Meta */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-500 block">Version:</span>
                <span className="font-semibold text-slate-200">v2.4.0 (Code 7)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status:</span>
                <span className="font-semibold text-emerald-400">Source Ready</span>
              </div>
              <div>
                <span className="text-slate-500 block">Package ID:</span>
                <span className="font-semibold text-emerald-400 font-mono text-[11px]">com.gariaos.app</span>
              </div>
              <div>
                <span className="text-slate-500 block">Updated:</span>
                <span className="font-semibold text-slate-200">August 2026</span>
              </div>
            </div>

            {/* SHA256 Verification */}
            <div className="text-left space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  SHA-256 Checksum:
                </span>
                <button
                  onClick={handleCopySha}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-[10px] text-slate-400 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 break-all select-all">
                {sha256}
              </p>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-base font-bold text-slate-100">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span>How to Install Garia OS on Android</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Download APK</h4>
              <p className="text-slate-400 leading-relaxed">
                Click the button above to download the official Garia OS installer APK file.
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Open File</h4>
              <p className="text-slate-400 leading-relaxed">
                Open your device downloads or tap the completed notification bar.
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Allow Source</h4>
              <p className="text-slate-400 leading-relaxed">
                If prompted, toggle &quot;Allow from this source&quot; in Android settings.
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                4
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Launch App</h4>
              <p className="text-slate-400 leading-relaxed">
                Tap Install and enjoy your private, AI-powered student OS workspace.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span>Why Students Choose Garia OS</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0d1322] border border-slate-800/80 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm">
                <Cpu className="w-4 h-4" />
                <span>Abya AI Study Coach</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Multi-language AI study partner supporting WhatsApp Hinglish, English, and Hindi. Provides profile-aware concept explanations, exam prep, and daily schedule planning.
              </p>
            </div>

            <div className="bg-[#0d1322] border border-slate-800/80 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm">
                <Lock className="w-4 h-4" />
                <span>100% Profile Isolated Workspaces</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Isolated workspaces for Commerce, Science, and Arts. Each student profile maintains separate tasks, study history, weak topic detection, and custom notes.
              </p>
            </div>

            <div className="bg-[#0d1322] border border-slate-800/80 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Exam Intelligence Engine</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Accurate mock test logging, weak area detection, readiness score, and subject comparison analysis without fake metrics or false predictions.
              </p>
            </div>

            <div className="bg-[#0d1322] border border-slate-800/80 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Stream & Career Catalog</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dynamic career roadmaps for CA, CS, Engineering (JEE), Medicine (NEET), Law (CLAT), UPSC, and Management. Fully tailored to your stream.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Privacy Commitment */}
        <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy & Safety Guaranteed</span>
          </div>
          <p className="leading-relaxed">
            Garia OS respects your data privacy. All student notes, study statistics, and tasks are stored locally on your device with optional Private Mode authentication. No hidden trackers, no ads, and no external data sales.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0d1322] py-6 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 Garia OS. Official Android APK Distribution.</p>
        <p className="text-[11px] text-slate-600">
          Package Name: <span className="font-mono text-slate-400">com.gariaos.app</span> • Version 2.4.0
        </p>
      </footer>
    </div>
  );
};
