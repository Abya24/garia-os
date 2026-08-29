import { StudentProfile, UserSettings } from "../types";

/**
 * Capitalizes the first letter of each word in a string while preserving
 * whitespace and spacing. Useful for real-time name input formatting.
 */
export function capitalizeWords(input?: string | null): string {
  if (!input) return "";
  return input.replace(/(^|\s+)(\S)/g, (_match, prefix, char) => prefix + char.toUpperCase());
}

/**
 * Normalizes and preserves the exact student name without altering character order.
 * Trims extraneous edge whitespace and handles null/empty cases safely.
 */
export function formatStudentDisplayName(
  rawName?: string | null,
  fallback = "Student"
): string {
  if (!rawName) return fallback;
  const trimmed = capitalizeWords(rawName).trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

/**
 * Retrieves the consistent student display name from the active profile or user settings.
 * Ensures Dashboard, Abya AI, Academic Intelligence, Analytics, Settings, Profile Switcher,
 * and Sidebar all use the exact same display name source and preservation rules.
 */
export function getStudentDisplayName(
  activeStudent?: StudentProfile | null,
  settings?: UserSettings | null,
  fallback = "Student"
): string {
  if (activeStudent?.name && activeStudent.name.trim()) {
    return formatStudentDisplayName(activeStudent.name, fallback);
  }
  if (settings?.userName && settings.userName.trim()) {
    return formatStudentDisplayName(settings.userName, fallback);
  }
  return fallback;
}

/**
 * Extracts avatar initials accurately starting from the beginning of the name.
 * Never reverses character order and handles Unicode characters safely.
 */
export function getStudentAvatarInitials(
  name?: string | null,
  fallback = "S"
): string {
  const cleanName = formatStudentDisplayName(name, fallback);
  if (!cleanName) return fallback;
  const firstChar = Array.from(cleanName)[0] || fallback;
  return firstChar.toUpperCase();
}
