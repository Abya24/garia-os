import React, { useState, useEffect } from "react";
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
  AlertTriangle,
  Tag,
  X,
  Share2,
  ArrowLeft,
  Award,
  Sparkles,
  Users,
  Link2,
  Shield,
  FolderPlus,
  Flame,
  Zap,
  CheckSquare,
  Square,
  Layers,
  CheckCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Task, Priority, TaskCategory, SharedWorkspace, WorkspaceMember } from "../types";
import { getTodayString } from "../utils/storage";
import { CalendarSyncDropdown } from "../components/CalendarSyncDropdown";
import { getTaskMilestones } from "../utils/gamificationEngine";
import { MilestoneBadgesCard } from "../components/MilestoneBadgesCard";
import { auth } from "../utils/firebase";
import {
  subscribeToUserWorkspaces,
  addSharedTaskToWorkspace,
} from "../utils/collaborationEngine";
import { CreateSharedWorkspaceModal } from "../components/collaboration/CreateSharedWorkspaceModal";
import { JoinWorkspaceModal } from "../components/collaboration/JoinWorkspaceModal";
import { SharedTasksWorkspaceView } from "../components/collaboration/SharedTasksWorkspaceView";
import { SwipeableItemCard } from "../components/SwipeableItemCard";

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "createdAt">) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onBulkDeleteTasks?: (ids: string[]) => void;
  onBack?: () => void;
  currentUserId?: string;
  currentUserName?: string;
  currentUserEmail?: string;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onBulkDeleteTasks,
  onBack,
  currentUserId,
  currentUserName,
  currentUserEmail,
}) => {
  const [activeViewMode, setActiveViewMode] = useState<"personal" | "workspaces">("personal");
  const [selectedWorkspace, setSelectedWorkspace] = useState<SharedWorkspace | null>(null);
  const [sharedWorkspaces, setSharedWorkspaces] = useState<SharedWorkspace[]>([]);
  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [isJoinWsOpen, setIsJoinWsOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Deletion Confirmation Modal State (Single)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Bulk Action Mode State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Success Animation Tracker
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState("12:00");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<TaskCategory>("study");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  const todayStr = getTodayString();

  const userObj = {
    uid: auth.currentUser?.uid || currentUserId || "garia_student_user",
    displayName: auth.currentUser?.displayName || currentUserName || "Student User",
    email: auth.currentUser?.email || currentUserEmail || "student@garia.os",
  };

  // Standard + Dynamic Custom Categories aggregated from existing tasks
  const standardCategories = ["study", "personal", "work", "urgent", "exam", "research"];
  const allCategories = Array.from(
    new Set([
      ...standardCategories,
      ...tasks.map((t) => (t.category || "").toLowerCase().trim()),
    ])
  ).filter(Boolean);

  // Subscribe to collaborative workspaces
  useEffect(() => {
    const unsubscribe = subscribeToUserWorkspaces(userObj.uid, (workspaces) => {
      const taskWorkspaces = workspaces.filter((w) => w.type === "tasks");
      setSharedWorkspaces(taskWorkspaces);

      if (selectedWorkspace) {
        const updatedSelected = taskWorkspaces.find((w) => w.id === selectedWorkspace.id);
        if (updatedSelected) {
          setSelectedWorkspace(updatedSelected);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userObj.uid, selectedWorkspace?.id]);

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setDate(todayStr);
    setTime("12:00");
    setPriority("medium");
    setCategory("study");
    setIsCustomCategory(false);
    setCustomCategoryInput("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setDate(task.date);
    setTime(task.time || "12:00");
    setPriority(task.priority);
    
    const isStandard = standardCategories.includes((task.category || "").toLowerCase());
    if (isStandard) {
      setCategory(task.category);
      setIsCustomCategory(false);
      setCustomCategoryInput("");
    } else {
      setCategory(task.category);
      setIsCustomCategory(true);
      setCustomCategoryInput(task.category);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = isCustomCategory
      ? (customCategoryInput.trim() || "personal").toLowerCase()
      : category;

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        priority,
        category: finalCategory,
      });
    } else {
      onAddTask({
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        priority,
        category: finalCategory,
        completed: false,
      });
    }

    setIsModalOpen(false);
  };

  // Toggle task completion with strike-through and celebratory confetti effect
  const handleToggleTaskCompletion = (task: Task) => {
    const nextCompleted = !task.completed;
    onUpdateTask({ ...task, completed: nextCompleted });

    if (nextCompleted) {
      // Fire celebratory confetti
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.7 },
          colors: ["#10b981", "#06b6d4", "#f59e0b", "#a855f7", "#ec4899", "#3b82f6"],
        });
      } catch (err) {
        // Graceful fallback
      }

      setJustCompletedId(task.id);
      setTimeout(() => {
        setJustCompletedId((prev) => (prev === task.id ? null : prev));
      }, 2500);
    }
  };

  // Confirm task deletion handler
  const handleConfirmDelete = () => {
    if (taskToDelete) {
      onDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  // Bulk Selection Operations
  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const visibleIds = filteredTasks.map((t) => t.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedTaskIds.includes(id));
    if (allSelected) {
      setSelectedTaskIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSelectAllCompleted = () => {
    const completed = tasks.filter((t) => t.completed);
    const completedIds = completed.map((t) => t.id);
    setSelectedTaskIds(completedIds);
    if (!isBulkMode) {
      setIsBulkMode(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  const handleExitBulkMode = () => {
    setIsBulkMode(false);
    setSelectedTaskIds([]);
  };

  const handleExecuteBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    if (onBulkDeleteTasks) {
      onBulkDeleteTasks(selectedTaskIds);
    } else {
      selectedTaskIds.forEach((id) => onDeleteTask(id));
    }
    setSelectedTaskIds([]);
    setIsBulkDeleteModalOpen(false);
    setIsBulkMode(false);
  };

  // Share a personal task to a shared workspace
  const handleShareTaskToWorkspace = async (task: Task, ws: SharedWorkspace) => {
    try {
      const updated = await addSharedTaskToWorkspace(
        ws,
        {
          title: task.title,
          description: task.description,
          date: task.date,
          time: task.time,
          priority: task.priority,
          category: task.category,
          completed: task.completed,
          createdBy: {
            userId: userObj.uid,
            name: userObj.displayName || "Student User",
          },
        },
        userObj
      );
      setSelectedWorkspace(updated);
      setActiveViewMode("workspaces");
    } catch (err) {
      console.error("Failed to share task:", err);
    }
  };

  // Filter & Search Logic (Title + Description)
  const filteredTasks = tasks.filter((task) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchesTitle = task.title.toLowerCase().includes(q);
      const matchesDesc = (task.description || "").toLowerCase().includes(q);
      if (!matchesTitle && !matchesDesc) return false;
    }

    // Status filter
    if (selectedStatusFilter === "today" && (task.date !== todayStr || task.completed)) return false;
    if (selectedStatusFilter === "upcoming" && (task.date <= todayStr || task.completed)) return false;
    if (selectedStatusFilter === "completed" && !task.completed) return false;
    if (selectedStatusFilter === "pending" && task.completed) return false;

    // Priority filter
    if (selectedPriorityFilter !== "all" && task.priority !== selectedPriorityFilter) return false;

    // Category filter
    if (selectedCategoryFilter !== "all" && (task.category || "").toLowerCase() !== selectedCategoryFilter.toLowerCase()) return false;

    return true;
  });

  const highPriorityCount = tasks.filter((t) => !t.completed && t.priority === "high").length;
  const mediumPriorityCount = tasks.filter((t) => !t.completed && t.priority === "medium").length;
  const lowPriorityCount = tasks.filter((t) => !t.completed && t.priority === "low").length;

  const renderPriorityBadge = (p: Priority) => {
    switch (p) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 ring-1 ring-rose-500/20 text-[11px] font-extrabold uppercase tracking-wide shadow-sm shadow-rose-950/40 shrink-0">
            <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
            <span>High Priority</span>
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/20 text-[11px] font-extrabold uppercase tracking-wide shadow-sm shadow-amber-950/40 shrink-0">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Medium Priority</span>
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/20 text-[11px] font-extrabold uppercase tracking-wide shadow-sm shadow-emerald-950/40 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Low Priority</span>
          </span>
        );
    }
  };

  const getPriorityBorderClass = (p: Priority, isCompleted: boolean) => {
    if (isCompleted) return "border-l-4 border-l-slate-700/50";
    switch (p) {
      case "high":
        return "border-l-4 border-l-rose-500 hover:border-l-rose-400 shadow-sm shadow-rose-950/20";
      case "medium":
        return "border-l-4 border-l-amber-500 hover:border-l-amber-400 shadow-sm shadow-amber-950/20";
      case "low":
        return "border-l-4 border-l-emerald-500 hover:border-l-emerald-400 shadow-sm shadow-emerald-950/20";
    }
  };

  const getCategoryBadge = (c: string) => {
    const norm = (c || "").toLowerCase().trim();
    switch (norm) {
      case "study":
        return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
      case "personal":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "work":
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
      case "urgent":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30 font-bold";
      case "exam":
      case "exam prep":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold";
      case "research":
        return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
      default: {
        const palette = [
          "bg-teal-500/15 text-teal-300 border-teal-500/30",
          "bg-pink-500/15 text-pink-300 border-pink-500/30",
          "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
          "bg-sky-500/15 text-sky-300 border-sky-500/30",
        ];
        let hash = 0;
        for (let i = 0; i < norm.length; i++) hash += norm.charCodeAt(i);
        return palette[Math.abs(hash) % palette.length];
      }
    }
  };

  const taskMilestones = getTaskMilestones(tasks);

  // If a specific shared workspace is actively open, render its dedicated collaborative view
  if (selectedWorkspace) {
    return (
      <SharedTasksWorkspaceView
        workspace={selectedWorkspace}
        currentUser={userObj}
        onBack={() => setSelectedWorkspace(null)}
        onWorkspaceUpdated={(updated) => {
          setSelectedWorkspace(updated);
          setSharedWorkspaces((prev) =>
            prev.map((w) => (w.id === updated.id ? updated : w))
          );
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                Task Manager
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {tasks.filter((t) => t.completed).length}/{tasks.length} Done
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Organize individual goals or collaborate with peers in shared task lists.
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Primary Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-1 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-1 shadow-inner">
            <button
              onClick={() => setActiveViewMode("personal")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeViewMode === "personal"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Personal Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveViewMode("workspaces")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeViewMode === "workspaces"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Shared Workspaces ({sharedWorkspaces.length})</span>
            </button>
          </div>

          {activeViewMode === "personal" ? (
            <div className="flex items-center gap-2">
              <button
                id="tasks-bulk-action-toggle-btn"
                onClick={() => {
                  if (isBulkMode) {
                    handleExitBulkMode();
                  } else {
                    setIsBulkMode(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border ${
                  isBulkMode
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm"
                    : "bg-white/10 hover:bg-white/15 text-slate-200 border-white/10"
                }`}
                title={isBulkMode ? "Exit Bulk Action Mode" : "Enter Bulk Action Mode"}
              >
                {isBulkMode ? (
                  <>
                    <X className="w-3.5 h-3.5 text-rose-400" />
                    <span>Exit Bulk</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bulk Actions</span>
                    {tasks.filter((t) => t.completed).length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                        {tasks.filter((t) => t.completed).length} done
                      </span>
                    )}
                  </>
                )}
              </button>

              <button
                onClick={handleOpenAddModal}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsJoinWsOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition-all"
              >
                <Link2 className="w-3.5 h-3.5 text-primary" />
                <span>Join with Code</span>
              </button>
              <button
                onClick={() => setIsCreateWsOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SHARED WORKSPACES TAB CONTENT */}
      {activeViewMode === "workspaces" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white font-heading">
                Your Shared Task Workspaces
              </h2>
              <p className="text-xs text-slate-400">
                Collaborate in real-time, assign items, and track completion together.
              </p>
            </div>
          </div>

          {sharedWorkspaces.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-white/10 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-heading">
                  No Shared Task Workspaces Yet
                </h3>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Create a collaborative task list for your study group, project team, or classroom, or enter a join code to collaborate with friends.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsJoinWsOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition-colors"
                >
                  Join with Code / Link
                </button>
                <button
                  onClick={() => setIsCreateWsOpen(true)}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 shadow-sm"
                >
                  Create New Shared List
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedWorkspaces.map((ws) => {
                const members = Object.values(ws.members || {}) as WorkspaceMember[];
                const isOwner = ws.ownerId === userObj.uid;
                const totalTasks = ws.tasks?.length || 0;
                const doneTasks = ws.tasks?.filter((t) => t.completed).length || 0;
                const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                return (
                  <div
                    key={ws.id}
                    onClick={() => setSelectedWorkspace(ws)}
                    className="glass-card p-5 rounded-3xl border border-white/10 hover:border-primary/50 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                          {ws.joinCode}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isOwner
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {isOwner ? "Owner" : "Collaborator"}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-white group-hover:text-primary transition-colors line-clamp-1">
                        {ws.title}
                      </h3>
                      {ws.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {ws.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2 border-t border-white/10">
                      {/* Task completion progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{doneTasks}/{totalTasks} Tasks Done</span>
                          <span className="font-bold text-white">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Members row & Open button */}
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2 overflow-hidden">
                          {members.slice(0, 3).map((m, idx) => (
                            <div
                              key={m.userId || idx}
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 flex items-center justify-center text-[10px] text-white font-bold"
                              style={{ backgroundColor: m.avatarColor || "#3B82F6" }}
                              title={m?.name || "Member"}
                            >
                              {(m?.name || "U").slice(0, 1).toUpperCase()}
                            </div>
                          ))}
                          {members.length > 3 && (
                            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                              +{members.length - 3}
                            </div>
                          )}
                        </div>

                        <span className="text-xs font-bold text-primary group-hover:underline">
                          Open List →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PERSONAL TASKS TAB CONTENT */}
      {activeViewMode === "personal" && (
        <>
          {/* Task Milestone Badges & Achievements Section */}
          <MilestoneBadgesCard
            title="Task Milestones & Achievements"
            subtitle="Complete daily and study tasks to unlock milestone achievement badges and earn XP bonus."
            category="tasks"
            badges={taskMilestones.badges}
            unlockedCount={taskMilestones.unlockedCount}
            totalCount={taskMilestones.totalCount}
            latestUnlocked={taskMilestones.latestUnlocked}
            defaultExpanded={true}
          />

          {/* Prominent Local Search & Filter Hub */}
          <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-3.5 shadow-md">
            {/* Top Local Search Input Field */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
              <input
                id="tasks-local-search-input"
                type="text"
                placeholder="Search tasks by title or description in real-time..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-950/80 border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/50 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Priority Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Priority:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPriorityFilter("all")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedPriorityFilter === "all"
                      ? "bg-white/20 text-white border border-white/30 shadow-sm"
                      : "glass-pill text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  <span>All</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[10px] font-mono">
                    {tasks.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPriorityFilter("high")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedPriorityFilter === "high"
                      ? "bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm ring-1 ring-rose-500/30"
                      : "glass-pill text-rose-400/80 hover:text-rose-300 border border-rose-500/20"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>High</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-[10px] font-mono">
                    {highPriorityCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPriorityFilter("medium")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedPriorityFilter === "medium"
                      ? "bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm ring-1 ring-amber-500/30"
                      : "glass-pill text-amber-400/80 hover:text-amber-300 border border-amber-500/20"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Medium</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-[10px] font-mono">
                    {mediumPriorityCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPriorityFilter("low")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedPriorityFilter === "low"
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30"
                      : "glass-pill text-emerald-400/80 hover:text-emerald-300 border border-emerald-500/20"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Low</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-[10px] font-mono">
                    {lowPriorityCount}
                  </span>
                </button>
              </div>

              {(selectedPriorityFilter !== "all" || selectedCategoryFilter !== "all" || selectedStatusFilter !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPriorityFilter("all");
                    setSelectedCategoryFilter("all");
                    setSelectedStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Dropdown Filters Ribbon: Status & Category Groups */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-3.5 py-2 rounded-2xl border border-white/10 min-h-[44px]">
                <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-400">Status:</span>
                <select
                  id="tasks-status-dropdown"
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-slate-900 text-white">All Tasks ({tasks.length})</option>
                  <option value="pending" className="bg-slate-900 text-white">Pending ({tasks.filter(t => !t.completed).length})</option>
                  <option value="today" className="bg-slate-900 text-white">Due Today ({tasks.filter(t => t.date === todayStr && !t.completed).length})</option>
                  <option value="upcoming" className="bg-slate-900 text-white">Upcoming</option>
                  <option value="completed" className="bg-slate-900 text-white">Completed ({tasks.filter(t => t.completed).length})</option>
                </select>
              </div>

              {/* Custom Category Group Filtering Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-3.5 py-2 rounded-2xl border border-white/10 min-h-[44px] flex-1 sm:flex-initial">
                <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-400">Category Group:</span>
                <select
                  id="tasks-category-dropdown"
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer pr-1 capitalize"
                >
                  <option value="all" className="bg-slate-900 text-white">All Categories ({tasks.length})</option>
                  {allCategories.map((cat) => {
                    const count = tasks.filter((t) => (t.category || "").toLowerCase() === cat.toLowerCase()).length;
                    return (
                      <option key={cat} value={cat} className="bg-slate-900 text-white capitalize">
                        {cat} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Quick Results Summary & Quick Bulk Select */}
              <div className="ml-auto flex items-center gap-2.5">
                {tasks.filter((t) => t.completed).length > 0 && !isBulkMode && (
                  <button
                    type="button"
                    onClick={handleSelectAllCompleted}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all cursor-pointer"
                    title="Select all completed tasks and open bulk actions"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Select {tasks.filter((t) => t.completed).length} Completed</span>
                  </button>
                )}
                <div className="text-xs text-slate-400 font-mono">
                  Showing <strong className="text-white">{filteredTasks.length}</strong> of {tasks.length}
                </div>
              </div>
            </div>
          </div>

          {/* Active Bulk Action Control Toolbar */}
          {isBulkMode && (
            <div className="glass-card rounded-3xl p-4 sm:p-5 border-2 border-emerald-500/40 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                        Bulk Action Mode
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                        {selectedTaskIds.length} Selected
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Select multiple tasks to delete them at once or use quick selectors below.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {selectedTaskIds.length > 0 && (
                    <button
                      id="bulk-delete-selected-btn"
                      onClick={() => setIsBulkDeleteModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected ({selectedTaskIds.length})</span>
                    </button>
                  )}
                  <button
                    onClick={handleExitBulkMode}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-semibold text-xs border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Exit Bulk Mode</span>
                  </button>
                </div>
              </div>

              {/* Quick Select Buttons Ribbon */}
              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllCompleted}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Select all completed tasks at once"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Select All Completed ({tasks.filter((t) => t.completed).length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {filteredTasks.every((t) => selectedTaskIds.includes(t.id)) && filteredTasks.length > 0
                      ? "Deselect Visible"
                      : `Select All Visible (${filteredTasks.length})`}
                  </span>
                </button>

                {selectedTaskIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center border border-white/10 my-8 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white font-heading">
                  No matching tasks found
                </h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  {searchQuery || selectedCategoryFilter !== "all" || selectedPriorityFilter !== "all"
                    ? "Try clearing your search query or switching filters to see more tasks."
                    : "You currently have no tasks in this view. Tap 'New Task' above to create one!"}
                </p>
                {(searchQuery || selectedCategoryFilter !== "all" || selectedPriorityFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategoryFilter("all");
                      setSelectedPriorityFilter("all");
                      setSelectedStatusFilter("all");
                    }}
                    className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isJustDone = justCompletedId === task.id;
                const isSelected = selectedTaskIds.includes(task.id);

                return (
                  <SwipeableItemCard
                    key={task.id}
                    id={task.id}
                    isCompleted={task.completed}
                    onToggleComplete={() => handleToggleTaskCompletion(task)}
                    completedText="Task Completed!"
                    uncompletedText="Mark as Pending"
                  >
                    <div
                      onClick={isBulkMode ? () => toggleSelectTask(task.id) : undefined}
                      className={`glass-card p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden ${
                        isBulkMode ? "cursor-pointer select-none" : ""
                      } ${
                        isSelected
                          ? "ring-2 ring-emerald-400 bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/30"
                          : getPriorityBorderClass(task.priority, task.completed)
                      } ${
                        task.completed && !isSelected
                          ? "opacity-70 bg-slate-900/40 border-slate-800"
                          : !isSelected
                          ? "border-white/10 hover:border-white/25 hover:shadow-lg"
                          : ""
                      } ${isJustDone ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 scale-[1.01]" : ""}`}
                    >
                      {/* Task Content */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        {isBulkMode ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectTask(task.id);
                            }}
                            className={`mt-0.5 p-1 rounded-xl transition-all shrink-0 cursor-pointer ${
                              isSelected
                                ? "text-emerald-400 hover:scale-110"
                                : "text-slate-500 hover:text-white"
                            }`}
                            title={isSelected ? "Deselect task" : "Select task"}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-6 h-6 text-emerald-400" />
                            ) : (
                              <Square className="w-6 h-6 text-slate-500 hover:text-slate-300" />
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleTaskCompletion(task)}
                            className={`mt-0.5 p-1 rounded-xl transition-all shrink-0 cursor-pointer ${
                              task.completed
                                ? "text-emerald-400 hover:scale-110 active:scale-95"
                                : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90"
                            }`}
                            title={task.completed ? "Mark as pending" : "Mark as completed"}
                          >
                            {task.completed ? (
                              <div className="relative">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-500/20" />
                                {isJustDone && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                                )}
                              </div>
                            ) : (
                              <Circle className="w-6 h-6" />
                            )}
                          </button>
                        )}

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4
                              className={`font-bold text-base font-heading transition-all duration-300 ${
                                task.completed
                                  ? "line-through text-slate-400 decoration-emerald-400/80 decoration-2 italic"
                                  : "text-white"
                              }`}
                            >
                              {task.title}
                            </h4>
                            {/* Visual Priority Badge */}
                            {renderPriorityBadge(task.priority)}
                          </div>

                          {task.description && (
                            <p
                              className={`text-xs transition-colors line-clamp-2 ${
                                task.completed ? "text-slate-500 line-through" : "text-slate-400"
                              }`}
                            >
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

                            {/* Dynamic / Custom Category Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold capitalize tracking-wide ${getCategoryBadge(
                                task.category
                              )}`}
                            >
                              {task.category}
                            </span>

                            {isJustDone && (
                              <span className="text-[10px] font-bold text-emerald-400 animate-bounce flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Done!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Task Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {isBulkMode ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectTask(task.id);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                                : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                            }`}
                          >
                            {isSelected ? "Selected ✓" : "Select"}
                          </button>
                        ) : (
                          <>
                            {/* Share to workspace if workspaces exist */}
                            {sharedWorkspaces.length > 0 && (
                              <select
                                onChange={(e) => {
                                  const targetWs = sharedWorkspaces.find((w) => w.id === e.target.value);
                                  if (targetWs) {
                                    handleShareTaskToWorkspace(task, targetWs);
                                  }
                                }}
                                defaultValue=""
                                className="px-2 py-1 bg-slate-800 border border-white/10 rounded-xl text-[11px] text-slate-300 focus:outline-none cursor-pointer"
                                title="Copy to shared workspace"
                              >
                                <option value="" disabled>Share to Workspace ▾</option>
                                {sharedWorkspaces.map((w) => (
                                  <option key={w.id} value={w.id}>
                                    {w.title}
                                  </option>
                                ))}
                              </select>
                            )}

                            <CalendarSyncDropdown
                              event={{
                                title: task.title,
                                description: task.description,
                                date: task.date,
                                time: task.time,
                                location: "Garia Study OS",
                              }}
                            />

                            <button
                              onClick={() => handleOpenEditModal(task)}
                              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Edit task"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTaskToDelete(task)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </SwipeableItemCard>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-heading text-white">
                {editingTask ? "Edit Task" : "Add New Task"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete Chemistry Numerical Chapter 4"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Additional notes, pages to read, or formulas to memorize..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Visual Priority Level Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">
                  Priority Level *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority("high")}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      priority === "high"
                        ? "bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/40 text-white shadow-lg shadow-rose-500/15"
                        : "bg-slate-950 border-white/10 hover:border-rose-500/40 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300">High</span>
                      <Flame className="w-4 h-4 text-rose-400 fill-rose-400" />
                    </div>
                    <span className="text-[10px] text-slate-400">Urgent & Critical</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority("medium")}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      priority === "medium"
                        ? "bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 text-white shadow-lg shadow-amber-500/15"
                        : "bg-slate-950 border-white/10 hover:border-amber-500/40 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">Medium</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-[10px] text-slate-400">Standard Pace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority("low")}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      priority === "low"
                        ? "bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/40 text-white shadow-lg shadow-emerald-500/15"
                        : "bg-slate-950 border-white/10 hover:border-emerald-500/40 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">Low</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-slate-400">Flexible Routine</span>
                  </button>
                </div>
              </div>

              {/* Category & Custom Category Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-400">
                    Category Group
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    {isCustomCategory ? "← Choose Preset" : "+ Custom Category"}
                  </button>
                </div>

                {isCustomCategory ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="e.g. Urgent, Research, Exam Prep, Chemistry..."
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-emerald-500/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                      required
                    />
                    <p className="text-[11px] text-slate-400">
                      Type your custom category name to group tasks dynamically.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {["study", "personal", "work", "urgent", "exam", "research"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                          category === cat
                            ? `${getCategoryBadge(cat)} ring-1 ring-white/20 font-extrabold shadow-sm`
                            : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || (isCustomCategory && !customCategoryInput.trim())}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Prevents Accidental Data Loss) */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-heading">
                  Delete this task?
                </h3>
                <p className="text-xs text-slate-400">
                  Are you sure you want to permanently delete this task? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Task Preview Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1 text-xs">
              <div className="font-bold text-white line-clamp-1">{taskToDelete.title}</div>
              {taskToDelete.description && (
                <div className="text-slate-400 text-[11px] line-clamp-2">{taskToDelete.description}</div>
              )}
              <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-400">
                <span>{taskToDelete.date}</span>
                <span>•</span>
                <span className="capitalize">{taskToDelete.priority} priority</span>
                <span>•</span>
                <span className="capitalize">{taskToDelete.category}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal (Prevents Accidental Bulk Data Loss) */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-heading">
                  Delete {selectedTaskIds.length} Selected Tasks?
                </h3>
                <p className="text-xs text-slate-400">
                  Are you sure you want to delete these {selectedTaskIds.length} tasks in one click? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Selected Items Breakdown & Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>
                  {tasks.filter((t) => selectedTaskIds.includes(t.id) && t.completed).length} Completed,{" "}
                  {tasks.filter((t) => selectedTaskIds.includes(t.id) && !t.completed).length} Pending
                </span>
                <span>{selectedTaskIds.length} items to remove</span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 p-2 rounded-2xl bg-slate-950/70 border border-white/10 no-scrollbar">
                {tasks
                  .filter((t) => selectedTaskIds.includes(t.id))
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className={`truncate font-semibold ${task.completed ? "line-through text-slate-400" : "text-white"}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 ${getCategoryBadge(task.category)}`}>
                        {task.category}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-bulk-delete-btn"
                onClick={handleExecuteBulkDelete}
                className="px-5 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete {selectedTaskIds.length} Tasks</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Shared Workspace Modal */}
      <CreateSharedWorkspaceModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
        defaultType="tasks"
        currentUser={userObj}
        onCreated={(newWs) => {
          setSelectedWorkspace(newWs);
          setSharedWorkspaces((prev) => [newWs, ...prev]);
        }}
      />

      {/* Join Shared Workspace Modal */}
      <JoinWorkspaceModal
        isOpen={isJoinWsOpen}
        onClose={() => setIsJoinWsOpen(false)}
        currentUser={userObj}
        onJoined={(joinedWs) => {
          setSelectedWorkspace(joinedWs);
          setSharedWorkspaces((prev) => [
            joinedWs,
            ...prev.filter((w) => w.id !== joinedWs.id),
          ]);
        }}
      />
    </div>
  );
};
