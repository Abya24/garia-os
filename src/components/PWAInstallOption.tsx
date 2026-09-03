import React, { useState } from "react";
import {
  Download,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import { usePWAInstall } from "../utils/usePWAInstall";
import { PWAInstallModal } from "./PWAInstallModal";
import { AppLanguage } from "../utils/i18n";

export interface PWAInstallOptionProps {
  variant?: "card" | "menu-item" | "badge" | "compact-button";
  currentLanguage?: AppLanguage;
  className?: string;
  onInstallSuccess?: () => void;
}

export const PWAInstallOption: React.FC<PWAInstallOptionProps> = ({
  variant = "card",
  currentLanguage = "en",
  className = "",
  onInstallSuccess,
}) => {
  const {
    isInstalled,
    canPromptNative,
    platform,
    install,
    isDismissed,
  } = usePWAInstall();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [installStatusMsg, setInstallStatusMsg] = useState<string | null>(null);

  const handleAction = async () => {
    // If already installed, open guide/details dialog confirming it
    if (isInstalled) {
      setIsModalOpen(true);
      return;
    }

    // If native prompt is available, trigger it directly
    if (canPromptNative) {
      const outcome = await install();
      if (outcome === "accepted") {
        setInstallStatusMsg(
          currentLanguage === "hi"
            ? "गारिया ओएस सफलतापूर्वक इंस्टॉल हो गया!"
            : "Garia OS successfully installed!"
        );
        setTimeout(() => setInstallStatusMsg(null), 4000);
        if (onInstallSuccess) onInstallSuccess();
      } else if (outcome === "dismissed") {
        setInstallStatusMsg(
          currentLanguage === "hi"
            ? "इंस्टॉलेशन रद्द किया गया"
            : "Installation dismissed"
        );
        setTimeout(() => setInstallStatusMsg(null), 3000);
      } else {
        // Unsupported or error, open instruction guide
        setIsModalOpen(true);
      }
    } else {
      // Browser doesn't support direct prompt, show instruction modal
      setIsModalOpen(true);
    }
  };

  // 1. MENU ITEM VARIANT (for MoreDrawer, SliderMenu, etc.)
  if (variant === "menu-item") {
    return (
      <>
        <button
          type="button"
          onClick={handleAction}
          id="pwa-install-menu-item"
          aria-label={
            isInstalled
              ? "Garia OS is already installed. View details."
              : "Install Garia OS"
          }
          className={`w-full min-h-[44px] p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 group ${
            isInstalled
              ? "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-slate-800/80 hover:bg-slate-800 border-white/10 hover:border-emerald-500/40 text-slate-200"
          } ${className}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isInstalled
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 group-hover:scale-105 transition-transform"
              }`}
            >
              {isInstalled ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold font-heading text-white truncate flex items-center gap-1.5">
                <span>
                  {isInstalled
                    ? (currentLanguage === "hi" ? "गारिया ओएस इंस्टॉल है" : "Garia OS is already installed")
                    : (currentLanguage === "hi" ? "गारिया ओएस इंस्टॉल करें" : "Install Garia OS")}
                </span>
                {isInstalled && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    {currentLanguage === "hi" ? "सक्रिय" : "Active"}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {isInstalled
                  ? (currentLanguage === "hi" ? "स्टैंडअलोन मोड सक्रिय है" : "Running as standalone app")
                  : (currentLanguage === "hi" ? "होम स्क्रीन और ऑफ़लाइन एक्सेस" : "Add to home screen & offline access")}
              </p>
            </div>
          </div>

          <ChevronRight
            className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
              isInstalled ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
            }`}
          />
        </button>

        <PWAInstallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          platform={platform}
          isInstalled={isInstalled}
          canPromptNative={canPromptNative}
          onNativeInstall={handleAction}
          currentLanguage={currentLanguage}
        />
      </>
    );
  }

  // 2. COMPACT BUTTON / BADGE VARIANT (for HeroSection top bar)
  if (variant === "compact-button" || variant === "badge") {
    return (
      <>
        <button
          type="button"
          onClick={handleAction}
          id="hero-pwa-install-btn"
          aria-label={
            isInstalled
              ? "Garia OS is already installed"
              : "Install Garia OS"
          }
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all active:scale-95 shadow-sm ${
            isInstalled
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
              : "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border-emerald-500/40 text-emerald-300 hover:text-white"
          } ${className}`}
        >
          {isInstalled ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">
                {currentLanguage === "hi" ? "गारिया ओएस इंस्टॉल है" : "Garia OS is already installed"}
              </span>
              <span className="sm:hidden">
                {currentLanguage === "hi" ? "इंस्टॉल है" : "Installed"}
              </span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <span>
                {currentLanguage === "hi" ? "गारिया ओएस इंस्टॉल करें" : "Install Garia OS"}
              </span>
            </>
          )}
        </button>

        <PWAInstallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          platform={platform}
          isInstalled={isInstalled}
          canPromptNative={canPromptNative}
          onNativeInstall={handleAction}
          currentLanguage={currentLanguage}
        />
      </>
    );
  }

  // 3. CARD VARIANT (for SettingsPage)
  return (
    <>
      <div
        id="pwa-install-settings-card"
        className={`glass-card p-5 sm:p-6 rounded-3xl border transition-all relative overflow-hidden ${
          isInstalled
            ? "border-emerald-500/30 bg-slate-900/80"
            : "border-white/10 hover:border-emerald-500/30 bg-slate-900/90"
        } ${className}`}
      >
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isInstalled
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
              }`}
            >
              {isInstalled ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <Smartphone className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                  {isInstalled
                    ? (currentLanguage === "hi" ? "गारिया ओएस इंस्टॉल है" : "Garia OS is already installed")
                    : (currentLanguage === "hi" ? "गारिया ओएस इंस्टॉल करें" : "Install Garia OS")}
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border font-mono ${
                    isInstalled
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  }`}
                >
                  {isInstalled
                    ? (currentLanguage === "hi" ? "इंस्टॉल्ड" : "Installed")
                    : (currentLanguage === "hi" ? "PWA उपलब्ध" : "PWA Available")}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                {isInstalled
                  ? (currentLanguage === "hi"
                    ? "गारिया ओएस आपके डिवाइस पर स्टैंडअलोन एप्लिकेशन के रूप में सक्रिय है। पूर्ण ऑफ़लाइन डेटा और बैकअप सुरक्षित हैं।"
                    : "Garia OS is already installed as a standalone progressive web application with full offline local storage and background cloud sync.")
                  : (currentLanguage === "hi"
                    ? "अपने होम स्क्रीन या डेस्कटॉप पर जोड़ें ताकि 1-टैप में सीधे बिना ब्राउज़र टूलबार के ऐप खुले और ऑफ़लाइन काम करे।"
                    : "Install Garia OS on your Android device, iPhone, or computer for fast 1-tap launching, full-screen study environment, and seamless offline access.")}
              </p>
            </div>
          </div>

          {/* Action button with minimum 44px touch target */}
          <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={handleAction}
              id="pwa-install-action-btn"
              aria-label={
                isInstalled
                  ? "View Garia OS installation details"
                  : "Install Garia OS"
              }
              className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm ${
                isInstalled
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20"
              }`}
            >
              {isInstalled ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{currentLanguage === "hi" ? "स्थिति देखें" : "Garia OS is already installed"}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{currentLanguage === "hi" ? "गारिया ओएस इंस्टॉल करें" : "Install Garia OS"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {installStatusMsg && (
          <div className="mt-3 text-xs text-emerald-400 font-mono">
            {installStatusMsg}
          </div>
        )}
      </div>

      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        platform={platform}
        isInstalled={isInstalled}
        canPromptNative={canPromptNative}
        onNativeInstall={handleAction}
        currentLanguage={currentLanguage}
      />
    </>
  );
};
