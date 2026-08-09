import React, { useState } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Filter,
  AlertCircle,
  Tag,
  X,
} from "lucide-react";
import { Task, Priority, TaskCategory } from "../types";
import { getTodayString } from "../utils/storage";

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "createdAt">) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all"); // all, today, upcoming, high, study, personal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState("12:00");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<TaskCategory>("study");

  const todayStr = getTodayString();

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setDate(todayStr);
    setTime("12:00");
    setPriority("medium");
    setCategory("study");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setDate(task.date);
    setTime(task.time || "12:00");
    setPriority(task.priority);
    setCategory(task.category);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        priority,
        category,
      });
    } else {
      onAddTask({
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        priority,
        category,
        completed: false,
      });
    }

    setIsModalOpen(false);
  };

  // Filter & Search Logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === "today") return task.date === todayStr;
    if (selectedFilter === "upcoming") return task.date > todayStr;
    if (selectedFilter === "high") return task.priority === "high";
    if (selectedFilter === "study") return task.category === "study";
    if (selectedFilter === "personal") return task.category === "personal";
    if (selectedFilter === "work") return task.category === "work";

    return true;
  });

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case "high":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "low":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    }
  };

  const getCategoryBadge = (c: TaskCategory) => {
    switch (c) {
      case "study":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "personal":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "work":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Task Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize, prioritize, and track your daily & study objectives.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl glass-pill text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/10"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Tasks" },
              { id: "today", label: "Today" },
              { id: "upcoming", label: "Upcoming" },
              { id: "high", label: "High Priority" },
              { id: "study", label: "Study" },
              { id: "personal", label: "Personal" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedFilter === f.id
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "glass-pill text-slate-400 hover:text-white border-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-white/10 my-8">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white font-heading">
              No tasks found
            </h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              You have no pending tasks under this filter. Tap "Add New Task" above to get started!
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`glass-card p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                task.completed
                  ? "opacity-60 bg-slate-900/40 border-slate-800"
                  : "border-white/10 hover:border-emerald-500/30"
              }`}
            >
              {/* Task Content */}
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() =>
                    onUpdateTask({ ...task, completed: !task.completed })
                  }
                  className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-500/20" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-500 hover:text-emerald-400" />
                  )}
                </button>

                <div className="space-y-1 min-w-0">
                  <h4
                    className={`font-semibold text-base text-white font-heading ${
                      task.completed ? "line-through text-slate-400" : ""
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {task.date === todayStr ? (
                        <strong className="text-emerald-400">Today</strong>
                      ) : (
                        task.date
                      )}
                    </span>

                    {task.time && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {task.time}
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getPriorityBadge(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${getCategoryBadge(
                        task.category
                      )}`}
                    >
                      {task.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleOpenEditModal(task)}
                  className="p-2 rounded-xl glass-pill text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                  title="Edit Task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-2 rounded-xl glass-pill text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Add / Edit Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="w-full max-w-lg glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white">
                {editingTask ? "Edit Task" : "Create New Task"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full glass-pill text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Complete Chapter 3 Accountancy Revision"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional details, formula reminders, or links..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-pill text-white border border-white/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-pill text-white border border-white/10 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as TaskCategory)
                    }
                    className="w-full px-3 py-2 rounded-xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                  >
                    <option value="study">Study</option>
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-pill text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  {editingTask ? "Save Changes" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
