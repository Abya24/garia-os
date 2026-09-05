/**
 * Production-Ready PWA Installation Management for Garia OS V3.1
 * Handles beforeinstallprompt capture, standalone/installed state detection,
 * graceful fallbacks for Android/iOS, and dismissal memory without unsafe any types.
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type PWAInstallOutcome = "accepted" | "dismissed" | "unsupported";
export type SupportedPlatform = "android" | "ios" | "desktop" | "other";

export interface PWAInstallState {
  isInstalled: boolean;
  canPromptNative: boolean;
  isDismissed: boolean;
  platform: SupportedPlatform;
  isAndroid: boolean;
  isIOS: boolean;
}

const LEGACY_STORAGE_KEY_INSTALLED = "garia_pwa_installed_state";
const STORAGE_KEY_DISMISSED = "garia_pwa_dismissed";

// Clear any legacy or false persistent installed state immediately on load
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY_INSTALLED);
  } catch {
    // Ignore storage restrictions
  }
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

/**
 * Detect device platform for tailored installation instructions
 */
export function detectDevicePlatform(): SupportedPlatform {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "other";
  }

  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) {
    return "android";
  }
  if (/iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  if (/windows|macintosh|linux/.test(ua) && !/mobile/.test(ua)) {
    return "desktop";
  }
  return "other";
}

/**
 * Authoritative detection of whether Garia OS is actively running as an installed PWA.
 *
 * CRITICAL REQUIREMENTS:
 * 1. Must NOT consider the app installed merely because a persistent localStorage token exists.
 * 2. Normal Chrome/Safari browser tabs with the address bar visible must NEVER report installed.
 * 3. Authoritative installed state relies strictly on:
 *    - window.matchMedia('(display-mode: standalone)').matches (Chromium, Edge, Desktop, Android WebAPK)
 *    - navigator.standalone === true (iOS Safari standalone)
 *    - document.referrer starting with android-app:// (Android TWA / WebAPK)
 */
export function checkIsAppInstalled(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Authoritative check: display-mode: standalone (Chromium, Edge, Desktop, Android WebAPK)
  try {
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
      return true;
    }
  } catch {
    // Ignore matchMedia evaluation error
  }

  // 2. Authoritative check: iOS Safari standalone property (launched from iOS Home Screen)
  try {
    const nav = window.navigator as NavigatorWithStandalone;
    if (nav && nav.standalone === true) {
      return true;
    }
  } catch {
    // Ignore
  }

  // 3. Check Android trusted app / TWA launcher referrer
  try {
    if (typeof document !== "undefined" && document.referrer && document.referrer.startsWith("android-app://")) {
      return true;
    }
  } catch {
    // Ignore
  }

  // Running inside a normal browser tab with address bar visible -> NOT installed
  return false;
}

/**
 * Check if the user previously dismissed an install prompt
 */
export function isInstallPromptDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY_DISMISSED) === "true";
  } catch {
    return false;
  }
}

/**
 * Remember user dismissal
 */
export function markInstallPromptDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
    notifySubscribers();
  } catch {
    // Ignore storage quota error
  }
}

/**
 * Reset dismissal state
 */
export function resetInstallDismissal(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DISMISSED);
    notifySubscribers();
  } catch {
    // Ignore
  }
}

// Global In-Memory Singleton State
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<(state: PWAInstallState) => void>();

function getCurrentState(): PWAInstallState {
  const platform = detectDevicePlatform();
  const isInstalled = checkIsAppInstalled();
  return {
    isInstalled,
    canPromptNative: Boolean(globalDeferredPrompt) && !isInstalled,
    isDismissed: isInstallPromptDismissed(),
    platform,
    isAndroid: platform === "android",
    isIOS: platform === "ios",
  };
}

function notifySubscribers(): void {
  const state = getCurrentState();
  subscribers.forEach((cb) => {
    try {
      cb(state);
    } catch (e) {
      console.warn("PWA subscriber notification error:", e);
    }
  });
}

/**
 * Initialize global event listeners once
 */
let isInitialized = false;

export function initPWAInstallListener(): void {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  // 1. Capture beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifySubscribers();
  });

  // 2. Capture appinstalled event
  window.addEventListener("appinstalled", () => {
    globalDeferredPrompt = null;
    try {
      localStorage.removeItem(STORAGE_KEY_DISMISSED);
    } catch {
      // Ignore
    }
    notifySubscribers();

    // Dispatch global custom event for any interested UI components (e.g. status notification)
    window.dispatchEvent(new CustomEvent("garia-pwa-installed-success"));
  });

  // 3. Monitor display-mode changes (e.g. opened in or moved to standalone window)
  try {
    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    standaloneMedia.addEventListener("change", () => {
      notifySubscribers();
    });
  } catch {
    // Media query listener not supported
  }
}

// Auto-initialize in browser environment
if (typeof window !== "undefined") {
  initPWAInstallListener();
}

/**
 * Trigger the native PWA install prompt if available
 */
export async function promptPWAInstall(): Promise<PWAInstallOutcome> {
  if (!globalDeferredPrompt) {
    return "unsupported";
  }

  const promptEvent = globalDeferredPrompt;
  try {
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      globalDeferredPrompt = null;
      // Do NOT set isInstalled = true immediately: the user is still inside the normal browser tab!
      // Opening the app from the home screen / launcher will properly trigger standalone mode.
      try {
        localStorage.removeItem(STORAGE_KEY_DISMISSED);
      } catch {
        // Ignore
      }
      notifySubscribers();
      return "accepted";
    } else {
      markInstallPromptDismissed();
      return "dismissed";
    }
  } catch (err) {
    console.warn("PWA prompt execution error:", err);
    return "unsupported";
  }
}

/**
 * Subscribe to PWA installation state changes
 */
export function subscribePWAInstall(callback: (state: PWAInstallState) => void): () => void {
  subscribers.add(callback);
  // Send initial state immediately
  callback(getCurrentState());
  return () => {
    subscribers.delete(callback);
  };
}
