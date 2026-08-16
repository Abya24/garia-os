import React, { useState } from "react";
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  X,
  ChevronRight,
  TrendingUp,
  BookOpen,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { Goal, Subject } from "../types";
import { getTodayString } from "../utils/storage";

interface GoalsPageProps {
  goals: Goal[];
  subjects: Subject[];
  onAddGoal: (goal: Omit<Goal, "id" | "createdAt">) => void;
  onUpdateGoal: (updatedGoal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onBack?: () => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({
  goals,
  subjects,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onBack,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // New Goal Form State
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("Academic");
  const [subjectId, setSubjectId] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>(getTodayString());
  const [progress, setProgress] = useState<number>(0);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Academic");
    setSubjectId("");
    setTargetDate(getTodayString());
    setProgress(0);
    setEditingGoal(null);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || "");
    setCategory(goal.category);
    setSubjectId(goal.subjectId || "");
    setTargetDate(goal.targetDate);
    setProgress(goal.progress);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingGoal) {
      onUpdateGoal({
        ...editingGoal,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        subjectId: subjectId || undefined,
        targetDate,
        progress,
        completed: progress >= 100,
      });
    } else {
      onAddGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        subjectId: subjectId || undefined,
        targetDate,
        progress,
        completed: progress >= 100,
      });
    }

    resetForm();
    setIsAddModalOpen(false);
  };

  const handleAdjustProgress = (goal: Goal, delta: number) => {
    const newProgress = Math.min(100, Math.max(0, goal.progress + delta));
    onUpdateGoal({
      ...goal,
      progress: newProgress,
      completed: newProgress >= 100,
    });
  };

  const handleToggleComplete = (goal: Goal) => {
    const isComp = !goal.completed;
    onUpdateGoal({
      ...goal,
      completed: isComp,
      progress: isComp ? 100 : goal.progress === 100 ? 50 : goal.progress,
    });
  };

  // Filter Goals
  const filteredGoals = goals.filter((g) => {
    if (filterCategory !== "all" && g.category.toLowerCase() !== filterCategory.toLowerCase()) {
      return false;
    }
    if (filterStatus === "active" && g.completed) return false;
    if (filterStatus === "completed" && !g.completed) return false;
    return true;
  });

  const categories = ["all", "Academic", "Personal", "Health", "Career"];

  const activeGoalsCount = goals.filter((g) => !g.completed).length;
  const completedGoalsCount = goals.filter((g) => g.completed).length;
  const avgProgress =
    goals.length > 0 ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) : 0;

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              id="goals-back-btn"
              aria-label="Go Back"
              className="p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight flex items-center gap-2">
              <Target className="w-7 h-7 text-emerald-400" />
              <span>Goal Tracker</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Set ambitious targets, track progress, and achieve your academic & personal milestones.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Active Targets</span>
            <div className="text-2xl font-black font-heading text-white mt-1">
              {activeGoalsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Completed</span>
            <div className="text-2xl font-black font-heading text-white mt-1">
              {completedGoalsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Avg Completion Rate</span>
            <div className="text-2xl font-black font-heading text-white mt-1">
              {avgProgress}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Dropdown Selectors */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 font-medium shrink-0">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl glass-pill text-xs font-bold text-emerald-300 border border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-slate-900 shadow-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-900 text-white">
                {cat.charAt(0).toUpperCase() + cat.slice(1)} Goals
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium shrink-0">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl glass-pill text-xs font-bold text-emerald-300 border border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-slate-900 shadow-sm"
          >
            <option value="all" className="bg-slate-900 text-white">All Statuses</option>
            <option value="active" className="bg-slate-900 text-white">Active Only</option>
            <option value="completed" className="bg-slate-900 text-white">Done (Completed)</option>
          </select>
        </div>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGoals.length === 0 ? (
          <div className="col-span-full glass-card p-8 rounded-3xl text-center border border-white/10">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300 font-heading">No goals found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Create your first target goal to track your progress!
            </p>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const linkedSubject = subjects.find((s) => s.id === goal.subjectId);
            const today = getTodayString();
            const isOverdue = goal.targetDate < today && !goal.completed;

            return (
              <div
                key={goal.id}
                className={`glass-card p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  goal.completed
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : isOverdue
                    ? "border-rose-500/30 bg-rose-500/5"
                    : "border-white/10 hover:border-emerald-500/30"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                        {goal.category}
                      </span>
                      {linkedSubject && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                          style={{
                            borderColor: `${linkedSubject.color}40`,
                            backgroundColor: `${linkedSubject.color}15`,
                            color: linkedSubject.color,
                          }}
                        >
                          <BookOpen className="w-3 h-3" />
                          {linkedSubject.name}
                        </span>
                      )}
                      {goal.completed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Completed 🎉
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3
                    className={`text-base font-bold font-heading text-white mt-2.5 ${
                      goal.completed ? "line-through text-slate-400" : ""
                    }`}
                  >
                    {goal.title}
                  </h3>

                  {goal.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{goal.description}</p>
                  )}
                </div>

                {/* Progress & Target Controls */}
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {goal.targetDate}</span>
                    </span>
                    <span
                      className={`font-bold ${
                        goal.completed
                          ? "text-emerald-400"
                          : goal.progress > 50
                          ? "text-cyan-400"
                          : "text-amber-400"
                      }`}
                    >
                      {goal.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goal.completed
                          ? "bg-emerald-400"
                          : goal.progress > 50
                          ? "bg-cyan-400"
                          : "bg-amber-400"
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>

                  {/* Quick Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustProgress(goal, -10)}
                        className="px-2 py-0.5 rounded-lg glass-pill text-[11px] font-bold text-slate-300 hover:bg-white/10"
                      >
                        -10%
                      </button>
                      <button
                        onClick={() => handleAdjustProgress(goal, 10)}
                        className="px-2 py-0.5 rounded-lg glass-pill text-[11px] font-bold text-slate-300 hover:bg-white/10"
                      >
                        +10%
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggleComplete(goal)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        goal.completed
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "glass-pill text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{goal.completed ? "Done" : "Mark Complete"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Goal Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white">
                {editingGoal ? "Edit Goal" : "Create New Goal"}
              </h3>
              <button
                onClick={() => {
                  resetForm();
                  setIsAddModalOpen(false);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Accountancy Ratios"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief target notes or milestone criteria..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none focus:border-emerald-500/50 bg-slate-900"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Personal">Personal</option>
                    <option value="Health">Health</option>
                    <option value="Career">Career</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none focus:border-emerald-500/50 bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Associated Subject (Optional)
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none focus:border-emerald-500/50 bg-slate-900"
                >
                  <option value="">None / General Goal</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Current Progress</span>
                  <span className="text-emerald-400 font-mono font-bold">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                >
                  {editingGoal ? "Save Changes" : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
