import React, { useState } from "react";
import {
  Download,
  ShieldCheck,
  Smartphone,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Lock,
  Cpu,
  BarChart3,
  BookOpen,
  Zap,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { APP_VERSION, APP_VERSION_CODE, APP_RELEASE_FILENAME } from "../constants/version";

interface DownloadPageProps {
  onBackToApp?: () => void;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({ onBackToApp }) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [apkInfo, setApkInfo] = useState<{
    version: string;
    versionCode: number;
    sha256: string;
    sizeBytes: number;
  }>({
    version: APP_VERSION,
    versionCode: APP_VERSION_CODE,
    sha256: "435e6833b5061f053244752f3d5958a288ecc014e825a688fc99fb89860a3b6f",
    sizeBytes: 22506
  });

  React.useEffect(() => {
    fetch("/api/apk/version")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.sha256) {
          setApkInfo({
            version: data.version || APP_VERSION,
            versionCode: data.versionCode || APP_VERSION_CODE,
            sha256: data.sha256,
            sizeBytes: data.sizeBytes || 22506
          });
        }
      })
      .catch((err) => console.warn("Failed to fetch APK version metadata:", err));
  }, []);

  const handleCopySha = () => {
    navigator.clipboard.writeText(apkInfo.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerDownload = () => {
    setIsDownloading(true);
    const link = document.createElement("a");
    link.href = `/${APP_RELEASE_FILENAME}`;
    link.download = APP_RELEASE_FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 1000);
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
                Official Android Release APK (v{apkInfo.version})
              </p>
            </div>
          </div>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Open Web App
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
            Official Signed Android Release • Android 8.0+ / 14 / 15
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-2xl mx-auto leading-tight">
            Download <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Garia OS</span> APK
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            The ultimate AI-powered student operating system. Genuine Android APK compiled with official Android SDK toolchain.
          </p>

          {/* Redesigned Download CTA Card */}
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-b from-[#121929] to-[#0d1322] border border-slate-800 shadow-2xl space-y-4">
            <div className="text-center space-y-1 pb-2 border-b border-slate-800/80">
              <h3 className="text-xl font-bold text-white font-heading">
                Garia OS Android APK
              </h3>
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  v{apkInfo.version} • Code {apkInfo.versionCode}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300 font-sans">Official signed Android release</span>
              </div>
            </div>

            <button
              onClick={handleTriggerDownload}
              disabled={isDownloading}
              className="w-full py-4 px-6 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-75"
            >
              <Download className="w-5 h-5" />
              <span>{isDownloading ? "Downloading APK..." : downloadSuccess ? "Downloaded Successfully!" : `Download Garia OS v${apkInfo.version} APK`}</span>
            </button>

            {/* Direct Link */}
            <a
              href={`/${APP_RELEASE_FILENAME}`}
              download={APP_RELEASE_FILENAME}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Garia OS v{apkInfo.version} APK (Direct File)</span>
            </a>

            <button
              onClick={() => {
                if (onBackToApp) {
                  onBackToApp();
                } else {
                  window.location.href = "/";
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 flex items-center justify-center gap-2 transition-all"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Open Web App / Install PWA</span>
            </button>

            <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg text-center flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Android may require permission to install apps from this browser.</span>
            </p>

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left text-xs text-emerald-200/90 space-y-1">
              <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>APK Release Verified</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Official Android Release APK (<code className="text-emerald-400">com.gariaos.app</code> v{apkInfo.version}, Code {apkInfo.versionCode}). Target SDK 34, Android 14/15 ready, compiled with D8 & aapt, v1+v2+v3 apksigner signed.
              </p>
            </div>

            {/* Release Meta */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-500 block">Version:</span>
                <span className="font-semibold text-slate-200">v{apkInfo.version} (Code {apkInfo.versionCode})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status:</span>
                <span className="font-semibold text-emerald-400">SDK Verified</span>
              </div>
              <div>
                <span className="text-slate-500 block">Package ID:</span>
                <span className="font-semibold text-emerald-400 font-mono text-[11px]">com.gariaos.app</span>
              </div>
              <div>
                <span className="text-slate-500 block">Target SDK:</span>
                <span className="font-semibold text-slate-200">API 34 (Android 14/15)</span>
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
                {apkInfo.sha256}
              </p>
            </div>
          </div>
        </div>

        {/* Can't install the APK? Help Section */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-amber-300">
            <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Can&apos;t install the APK?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            If Android displays <span className="font-semibold text-amber-200">&quot;Unknown apps can&apos;t be installed by this user&quot;</span> or blocks the installation:
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-200 font-medium leading-relaxed">
            On Android, allow this browser to install apps from this source in <span className="text-emerald-400 font-bold">Settings → Install unknown apps</span>, then retry opening the downloaded APK file.
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
          Package Name: <span className="font-mono text-slate-400">com.gariaos.app</span> • Version {apkInfo.version} (Code {apkInfo.versionCode})
        </p>
      </footer>
    </div>
  );
};
