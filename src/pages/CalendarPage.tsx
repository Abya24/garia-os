import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckSquare,
  BookOpen,
  Target,
  Bell,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import {
  CalendarEvent,
  Task,
  StudySession,
  Goal,
  StudentProfile,
} from "../types";
import { getTodayString } from "../utils/storage";
import { CalendarSyncDropdown } from "../components/CalendarSyncDropdown";
import { GoogleCalendarSyncModal } from "../components/GoogleCalendarSyncModal";
import {
  exportAllCalendarEventsIcs,
  buildVCalendar,
  downloadIcsFile,
  getGoogleCalendarWebUrl,
} from "../utils/icsExport";

interface CalendarPageProps {
  events: CalendarEvent[];
  tasks: Task[];
  studySessions: StudySession[];
  goals: Goal[];
  activeProfile?: StudentProfile | null;
  onAddEvent: (event: Omit<CalendarEvent, "id" | "createdAt">) => void;
  onUpdateEvent: (updatedEvent: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleTaskComplete: (task: Task) => void;
  onBack?: () => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  events,
  tasks,
  studySessions,
  goals,
  activeProfile,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onToggleTaskComplete,
  onBack,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayString());
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState<boolean>(false);
  const [isGCalSyncModalOpen, setIsGCalSyncModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // New Event Form State
  const [eventTitle, setEventTitle] = useState<string>("");
  const [eventDesc, setEventDesc] = useState<string>("");
  const [eventCategory, setEventCategory] = useState<"event" | "exam" | "deadline" | "reminder">("event");
  const [eventDate, setEventDate] = useState<string>(getTodayString());
  const [eventTime, setEventTime] = useState<string>("10:00");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getTodayString());
  };

  // Calendar Grid Calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (string | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(d).padStart(2, "0");
    daysArray.push(`${year}-${monthStr}-${dayStr}`);
  }

  // Items for selected date
  const tasksForSelectedDate = tasks.filter((t) => t.date === selectedDateStr);
  const sessionsForSelectedDate = studySessions.filter((s) => s.date === selectedDateStr);
  const goalsForSelectedDate = goals.filter((g) => g.targetDate === selectedDateStr);
  const eventsForSelectedDate = events.filter((e) => e.date === selectedDateStr);

  const resetForm = () => {
    setEventTitle("");
    setEventDesc("");
    setEventCategory("event");
    setEventDate(selectedDateStr);
    setEventTime("10:00");
    setEditingEvent(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setEventDate(selectedDateStr);
    setIsAddEventModalOpen(true);
  };

  const handleOpenEdit = (e: CalendarEvent) => {
    setEditingEvent(e);
    setEventTitle(e.title);
    setEventDesc(e.description || "");
    setEventCategory(e.category);
    setEventDate(e.date);
    setEventTime(e.time || "10:00");
    setIsAddEventModalOpen(true);
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    if (editingEvent) {
      onUpdateEvent({
        ...editingEvent,
        title: eventTitle.trim(),
        description: eventDesc.trim() || undefined,
        category: eventCategory,
        date: eventDate,
        time: eventTime || undefined,
      });
    } else {
      onAddEvent({
        title: eventTitle.trim(),
        description: eventDesc.trim() || undefined,
        category: eventCategory,
        date: eventDate,
        time: eventTime || undefined,
        completed: false,
      });
    }

    resetForm();
    setIsAddEventModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-7 h-7 text-amber-400" />
              <span>Academic Calendar</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Visual month overview for tasks, study sessions, exams, and key goals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Google Calendar API Integration Button */}
          <button
            onClick={() => setIsGCalSyncModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md transition-all group"
            title="Configure and Sync with Google Calendar API"
          >
            <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Google Calendar Sync</span>
          </button>

          {events.length > 0 && (
            <button
              onClick={() => exportAllCalendarEventsIcs(events)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-bold text-xs shadow-md transition-all"
              title="Export all events into an .ics calendar file"
            >
              <Download className="w-4 h-4" />
              <span>Export All (.ics)</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
          {/* Month Header & Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-xl font-bold font-heading text-white">
              {monthNames[month]} {year}
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-slate-300 hover:text-white"
              >
                Today
              </button>
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl glass-pill text-slate-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl glass-pill text-slate-400 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold font-heading text-slate-400 uppercase tracking-wider py-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {daysArray.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-2xl bg-white/[0.02]" />;
              }

              const dayNum = parseInt(dateStr.split("-")[2], 10);
              const isToday = dateStr === getTodayString();
              const isSelected = dateStr === selectedDateStr;

              // Items on dateStr
              const dateTasksCount = tasks.filter((t) => t.date === dateStr).length;
              const dateSessionsCount = studySessions.filter((s) => s.date === dateStr).length;
              const dateGoalsCount = goals.filter((g) => g.targetDate === dateStr).length;
              const dateEvents = events.filter((e) => e.date === dateStr);

              const hasExams = dateEvents.some((e) => e.category === "exam");
              const hasDeadlines = dateEvents.some((e) => e.category === "deadline");

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between items-start text-left relative overflow-hidden group ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/10"
                      : isToday
                      ? "bg-emerald-500/10 border-emerald-500/40"
                      : "glass-pill border-white/5 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono ${
                        isToday
                          ? "w-6 h-6 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-bold"
                          : isSelected
                          ? "text-amber-300 font-bold"
                          : "text-slate-300"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Important Badges */}
                    {hasExams && (
                      <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-500/30 text-rose-300">
                        EXAM
                      </span>
                    )}
                  </div>

                  {/* Indicator Dots / Mini Badges */}
                  <div className="w-full flex flex-wrap gap-1 mt-auto">
                    {dateTasksCount > 0 && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400" title={`${dateTasksCount} Tasks`} />
                    )}
                    {dateSessionsCount > 0 && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400" title={`${dateSessionsCount} Study Sessions`} />
                    )}
                    {dateGoalsCount > 0 && (
                      <div className="w-2 h-2 rounded-full bg-purple-400" title={`${dateGoalsCount} Goals Due`} />
                    )}
                    {dateEvents.length > 0 && (
                      <div className="w-2 h-2 rounded-full bg-amber-400" title={`${dateEvents.length} Events`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/10 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Tasks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Study Sessions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Goals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Events / Exams</span>
            </div>
          </div>
        </div>

        {/* Selected Date Detail Panel */}
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-heading">
                  Selected Date
                </span>
                <h3 className="text-lg font-bold font-heading text-white">{selectedDateStr}</h3>
              </div>
              <button
                onClick={handleOpenAdd}
                className="p-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
                title="Add event for this date"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List of items on this date */}
            <div className="space-y-4 mt-4 max-h-[500px] overflow-y-auto pr-1">
              {/* Custom Events */}
              {eventsForSelectedDate.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Events & Exams ({eventsForSelectedDate.length})</span>
                  </h4>
                  {eventsForSelectedDate.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-2xl glass-pill border border-amber-500/20 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              ev.category === "exam"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : ev.category === "deadline"
                                ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {ev.category}
                          </span>
                          {ev.time && (
                            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {ev.time}
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-white font-heading mt-1">{ev.title}</h5>
                        {ev.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{ev.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Calendar / Google Sync Dropdown */}
                        <CalendarSyncDropdown
                          event={{
                            id: ev.id,
                            title: `[Garia OS] ${ev.title}`,
                            description: ev.description || `Category: ${ev.category.toUpperCase()}`,
                            date: ev.date,
                            time: ev.time,
                            category: ev.category,
                          }}
                          variant="icon"
                        />
                        <button
                          onClick={() => handleOpenEdit(ev)}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title="Edit Event"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent(ev.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks Due */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Tasks ({tasksForSelectedDate.length})</span>
                </h4>
                {tasksForSelectedDate.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No tasks scheduled.</p>
                ) : (
                  tasksForSelectedDate.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-2xl glass-pill border border-emerald-500/20 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <h5
                          className={`text-sm font-bold font-heading truncate ${
                            t.completed ? "line-through text-slate-500" : "text-white"
                          }`}
                        >
                          {t.title}
                        </h5>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          {t.time && <span>{t.time}</span>}
                          <span className="capitalize">{t.priority} Priority</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <CalendarSyncDropdown
                          event={{
                            id: `task-${t.id}`,
                            title: `[Task] ${t.title}`,
                            description: `Priority: ${t.priority.toUpperCase()}\nCategory: ${t.category}\nStatus: ${t.completed ? "Completed" : "Pending"}`,
                            date: t.date,
                            time: t.time,
                            category: "TASK",
                          }}
                          variant="icon"
                        />
                        <button
                          onClick={() => onToggleTaskComplete(t)}
                          className={`p-1.5 rounded-xl border transition-all ${
                            t.completed
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "glass-pill text-slate-400 hover:text-emerald-400"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Goals Target */}
              {goalsForSelectedDate.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Target Goals ({goalsForSelectedDate.length})</span>
                  </h4>
                  {goalsForSelectedDate.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-2xl glass-pill border border-purple-500/20 flex items-center justify-between gap-2"
                    >
                      <div>
                        <h5 className="text-sm font-bold text-white font-heading">{g.title}</h5>
                        <span className="text-[11px] text-purple-300 font-mono">
                          {g.progress}% completed
                        </span>
                      </div>

                      <CalendarSyncDropdown
                        event={{
                          id: `goal-${g.id}`,
                          title: `[Goal Due] ${g.title}`,
                          description: `Category: ${g.category}\nProgress: ${g.progress}%`,
                          date: g.targetDate,
                          category: "GOAL",
                        }}
                        variant="icon"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Study Sessions Logged */}
              {sessionsForSelectedDate.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Study Sessions ({sessionsForSelectedDate.length})</span>
                  </h4>
                  {sessionsForSelectedDate.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-2xl glass-pill border border-cyan-500/20 flex items-center justify-between"
                    >
                      <div>
                        <h5 className="text-sm font-bold text-white font-heading">{s.subjectName}</h5>
                        <span className="text-[11px] text-cyan-300 font-mono">
                          {Math.round(s.durationSeconds / 60)} minutes logged
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Calendar Event Modal */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white">
                {editingEvent ? "Edit Event" : "Add Calendar Event"}
              </h3>
              <button
                onClick={() => {
                  resetForm();
                  setIsAddEventModalOpen(false);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Accountancy Midterm Exam"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  rows={2}
                  placeholder="Exam syllabus, location, or notes..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none focus:border-amber-500/50 bg-slate-900"
                  >
                    <option value="event">General Event</option>
                    <option value="exam">Exam / Test</option>
                    <option value="deadline">Project Deadline</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none focus:border-amber-500/50 bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none focus:border-amber-500/50 bg-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsAddEventModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
                >
                  {editingEvent ? "Save Event" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Google Calendar Sync Modal */}
      <GoogleCalendarSyncModal
        isOpen={isGCalSyncModalOpen}
        onClose={() => setIsGCalSyncModalOpen(false)}
        tasks={tasks}
        studySessions={studySessions}
        events={events}
        goals={goals}
        activeProfile={activeProfile}
      />
    </div>
  );
};
