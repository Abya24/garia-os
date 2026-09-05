/**
 * Garia OS - Academic & Calendar .ics (iCalendar / RFC 5545) Export Utility
 * Enables exporting individual exam milestones, subject exam dates, revision items,
 * daily study slots, and calendar events for seamless sync with Google Calendar,
 * Apple Calendar, Outlook, Android Calendar, and all major calendar platforms.
 */

import {
  CalendarEvent,
  ExamMilestone,
  AcademicRevisionItem,
  AcademicRoadmapStage,
  ExamProfile,
  AcademicSubject,
  Task,
  Goal,
  ExamPlanSlot,
  SmartStudySlot,
} from "../types";
import { getTodayString } from "./storage";

export interface IcsEventOptions {
  id?: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (optional, if omitted it's treated as an all-day event)
  endDate?: string; // YYYY-MM-DD
  endTime?: string; // HH:mm
  location?: string;
  category?: string;
  reminderMinutes?: number; // default e.g. 30 mins before
  status?: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  url?: string;
}

/**
 * Escapes characters according to RFC 5545 specification.
 */
export function escapeIcsText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n|\r/g, "\\n");
}

/**
 * Formats a Date object to YYYYMMDDTHHMMSSZ for DTSTAMP/UTC fields.
 */
export function formatUtcTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Parses YYYY-MM-DD and optionally HH:mm into ISO/ICS formatted strings.
 */
export function formatIcsDateTime(dateStr: string, timeStr?: string): {
  isAllDay: boolean;
  startIcs: string;
  endIcs: string;
  googleDates: string;
} {
  const cleanDate = dateStr.replace(/[^0-9-]/g, "").slice(0, 10);
  const parts = cleanDate.split("-");
  const year = parseInt(parts[0] || "2026", 10);
  const month = parseInt(parts[1] || "1", 10) - 1;
  const day = parseInt(parts[2] || "1", 10);

  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = `${year}${pad(month + 1)}${pad(day)}`;

  if (!timeStr || !timeStr.includes(":")) {
    // All day event: RFC 5545 specifies DTEND is exclusive (next day)
    const nextDay = new Date(Date.UTC(year, month, day + 1));
    const nextYmd = `${nextDay.getUTCFullYear()}${pad(nextDay.getUTCMonth() + 1)}${pad(
      nextDay.getUTCDate()
    )}`;
    return {
      isAllDay: true,
      startIcs: `DTSTART;VALUE=DATE:${ymd}`,
      endIcs: `DTEND;VALUE=DATE:${nextYmd}`,
      googleDates: `${ymd}/${nextYmd}`,
    };
  }

  // Timed event
  const timeParts = timeStr.trim().split(":");
  const hours = parseInt(timeParts[0] || "10", 10);
  const minutes = parseInt(timeParts[1] || "00", 10);

  const startTimeStr = `${ymd}T${pad(hours)}${pad(minutes)}00`;

  // Default duration is 1 hour if no end time is specified
  const endHours = (hours + 1) % 24;
  const endDayAdd = hours + 1 >= 24 ? 1 : 0;
  const endDayObj = new Date(Date.UTC(year, month, day + endDayAdd));
  const endYmd = `${endDayObj.getUTCFullYear()}${pad(endDayObj.getUTCMonth() + 1)}${pad(
    endDayObj.getUTCDate()
  )}`;
  const endTimeStr = `${endYmd}T${pad(endHours)}${pad(minutes)}00`;

  return {
    isAllDay: false,
    startIcs: `DTSTART:${startTimeStr}`,
    endIcs: `DTEND:${endTimeStr}`,
    googleDates: `${startTimeStr}/${endTimeStr}`,
  };
}

/**
 * Builds a single VEVENT component string.
 */
export function buildVEvent(event: IcsEventOptions): string {
  const dtstamp = formatUtcTimestamp();
  const uid = event.id ? `${event.id}@gariaos.app` : `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@gariaos.app`;
  const { isAllDay, startIcs, endIcs } = formatIcsDateTime(event.date, event.time);

  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    startIcs,
    endIcs,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description || "Scheduled via Garia OS Academic Hub")}`,
    `STATUS:${event.status || "CONFIRMED"}`,
    `TRANSP:${isAllDay ? "TRANSPARENT" : "OPAQUE"}`,
  ];

  if (event.category) {
    lines.push(`CATEGORIES:${escapeIcsText(event.category.toUpperCase())}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  } else {
    lines.push(`LOCATION:Garia OS`);
  }

  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  // Add a reminder alarm (default 30 mins, or custom)
  const alarmMins = event.reminderMinutes !== undefined ? event.reminderMinutes : isAllDay ? 540 : 30; // 9 hours before for all-day or 30m
  lines.push("BEGIN:VALARM");
  lines.push("ACTION:DISPLAY");
  lines.push(`DESCRIPTION:Reminder: ${escapeIcsText(event.title)}`);
  lines.push(`TRIGGER:-PT${alarmMins}M`);
  lines.push("END:VALARM");

  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

/**
 * Wraps one or more VEVENTs into a valid VCALENDAR payload.
 */
export function buildVCalendar(
  events: IcsEventOptions[],
  calendarName: string = "Garia OS Schedule"
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Garia OS//Academic Schedule Sync//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    "X-WR-TIMEZONE:UTC",
    ...events.map(buildVEvent),
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

/**
 * Triggers a browser download of the generated .ics file.
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  const cleanFilename = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a direct "Add to Google Calendar" web link.
 */
export function getGoogleCalendarWebUrl(event: IcsEventOptions): string {
  const { googleDates } = formatIcsDateTime(event.date, event.time);
  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: googleDates,
    details: `${event.description || ""}\n\nSynced from Garia OS Academic Engine.`.trim(),
    location: event.location || "Garia OS Academic Hub",
    add: "gariaos",
  });

  return `${baseUrl}?${params.toString()}`;
}

// =========================================================================
// SPECIFIC EXPORT HELPERS FOR GARIA OS ENTITIES
// =========================================================================

/**
 * Exports an individual Calendar Event as a .ics file.
 */
export function exportCalendarEventIcs(event: CalendarEvent): void {
  const ics = buildVCalendar(
    [
      {
        id: event.id,
        title: `[Garia OS] ${event.title}`,
        description: event.description || `Category: ${event.category.toUpperCase()}`,
        date: event.date,
        time: event.time,
        category: event.category,
      },
    ],
    `Garia Event - ${event.title}`
  );
  const filename = `Garia_Event_${event.date}_${event.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 25)}.ics`;
  downloadIcsFile(filename, ics);
}

/**
 * Exports all exam milestones into a single .ics calendar.
 */
export function exportAllMilestonesIcs(
  milestones: ExamMilestone[],
  examName: string = "Exam Preparation"
): void {
  const events: IcsEventOptions[] = milestones.map((m, idx) => ({
    id: `milestone-${m.id || idx}`,
    title: `[Exam Milestone] ${m.title}`,
    description: `Category: ${m.category}\nStatus: ${m.completed ? "Completed ✅" : "Pending ⏳"}\nTarget Exam: ${examName}\n\n${m.description}`,
    date: m.targetDate || getTodayString(),
    category: `MILESTONE_${m.category.toUpperCase()}`,
    reminderMinutes: 1440,
  }));

  const ics = buildVCalendar(events, `${examName} Milestones`);
  downloadIcsFile(`Garia_${examName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Milestones.ics`, ics);
}

/**
 * Exports multiple subject exam dates to a .ics calendar.
 */
export function exportSubjectExamDatesIcs(
  subjectExamDates: Record<string, string>,
  subjects: AcademicSubject[] = [],
  examName: string = "Board Exams"
): void {
  const events: IcsEventOptions[] = Object.entries(subjectExamDates).map(([key, dateStr]) => {
    const matching = subjects.find((s) => s.id === key || s.name === key);
    const subName = matching ? matching.name : key;
    return {
      id: `subj-exam-${key}-${dateStr}`,
      title: `[Board Exam] ${subName}`,
      description: `Official Exam Paper for ${subName}.\nExam: ${examName}\nDate: ${dateStr}`,
      date: dateStr,
      time: "10:00",
      category: "BOARD_EXAM",
      reminderMinutes: 1440,
    };
  });

  const ics = buildVCalendar(events, `${examName} Exam Schedule`);
  downloadIcsFile(`Garia_${examName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Subject_Dates.ics`, ics);
}

/**
 * Exports an individual Academic Exam Milestone as a .ics file.
 */
export function exportExamMilestoneIcs(
  milestone: ExamMilestone,
  targetDate?: string,
  examName?: string
): void {
  const dateToUse = targetDate || milestone.targetDate || getTodayString();
  const title = `[Exam Milestone] ${milestone.title}`;
  const description = `Milestone Category: ${milestone.category}\nTarget Exam: ${
    examName || "Board / Entrance Preparation"
  }\nStatus: ${milestone.completed ? "Completed ✅" : "In Progress ⏳"}\n\nDetails:\n${
    milestone.description
  }\n\nTracked in Garia OS Exam Intelligence Hub.`;

  const ics = buildVCalendar(
    [
      {
        id: `milestone-${milestone.id}`,
        title,
        description,
        date: dateToUse,
        category: `EXAM_${milestone.category.toUpperCase()}`,
        reminderMinutes: 1440, // 1 day before
      },
    ],
    `Garia Milestone - ${milestone.title}`
  );

  const filename = `Garia_Exam_Milestone_${milestone.category}_${milestone.title
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 30)}.ics`;
  downloadIcsFile(filename, ics);
}

/**
 * Exports an individual Subject Exam Date (e.g., Accountancy Board Exam) as a .ics file.
 */
export function exportSubjectExamIcs(
  subjectName: string,
  examDate: string,
  board?: string,
  examName?: string,
  time: string = "10:00"
): void {
  const title = `[Exam Paper] ${subjectName} - ${board || "Board"} Exam`;
  const description = `Official Paper for ${subjectName}.\nExam: ${
    examName || "Board / Competitive Examination"
  }\nBoard: ${board || "General"}\nDate: ${examDate}\nScheduled Time: ${time}\n\nBring Admit Card, stationery, and review VVI topics in Garia OS before entering.`;

  const ics = buildVCalendar(
    [
      {
        id: `exam-subject-${subjectName.replace(/\s+/g, "_")}-${examDate}`,
        title,
        description,
        date: examDate,
        time,
        category: "EXAM",
        reminderMinutes: 1440, // 1 day prior
      },
    ],
    `Garia Exam - ${subjectName}`
  );

  const filename = `Garia_Exam_${subjectName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${examDate}.ics`;
  downloadIcsFile(filename, ics);
}

/**
 * Exports the complete Exam Schedule (all subject exam dates + major milestones) as a unified .ics calendar.
 */
export function exportFullExamScheduleIcs(
  examProfile: ExamProfile,
  subjects: AcademicSubject[] = [],
  milestones: ExamMilestone[] = []
): void {
  const events: IcsEventOptions[] = [];

  // 1. Overall Exam Period
  if (examProfile.startDate) {
    events.push({
      id: `exam-main-${examProfile.examName}`,
      title: `[Exam Kickoff] ${examProfile.examName} Begins`,
      description: `Official commencement of ${examProfile.examName} (${examProfile.board} - ${examProfile.classLevel}).`,
      date: examProfile.startDate,
      time: "09:00",
      category: "EXAM_COMMENCEMENT",
      reminderMinutes: 2880, // 2 days before
    });
  }

  // 2. Individual Subject Papers
  if (examProfile.subjectExamDates) {
    Object.entries(examProfile.subjectExamDates).forEach(([subjKey, dateStr]) => {
      if (!dateStr) return;
      // find subject name if key is ID
      const matchingSub = subjects.find((s) => s.id === subjKey || s.name === subjKey);
      const subName = matchingSub ? matchingSub.name : subjKey;

      events.push({
        id: `subject-exam-${subjKey}-${dateStr}`,
        title: `[Board Exam] ${subName}`,
        description: `Subject Exam: ${subName}\nBoard: ${examProfile.board}\nClass: ${examProfile.classLevel}`,
        date: dateStr,
        time: "10:00",
        category: "EXAM_PAPER",
        reminderMinutes: 1440,
      });
    });
  }

  // 3. Exam Milestones
  milestones.forEach((m, idx) => {
    // distribute dates or use current/start date
    const mDate = examProfile.startDate || getTodayString();
    events.push({
      id: `milestone-${m.id || idx}`,
      title: `[Milestone] ${m.title}`,
      description: `${m.description}\nCategory: ${m.category}\nStatus: ${
        m.completed ? "Completed ✅" : "Pending ⏳"
      }`,
      date: mDate,
      category: "EXAM_MILESTONE",
      reminderMinutes: 720,
    });
  });

  const ics = buildVCalendar(events, `${examProfile.examName} Schedule`);
  const filename = `Garia_Complete_Exam_Schedule_${examProfile.examName.replace(/[^a-zA-Z0-9_-]/g, "_")}.ics`;
  downloadIcsFile(filename, ics);
}

/**
 * Exports an Academic Roadmap Stage as a milestone event in .ics format.
 */
export function exportAcademicRoadmapStageIcs(
  stage: AcademicRoadmapStage,
  targetDate?: string,
  stream?: string
): void {
  const dateToUse = targetDate || getTodayString();
  const pendingText =
    stage.pendingItems.length > 0
      ? `\n\nPending Goals:\n- ${stage.pendingItems.join("\n- ")}`
      : "";
  const completedText =
    stage.completedItems.length > 0
      ? `\n\nCompleted Milestones:\n- ${stage.completedItems.join("\n- ")}`
      : "";

  const title = `[Academic Stage] ${stage.title}`;
  const description = `${stage.description}\nStatus: ${stage.status} (${stage.progress}% completed)\nStream: ${
    stream || "General"
  }\nSuggested Action: ${stage.suggestedAction}${pendingText}${completedText}\n\nTracked in Garia OS Academic Roadmap.`;

  const ics = buildVCalendar(
    [
      {
        id: `academic-stage-${stage.id}`,
        title,
        description,
        date: dateToUse,
        category: "ACADEMIC_ROADMAP",
        reminderMinutes: 1440,
      },
    ],
    `Garia Roadmap - ${stage.title}`
  );

  const filename = `Garia_Academic_Stage_${stage.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30)}.ics`;
  downloadIcsFile(filename, ics);
}

/**
 * Exports a scheduled Academic Revision Item as a .ics file.
 */
export function exportRevisionItemIcs(revision: AcademicRevisionItem): void {
  const title = `[Revision] ${revision.subjectName} - ${revision.chapterTitle}${
    revision.topicName ? ` (${revision.topicName})` : ""
  }`;
  const description = `Priority: ${revision.priority}\nSubject: ${revision.subjectName}\nChapter: ${
    revision.chapterTitle
  }${revision.topicName ? `\nTopic: ${revision.topicName}` : ""}${
    revision.notes ? `\nNotes: ${revision.notes}` : ""
  }\nStatus: ${
    revision.completed ? "Completed ✅" : "Due for Revision ⚡"
  }\n\nAuto-scheduled via Garia OS Spaced Repetition Engine.`;

  const ics = buildVCalendar(
    [
      {
        id: `revision-${revision.id}`,
        title,
        description,
        date: revision.scheduledDate,
        time: "18:00", // Evening revision standard slot
        category: "REVISION",
        reminderMinutes: 30,
      },
    ],
    `Garia Revision - ${revision.chapterTitle}`
  );

  const filename = `Garia_Revision_${revision.subjectName}_${revision.chapterTitle
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 25)}_${revision.scheduledDate}.ics`;
  downloadIcsFile(filename, ics);
}

/**
 * Exports an entire list of Calendar Events into a single master .ics calendar file.
 */
export function exportAllCalendarEventsIcs(
  events: CalendarEvent[],
  calendarName: string = "Garia OS Calendar"
): void {
  const icsEvents: IcsEventOptions[] = events.map((e) => ({
    id: e.id,
    title: `[Garia] ${e.title}`,
    description: e.description || `Category: ${e.category}`,
    date: e.date,
    time: e.time,
    category: e.category,
  }));

  const ics = buildVCalendar(icsEvents, calendarName);
  const todayStr = getTodayString();
  downloadIcsFile(`Garia_Full_Calendar_Backup_${todayStr}.ics`, ics);
}

/**
 * Exports a Task as a .ics calendar deadline.
 */
export function exportTaskDeadlineIcs(task: Task): void {
  const title = `[Task] ${task.title}`;
  const description = `Priority: ${task.priority.toUpperCase()}\nCategory: ${
    task.category
  }\nStatus: ${task.completed ? "Completed ✅" : "Pending ⏳"}${
    task.description ? `\n\nNotes:\n${task.description}` : ""
  }`;

  const ics = buildVCalendar(
    [
      {
        id: `task-${task.id}`,
        title,
        description,
        date: task.date,
        time: task.time || "17:00",
        category: "TASK",
        reminderMinutes: 30,
      },
    ],
    `Garia Task - ${task.title}`
  );

  const filename = `Garia_Task_${task.date}_${task.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 25)}.ics`;
  downloadIcsFile(filename, ics);
}

/**
 * Exports a Goal target deadline as a .ics event.
 */
export function exportGoalTargetIcs(goal: Goal): void {
  const title = `[Goal Due] ${goal.title}`;
  const description = `Category: ${goal.category}\nProgress: ${goal.progress}%\nStatus: ${
    goal.completed ? "Completed ✅" : "Active Goal 🎯"
  }${goal.description ? `\n\nDetails:\n${goal.description}` : ""}`;

  const ics = buildVCalendar(
    [
      {
        id: `goal-${goal.id}`,
        title,
        description,
        date: goal.targetDate,
        time: "20:00",
        category: "GOAL",
        reminderMinutes: 1440,
      },
    ],
    `Garia Goal - ${goal.title}`
  );

  const filename = `Garia_Goal_${goal.targetDate}_${goal.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 25)}.ics`;
  downloadIcsFile(filename, ics);
}

/**
 * Exports a Daily Study Plan timetable as a multi-event .ics file.
 */
export function exportStudyPlanIcs(
  slots: (ExamPlanSlot | SmartStudySlot)[],
  dateStr: string = getTodayString(),
  title: string = "Daily Study Timetable"
): void {
  const events: IcsEventOptions[] = slots.map((slot, idx) => {
    // Parse timeSlot e.g. "09:00 AM - 11:00 AM" or "10:00 - 11:30"
    let startTime = "09:00";
    if (slot.timeSlot) {
      const match = slot.timeSlot.match(/(\d{1,2}:\d{2})/);
      if (match) startTime = match[1];
    }

    const activity = "activity" in slot ? slot.activity : slot.activityType;
    const notes = "explanation" in slot ? slot.explanation : slot.reasoning;

    const priority = "priority" in slot ? slot.priority : "priorityLevel" in slot ? slot.priorityLevel : "High";

    return {
      id: `study-slot-${slot.id || idx}-${dateStr}`,
      title: `[Study] ${slot.subjectName}: ${slot.chapterTitle} (${activity})`,
      description: `Activity: ${activity}\nSubject: ${slot.subjectName}\nChapter: ${slot.chapterTitle}\nSlot: ${slot.timeSlot}\nPriority: ${priority}\nNotes: ${notes}`,
      date: dateStr,
      time: startTime,
      category: "STUDY_TIMETABLE",
      reminderMinutes: 15,
    };
  });

  const ics = buildVCalendar(events, `Garia Study Plan - ${dateStr}`);
  const filename = `Garia_Study_Plan_${dateStr}.ics`;
  downloadIcsFile(filename, ics);
}
