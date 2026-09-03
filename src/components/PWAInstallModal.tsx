import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Share,
  MoreVertical,
  Laptop,
  Check,
  Sparkles,
} from "lucide-react";
import { SupportedPlatform } from "../utils/pwaInstall";
import { AppLanguage } from "../utils/i18n";

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: SupportedPlatform;
  isInstalled: boolean;
  canPromptNative: boolean;
  onNativeInstall?: () => void;
  currentLanguage?: AppLanguage;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  platform,
  isInstalled,
  canPromptNative,
  onNativeInstall,
  currentLanguage = "en",
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 relative overflow-hidden"
        >
          {/* Subtle glowing ambient accent */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close button with minimum 44px touch target */}
          <button
            onClick={onClose}
            aria-label="Close installation guide"
            className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 pr-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isInstalled
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
            }`}>
              {isInstalled ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <Smartphone className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 id="pwa-install-title" className="text-lg font-bold font-heading text-white">
                {isInstalled
                  ? (currentLanguage === "hi" ? "गारिया ओएस इंस्टॉल हो चुका है" : "Garia OS is already installed")
                  : (currentLanguage === "hi" ? "गारिया ओएस इंस्टॉल करें" : "Install Garia OS")}
              </h2>
              <p className="text-xs text-slate-400">
                {isInstalled
                  ? (currentLanguage === "hi" ? "स्टैंडअलोन मोड सक्रिय है" : "Running as standalone progressive web app")
                  : (currentLanguage === "hi" ? "1-टैप लॉन्च और पूर्ण ऑफ़लाइन एक्सेस" : "1-tap launch, full screen & offline access")}
              </p>
            </div>
          </div>

          {/* Content Body */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-300 font-semibold text-sm">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>
                  {currentLanguage === "hi"
                    ? "गारिया ओएस पहले से आपके डिवाइस पर इंस्टॉल है।"
                    : "Garia OS is already installed"}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentLanguage === "hi"
                  ? "आपका ऐप होम स्क्रीन से सीधे बिना इंटरनेट के भी सभी अध्ययन डेटा, कार्यों और नोट्स के साथ तुरंत खुल सकता है।"
                  : "The application is functioning as an installed PWA. All local study sessions, isolated profile data, and offline queue synchronization remain active."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Native Prompt Available Action */}
              {canPromptNative && onNativeInstall ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentLanguage === "hi"
                      ? "आपके ब्राउज़र में डायरेक्ट इंस्टॉलेशन उपलब्ध है। नीचे दिए गए बटन पर क्लिक करें।"
                      : "Native installation is supported in this browser. Click below to add Garia OS to your home screen or desktop."}
                  </p>
                  <button
                    onClick={() => {
                      onNativeInstall();
                      onClose();
                    }}
                    className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>{currentLanguage === "hi" ? "गारिया ओएस इंस्टॉल करें" : "Install Garia OS"}</span>
                  </button>
                </div>
              ) : null}

              {/* Step-by-Step Platform Fallback Instructions */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  {platform === "android" && <Smartphone className="w-3.5 h-3.5 text-emerald-400" />}
                  {platform === "ios" && <Share className="w-3.5 h-3.5 text-blue-400" />}
                  {platform === "desktop" && <Laptop className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>
                    {platform === "android"
                      ? (currentLanguage === "hi" ? "एंड्रॉइड क्रोम निर्देश" : "Android Chrome Instructions")
                      : platform === "ios"
                      ? (currentLanguage === "hi" ? "आईओएस सफारी निर्देश" : "iOS Safari Instructions")
                      : (currentLanguage === "hi" ? "ब्राउज़र निर्देश" : "Browser Instructions")}
                  </span>
                </div>

                {platform === "android" ? (
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                        1
                      </div>
                      <p className="leading-relaxed">
                        {currentLanguage === "hi" ? (
                          <>ब्राउज़र के ऊपरी दाएं कोने में <strong>तीन बिंदुओं (⋮)</strong> वाले मेनू पर टैप करें।</>
                        ) : (
                          <>Tap the browser menu <strong className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-700/80 text-white font-mono"><MoreVertical className="w-3 h-3 inline" /> Menu</strong> in the top right corner.</>
                        )}
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                        2
                      </div>
                      <p className="leading-relaxed font-semibold text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                        {currentLanguage === "hi"
                          ? "मेनू खोलें और “Install app” या “Add to Home screen” चुनें।"
                          : "Open the browser menu and select Install app or Add to Home screen."}
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                        3
                      </div>
                      <p className="leading-relaxed">
                        {currentLanguage === "hi"
                          ? "पुष्टि करने के लिए “Install” पर टैप करें। गारिया ओएस आपके ऐप ड्रॉवर में जुड़ जाएगा।"
                          : "Tap “Install” to confirm. Garia OS will be added to your home screen with its official icon."}
                      </p>
                    </div>
                  </div>
                ) : platform === "ios" ? (
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                        1
                      </div>
                      <p className="leading-relaxed">
                        {currentLanguage === "hi" ? (
                          <>सफारी के निचले टूलबार में <strong>शेयर बटन (⎋)</strong> पर टैप करें।</>
                        ) : (
                          <>Tap the <strong className="text-white">Share button</strong> at the bottom of Safari.</>
                        )}
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                        2
                      </div>
                      <p className="leading-relaxed font-semibold text-blue-300 bg-blue-950/40 p-2.5 rounded-xl border border-blue-500/30">
                        {currentLanguage === "hi"
                          ? "नीचे स्क्रॉल करें और “Add to Home Screen” चुनें।"
                          : "Scroll down and select “Add to Home Screen”."}
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                        3
                      </div>
                      <p className="leading-relaxed">
                        {currentLanguage === "hi"
                          ? "ऊपरी दाएं कोने में “Add” पर टैप करें।"
                          : "Tap “Add” in the top right corner to finish."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <p className="leading-relaxed">
                      {currentLanguage === "hi"
                        ? "अपने ब्राउज़र के एड्रेस बार में इंस्टॉलेशन आइकन पर क्लिक करें, या ब्राउज़र मेनू से “Install Garia OS” चुनें।"
                        : "Click the Install icon in your browser's address bar, or open the browser menu (⋮) and select “Install Garia OS”."}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {currentLanguage === "hi"
                        ? "समर्थित ब्राउज़र: Google Chrome, Microsoft Edge, Brave, और Chromium-आधारित ब्राउज़र।"
                        : "Supported on Google Chrome, Microsoft Edge, Brave, and other Chromium browsers."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-end border-t border-white/10">
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[88px] px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors flex items-center justify-center"
            >
              {currentLanguage === "hi" ? "समझ गया" : "Got it"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
