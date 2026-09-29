import { StudySession, Subject, StudentProfile } from "../types";
import { formatDurationCompact } from "./dateTimeUtils";
import { getTodayString } from "./storage";

function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface StudyCsvExportResult {
  csvContent: string;
  rowCount: number;
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  filename: string;
}

/**
 * Generates an RFC-4180 compliant CSV string for a student's study session history.
 */
export function generateStudySessionsCSV(
  sessions: StudySession[],
  subjects: Subject[] = [],
  studentProfile?: StudentProfile
): StudyCsvExportResult {
  const safeSessions = Array.isArray(sessions) ? [...sessions] : [];
  // Sort newest first by date & timestamp
  safeSessions.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  const subjectMap = new Map<string, Subject>();
  (Array.isArray(subjects) ? subjects : []).forEach((s) => {
    if (s && s.id) subjectMap.set(s.id, s);
  });

  const studentName = studentProfile?.name || "Student";
  const studentStream = studentProfile?.stream || "General";

  const headers = [
    "Session ID",
    "Date",
    "Logged Timestamp",
    "Student Name",
    "Stream",
    "Subject Name",
    "Duration (Seconds)",
    "Duration (Minutes)",
    "Duration (Hours)",
    "Formatted Duration",
    "Subject Weekly Target (Minutes)",
    "Notes",
  ];

  const rows: string[] = [headers.map(escapeCsvCell).join(",")];

  let totalSeconds = 0;

  safeSessions.forEach((sess) => {
    const durationSecs = Math.max(0, Number(sess.durationSeconds) || 0);
    totalSeconds += durationSecs;

    const durationMins = Number((durationSecs / 60).toFixed(1));
    const durationHrs = Number((durationSecs / 3600).toFixed(2));
    const formatted = formatDurationCompact(durationSecs);
    const matchingSubj = subjectMap.get(sess.subjectId);
    const weeklyTargetMins = matchingSubj?.targetMinutesPerWeek ?? 300;
    const isoTimestamp = sess.timestamp
      ? new Date(sess.timestamp).toISOString()
      : `${sess.date}T00:00:00.000Z`;

    const row = [
      sess.id,
      sess.date,
      isoTimestamp,
      studentName,
      studentStream,
      sess.subjectName || matchingSubj?.name || "General Study",
      durationSecs,
      durationMins,
      durationHrs,
      formatted,
      weeklyTargetMins,
      sess.notes || "",
    ];

    rows.push(row.map(escapeCsvCell).join(","));
  });

  const totalMinutes = Math.round(totalSeconds / 60);
  const totalHours = Number((totalSeconds / 3600).toFixed(2));
  const safeStudentSlug = studentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `garia-study-history-${safeStudentSlug || "student"}-${getTodayString()}.csv`;

  return {
    csvContent: rows.join("\r\n"),
    rowCount: safeSessions.length,
    totalSeconds,
    totalMinutes,
    totalHours,
    filename,
  };
}

/**
 * Triggers a browser download of the study session history CSV file.
 */
export function downloadStudySessionsCSV(
  sessions: StudySession[],
  subjects: Subject[] = [],
  studentProfile?: StudentProfile
): StudyCsvExportResult {
  const result = generateStudySessionsCSV(sessions, subjects, studentProfile);

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    // Include UTF-8 BOM so spreadsheet software opens special characters cleanly
    const bom = "\uFEFF";
    const blob = new Blob([bom + result.csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", result.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  return result;
}
