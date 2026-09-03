import { useState, useEffect, useCallback } from "react";
import {
  PWAInstallState,
  PWAInstallOutcome,
  subscribePWAInstall,
  promptPWAInstall,
  markInstallPromptDismissed,
  resetInstallDismissal,
  checkIsAppInstalled,
  detectDevicePlatform,
  isInstallPromptDismissed,
} from "./pwaInstall";

export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>(() => {
    const platform = detectDevicePlatform();
    const isInstalled = checkIsAppInstalled();
    return {
      isInstalled,
      canPromptNative: false,
      isDismissed: isInstallPromptDismissed(),
      platform,
      isAndroid: platform === "android",
      isIOS: platform === "ios",
    };
  });

  useEffect(() => {
    const unsubscribe = subscribePWAInstall((newState) => {
      setState(newState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const install = useCallback(async (): Promise<PWAInstallOutcome> => {
    const outcome = await promptPWAInstall();
    return outcome;
  }, []);

  const dismiss = useCallback(() => {
    markInstallPromptDismissed();
  }, []);

  const resetDismissal = useCallback(() => {
    resetInstallDismissal();
  }, []);

  return {
    ...state,
    install,
    dismiss,
    resetDismissal,
  };
}
