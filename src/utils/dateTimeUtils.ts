/**
 * Centralized Date, Time, and Duration utilities for Garia OS.
 * Every date/time/greeting helper is defined here exactly once.
 */

/**
 * Returns a polite, time-sensitive greeting based on the current or provided hour.
 * Morning: 05:00 - 11:59
 * Afternoon: 12:00 - 16:59
 * Evening: 17:00 - 21:59
 * Night: 22:00 - 04:59
 */
export function getTimeOfDayGreeting(
  date: Date = new Date(),
  language: "en" | "hi" = "en"
): string {
  const hour = date.getHours();
  if (language === "hi") {
    if (hour >= 4 && hour < 12) return "सुप्रभात";
    if (hour >= 12 && hour < 17) return "शुभ दोपहर";
    if (hour >= 17 && hour < 21) return "शुभ संध्या";
    return "शुभ रात्रि";
  }
  if (hour >= 4 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

/**
 * Formats total seconds into MM:SS (or HH:MM:SS if >= 1 hour).
 */
export function formatSecondsToMSS(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Formats total seconds into human-readable compact duration:
 * e.g., 5400s -> "1h 30m", 300s -> "5 mins", 45s -> "45s"
 */
export function formatDurationCompact(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.round((safeSec % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins} mins`;
  }
  return `${safeSec}s`;
}

/**
 * Formats minutes into human-readable hours and minutes:
 * e.g. 150 -> "2h 30m", 45 -> "45m"
 */
export function formatMinutesDisplay(totalMinutes: number): string {
  const safeMins = Math.max(0, Math.round(totalMinutes));
  const hrs = Math.floor(safeMins / 60);
  const mins = safeMins % 60;

  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}
