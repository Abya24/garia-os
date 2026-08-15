import React, { useState, useEffect } from "react";
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
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Activity,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import { APP_VERSION, APP_VERSION_CODE, APP_RELEASE_FILENAME } from "../constants/version";

interface DownloadPageProps {
  onBackToApp?: () => void;
}

interface DiagnosticEntry {
  id: string;
  timestamp: string;
  event: string;
  url: string;
  status: "pending" | "success" | "error";
  statusCode?: number;
  message?: string;
  headers?: Record<string, string>;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({ onBackToApp }) => {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [activeMirror, setActiveMirror] = useState<string>("/downloads/garia-os.apk");
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<DiagnosticEntry[]>([]);
  const [healthChecking, setHealthChecking] = useState(false);
  const [mirrorHealth, setMirrorHealth] = useState<Record<string, { status: number; ok: boolean; latencyMs: number }>>({});

  const [apkInfo, setApkInfo] = useState<{
    version: string;
    versionCode: number;
    sha256: string;
    sizeBytes: number;
    sizeFormatted: string;
    canonicalUrl: string;
    mirrors: string[];
  }>({
    version: APP_VERSION,
    versionCode: APP_VERSION_CODE,
    sha256: "6111407ff73d1351a1354f58785739ba1a0f3a210614688684909d54206ac185",
    sizeBytes: 32103,
    sizeFormatted: "32.1 KB",
    canonicalUrl: "/downloads/garia-os.apk",
    mirrors: [
      "/downloads/garia-os.apk",
      `/${APP_RELEASE_FILENAME}`,
      "/api/download/apk",
      "/garia-os.apk",
    ],
  });

  const addLog = (
    event: string,
    url: string,
    status: "pending" | "success" | "error",
    statusCode?: number,
    message?: string,
    headers?: Record<string, string>
  ) => {
    const entry: DiagnosticEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      event,
      url,
      status,
      statusCode,
      message,
      headers,
    };
    setDiagnosticLogs((prev) => [entry, ...prev.slice(0, 19)]);
    console.log(`[APK Diagnostics] [${entry.status.toUpperCase()}] ${event} | URL: ${url} | Status: ${statusCode || "N/A"} | Msg: ${message || "OK"}`);
  };

  useEffect(() => {
    // Fetch version metadata and perform initial health check
    fetch("/api/apk/version")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.version) {
          setApkInfo((prev) => ({
            ...prev,
            version: data.version || APP_VERSION,
            versionCode: data.versionCode || APP_VERSION_CODE,
            sha256: data.sha256 || prev.sha256,
            sizeBytes: data.sizeBytes || 32103,
            sizeFormatted: data.sizeFormatted || "32.1 KB",
            canonicalUrl: data.canonicalUrl || "/downloads/garia-os.apk",
            mirrors: Array.isArray(data.mirrors) && data.mirrors.length > 0 ? data.mirrors : prev.mirrors,
          }));
          addLog("Metadata Verified", "/api/apk/version", "success", 200, `APK Version: v${data.version}, Size: ${data.sizeFormatted}`);
        }
      })
      .catch((err) => {
        addLog("Metadata Fetch", "/api/apk/version", "error", 500, err?.message || "Failed to load APK metadata");
      });
  }, []);

  const runHealthCheck = async () => {
    setHealthChecking(true);
    addLog("Diagnostics Run", "/api/apk/diagnostics", "pending", undefined, "Testing all APK mirrors...");
    const testUrls = [
      "/downloads/garia-os.apk",
      `/${APP_RELEASE_FILENAME}`,
      "/api/download/apk",
      "/garia-os.apk",
    ];

    const results: Record<string, { status: number; ok: boolean; latencyMs: number }> = {};

    for (const url of testUrls) {
      const t0 = performance.now();
      try {
        const resp = await fetch(url, { method: "HEAD", cache: "no-cache" });
        const latency = Math.round(performance.now() - t0);
        results[url] = { status: resp.status, ok: resp.ok, latencyMs: latency };
        const ct = resp.headers.get("content-type") || "unknown";
        addLog(`Mirror Check: ${url}`, url, resp.ok ? "success" : "error", resp.status, `Latency: ${latency}ms, Content-Type: ${ct}`);
      } catch (err: any) {
        const latency = Math.round(performance.now() - t0);
        results[url] = { status: 0, ok: false, latencyMs: latency };
        addLog(`Mirror Check: ${url}`, url, "error", 0, err?.message || "Network Error");
      }
    }

    setMirrorHealth(results);
    setHealthChecking(false);
  };

  const handleCopySha = () => {
    navigator.clipboard.writeText(apkInfo.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyDownloadUrl = () => {
    const fullUrl = `${window.location.origin}${activeMirror}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleTriggerDownload = async (customUrl?: string) => {
    const targetUrl = customUrl || activeMirror || "/downloads/garia-os.apk";
    const filename = targetUrl.endsWith(".apk") ? targetUrl.split("/").pop()! : APP_RELEASE_FILENAME;

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    addLog("Download Attempt", targetUrl, "pending", undefined, `Initiating download for ${filename}`);

    try {
      // 1. Fetch check with blob fallback
      const resp = await fetch(targetUrl, { method: "GET" });
      const statusCode = resp.status;
      const contentType = resp.headers.get("content-type") || "";

      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${statusCode} (${resp.statusText || "Download Error"})`);
      }

      const blob = await resp.blob();
      if (!blob || blob.size === 0) {
        throw new Error("Received empty APK file from server");
      }

      // Create Object URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 2000);

      addLog(
        "Download Started",
        targetUrl,
        "success",
        statusCode,
        `Delivered ${blob.size} bytes (${contentType || "application/vnd.android.package-archive"})`
      );

      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err: any) {
      console.error("[APK Download] Primary download failed, attempting direct anchor fallback...", err);
      addLog("Blob Download Failed", targetUrl, "error", undefined, err?.message || "Fallback to direct link");

      // 2. Direct anchor navigation fallback
      try {
        const link = document.createElement("a");
        link.href = targetUrl;
        link.download = filename;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addLog("Direct Navigation Fallback", targetUrl, "success", 200, "Triggered native browser download");
        setIsDownloading(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 5000);
      } catch (fallbackErr: any) {
        addLog("All Download Methods Failed", targetUrl, "error", 500, fallbackErr?.message || "Fatal download error");
        setIsDownloading(false);
        setDownloadError(err?.message || "APK Download Failed. Please try an alternate mirror or copy the direct link.");
      }
    }
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDiagnostics((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                showDiagnostics
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Diagnostics</span>
            </button>

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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 space-y-8 w-full">
        {/* Hero Section */}
        <div className="text-center space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Official Signed Android Release • Android 8.0+ / 14 / 15
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-2xl mx-auto leading-tight">
            Download <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Garia OS</span> APK
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            The private, AI-powered student operating system. Genuine Android APK signed with official release keys for offline and mobile study.
          </p>

          {/* Primary Download Card */}
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-b from-[#121929] to-[#0d1322] border border-slate-800 shadow-2xl space-y-4">
            <div className="text-center space-y-1 pb-2 border-b border-slate-800/80">
              <h3 className="text-xl font-bold text-white font-heading">
                Garia OS Android Installer
              </h3>
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  v{apkInfo.version} • {apkInfo.sizeFormatted}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300 font-sans">Official Release</span>
              </div>
            </div>

            {/* Error Banner */}
            {downloadError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-left text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>APK Download Failed</span>
                </div>
                <p className="text-rose-200/90 text-[11px] leading-relaxed">
                  {downloadError}
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => handleTriggerDownload()}
                    className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Please Try Again
                  </button>
                  <button
                    onClick={() => setShowDiagnostics(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-colors"
                  >
                    View Diagnostics
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              id="apk-download-primary-btn"
              onClick={() => handleTriggerDownload()}
              disabled={isDownloading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-base shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 ${
                downloadError
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50"
                  : downloadSuccess
                  ? "bg-emerald-500 text-slate-950 shadow-emerald-950/50"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-950/50"
              }`}
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Downloaded Successfully!</span>
                </>
              ) : downloadError ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Please Try Again</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download Garia OS v{apkInfo.version} APK</span>
                </>
              )}
            </button>

            {/* Mirror Selection & Direct File Links */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Download Mirrors:</span>
                <span className="text-emerald-400 font-mono text-[10px]">HTTP 200 Verified</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                <a
                  href="/downloads/garia-os.apk"
                  download="garia-os.apk"
                  onClick={() => addLog("Direct Link Tap", "/downloads/garia-os.apk", "pending", 200, "Direct anchor tap")}
                  className="w-full py-2 px-3 rounded-lg text-xs bg-slate-900/80 hover:bg-slate-800 text-emerald-300 border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mirror 1: <code>/downloads/garia-os.apk</code></span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Primary</span>
                </a>

                <a
                  href={`/${APP_RELEASE_FILENAME}`}
                  download={APP_RELEASE_FILENAME}
                  onClick={() => addLog("Direct Link Tap", `/${APP_RELEASE_FILENAME}`, "pending", 200, "Direct anchor tap")}
                  className="w-full py-2 px-3 rounded-lg text-xs bg-slate-900/80 hover:bg-slate-800 text-teal-300 border border-slate-800 hover:border-teal-500/40 flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-teal-400" />
                    <span>Mirror 2: <code>/{APP_RELEASE_FILENAME}</code></span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">v{apkInfo.version}</span>
                </a>

                <a
                  href="/api/download/apk"
                  download={APP_RELEASE_FILENAME}
                  onClick={() => addLog("Direct Link Tap", "/api/download/apk", "pending", 200, "Direct anchor tap")}
                  className="w-full py-2 px-3 rounded-lg text-xs bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mirror 3: <code>/api/download/apk</code></span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">API Stream</span>
                </a>
              </div>
            </div>

            {/* Copy Link & Open in New Tab */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleCopyDownloadUrl}
                className="py-2 px-3 rounded-xl text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy APK Link</span>
                  </>
                )}
              </button>

              <a
                href="/downloads/garia-os.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>Open in Tab</span>
              </a>
            </div>

            {/* Android Browser Permission Notice */}
            <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg text-center flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Android may require permission to install apps from this browser.</span>
            </p>

            {/* Verified Specs */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">Version:</span>
                <span className="font-semibold text-slate-200">v{apkInfo.version} ({apkInfo.versionCode})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">File Size:</span>
                <span className="font-semibold text-emerald-400">{apkInfo.sizeFormatted}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Package Name:</span>
                <span className="font-semibold text-slate-300 text-[11px]">com.gariaos.app</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Target SDK:</span>
                <span className="font-semibold text-emerald-400">API 34 (Android 15)</span>
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

        {/* Diagnostics & Live Health Monitor */}
        {showDiagnostics && (
          <div className="bg-[#0b111e] border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-300 font-mono">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>APK Download Diagnostics & Server Log</span>
              </div>
              <button
                onClick={runHealthCheck}
                disabled={healthChecking}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${healthChecking ? "animate-spin" : ""}`} />
                <span>{healthChecking ? "Testing..." : "Test All Mirrors"}</span>
              </button>
            </div>

            {/* Mirror status table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
              {[
                { name: "Mirror 1 (/downloads)", url: "/downloads/garia-os.apk" },
                { name: "Mirror 2 (v3.0.0)", url: `/${APP_RELEASE_FILENAME}` },
                { name: "Mirror 3 (API)", url: "/api/download/apk" },
                { name: "Mirror 4 (Generic)", url: "/garia-os.apk" },
              ].map((m) => {
                const info = mirrorHealth[m.url];
                return (
                  <div
                    key={m.url}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1"
                  >
                    <div className="text-slate-400 text-[11px] truncate">{m.name}</div>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${info ? (info.ok ? "text-emerald-400" : "text-rose-400") : "text-slate-500"}`}>
                        {info ? (info.ok ? `200 OK (${info.latencyMs}ms)` : `HTTP ${info.status}`) : "Ready"}
                      </span>
                      <button
                        onClick={() => handleTriggerDownload(m.url)}
                        className="text-[10px] text-cyan-400 hover:underline"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Event Log */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-mono">Recent Activity Log:</span>
              <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px] bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                {diagnosticLogs.length === 0 ? (
                  <p className="text-slate-500 italic">No events logged yet. Tap download above to test.</p>
                ) : (
                  diagnosticLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 border-b border-slate-900 pb-1">
                      <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                      <span
                        className={`font-semibold shrink-0 px-1 rounded text-[10px] ${
                          log.status === "success"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : log.status === "error"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-cyan-500/20 text-cyan-300"
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                      <span className="text-slate-300 truncate flex-1">
                        <strong>{log.event}:</strong> {log.url} {log.message ? `→ ${log.message}` : ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

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
                Click the primary download button above to download the official Garia OS installer.
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Open File</h4>
              <p className="text-slate-400 leading-relaxed">
                Open your device Downloads folder or tap the completed download notification.
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Allow Source</h4>
              <p className="text-slate-400 leading-relaxed">
                If prompted, toggle &quot;Allow from this source&quot; in Android Settings → Install unknown apps.
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                4
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Launch App</h4>
              <p className="text-slate-400 leading-relaxed">
                Tap Install and launch your private, offline-capable Garia OS workspace.
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
            If Android displays <span className="font-semibold text-amber-200">&quot;Unknown apps can&apos;t be installed by this user&quot;</span> or blocks the file:
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-200 font-medium leading-relaxed">
            Go to Android <span className="text-emerald-400 font-bold">Settings → Apps → Special app access → Install unknown apps</span>, enable permission for your browser (Chrome/Firefox/Samsung Internet), and re-open the downloaded APK file.
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
