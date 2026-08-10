import { UserSettings } from "../types";

export const isNotificationSupported = (): boolean => {
  return typeof window !== "undefined" && "Notification" in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (e) {
    console.error("Error requesting notification permission:", e);
    return false;
  }
};

export const sendNotification = (
  title: string,
  options?: { body?: string; icon?: string; tag?: string },
  settings?: UserSettings,
  category?: keyof UserSettings["notifications"]
): boolean => {
  if (settings) {
    if (settings.notifications?.master === false) return false;
    if (category && settings.notifications && settings.notifications[category] === false) {
      return false;
    }
  }

  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    });
    return true;
  } catch (e) {
    console.error("Failed to trigger notification:", e);
    return false;
  }
};
