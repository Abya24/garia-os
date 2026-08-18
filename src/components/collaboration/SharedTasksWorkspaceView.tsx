import React, { useState } from "react";
import {
  Share2,
  History,
  Plus,
  Users,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  User,
  Trash2,
  Edit2,
  Shield,
  Filter,
  Check,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Search,
} from "lucide-react";
import {
  SharedWorkspace,
  SharedTask,
  Priority,
  TaskCategory,
  WorkspaceMember,
} from "../../types";
import {
  addSharedTaskToWorkspace,
  updateSharedTaskInWorkspace,
  deleteSharedTaskFromWorkspace,
} from "../../utils/collaborationEngine";
import { ShareWorkspaceModal } from "./ShareWorkspaceModal";
import { ActivityLogDrawer } from "./ActivityLogDrawer";

interface SharedTasksWorkspaceViewProps {
  workspace: SharedWorkspace;
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  };
  onBack: () => void;
  onWorkspaceUpdated: (updated: SharedWorkspace) => void;
}

export const SharedTasksWorkspaceView: React.FC<SharedTasksWorkspaceViewProps> = ({
  workspace,
  currentUser,
  onBack,
  onWorkspaceUpdated,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");

  // New task form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newCategory, setNewCategory] = useState<TaskCategory>("academic");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState<string>("");

  const isOwner = workspace.ownerId === currentUser.uid;
  const currentMember = workspace.members[currentUser.uid];
  const userRole = isOwner ? "owner" : currentMember?.role || "viewer";
  const isViewer = userRole === "viewer";

  const membersList: WorkspaceMember[] = Object.values(workspace.members);
  const tasksList: SharedTask[] = workspace.tasks || [];

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isViewer) return;

    let assigneeName: string | undefined;
    let assigneeEmail: string | undefined;
    let assigneeAvatarColor: string | undefined;

    if (newAssigneeId) {
      const targetMember = workspace.members[newAssigneeId];
      if (targetMember) {
        assigneeName = targetMember.name;
        assigneeEmail = targetMember.email;
        assigneeAvatarColor = targetMember.avatarColor;
      }
    }

    try {
      const updated = await addSharedTaskToWorkspace(
        workspace,
        {
          title: newTitle.trim(),
          description: newDescription.trim(),
          priority: newPriority,
          category: newCategory,
          date: newDate,
          time: newTime || undefined,
          completed: false,
          assigneeId: newAssigneeId || undefined,
          assigneeName,
          assigneeEmail,
          assigneeAvatarColor,
          createdBy: {
            userId: currentUser.uid,
            name: currentUser.displayName || "Student User",
          },
        },
        currentUser
      );

      onWorkspaceUpdated(updated);
      setNewTitle("");
      setNewDescription("");
      setNewAssigneeId("");
      setIsAddingTask(false);
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  const handleToggleComplete = async (task: SharedTask) => {
    if (isViewer) return;
    const isNowCompleted = !task.completed;

    const updatedTask: SharedTask = {
      ...task,
      completed: isNowCompleted,
      completedBy: isNowCompleted
        ? {
            userId: currentUser.uid,
            name: currentUser.displayName || "Collaborator",
            timestamp: Date.now(),
          }
        : undefined,
    };

    try {
      const updated = await updateSharedTaskInWorkspace(
        workspace,
        updatedTask,
        currentUser
      );
      onWorkspaceUpdated(updated);
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    }
  };

  const handleReassign = async (task: SharedTask, newAssigneeUserId: string) => {
    if (isViewer) return;

    let assigneeName: string | undefined;
    let assigneeEmail: string | undefined;
    let assigneeAvatarColor: string | undefined;

    if (newAssigneeUserId) {
      const targetMember = workspace.members[newAssigneeUserId];
      if (targetMember) {
        assigneeName = targetMember.name;
        assigneeEmail = targetMember.email;
        assigneeAvatarColor = targetMember.avatarColor;
      }
    }

    const updatedTask: SharedTask = {
      ...task,
      assigneeId: newAssigneeUserId || undefined,
      assigneeName,
      assigneeEmail,
      assigneeAvatarColor,
    };

    try {
      const updated = await updateSharedTaskInWorkspace(
        workspace,
        updatedTask,
        currentUser
      );
      onWorkspaceUpdated(updated);
    } catch (err) {
      console.error("Failed to reassign task:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (isViewer) return;
    if (window.confirm("Delete this shared task for all collaborators?")) {
      try {
        const updated = await deleteSharedTaskFromWorkspace(
          workspace,
          taskId,
          currentUser
        );
        onWorkspaceUpdated(updated);
      } catch (err) {
        console.error("Failed to delete task:", err);
      }
    }
  };

  // Filter tasks
  const filteredTasks = tasksList.filter((task) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q) || false;
      const matchAssignee = task.assigneeName?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }

    if (filterStatus === "active" && task.completed) return false;
    if (filterStatus === "completed" && !task.completed) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;

    if (filterAssignee === "me") {
      return task.assigneeId === currentUser.uid;
    } else if (filterAssignee === "unassigned") {
      return !task.assigneeId;
    } else if (filterAssignee !== "all") {
      return task.assigneeId === filterAssignee;
    }

    return true;
  });

  const completedCount = tasksList.filter((t) => t.completed).length;
  const completionPercentage =
    tasksList.length > 0 ? Math.round((completedCount / tasksList.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Workspace Header Banner */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors shrink-0"
              title="Back to all tasks"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">
                  {workspace.title}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                  Shared Task List
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-muted text-muted-foreground font-semibold">
                  {workspace.joinCode}
                </span>
              </div>
              {workspace.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Collaborators Stack */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted border border-border transition-colors text-xs font-semibold text-foreground"
            >
              <div className="flex -space-x-2 overflow-hidden">
                {membersList.slice(0, 4).map((m, idx) => (
                  <div
                    key={m.userId || idx}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-card flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ backgroundColor: m.avatarColor || "#3B82F6" }}
                    title={`${m.name} (${m.role})`}
                  >
                    {m.name.slice(0, 1).toUpperCase()}
                  </div>
                ))}
              </div>
              <span>{membersList.length} Members</span>
            </button>

            <button
              onClick={() => setShowActivityDrawer(true)}
              className="px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <History className="w-4 h-4 text-primary" />
              <span>Activity Log</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Share &amp; Invite</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-2 border-t border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              <strong>{completedCount}</strong> of <strong>{tasksList.length}</strong> tasks completed ({completionPercentage}%)
            </span>
          </div>
          <div className="w-36 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks or assignees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-xs"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="completed">Completed Only</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-xs"
          >
            <option value="all">All Assignees</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned</option>
            {membersList.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Add Task Trigger */}
          {!isViewer && (
            <button
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity whitespace-nowrap shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Shared Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Task Inline Form */}
      {isAddingTask && !isViewer && (
        <form
          onSubmit={handleCreateTask}
          className="p-5 rounded-2xl bg-card border-2 border-primary/40 shadow-md space-y-4 animate-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <span>New Shared Task</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 md:col-span-2">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <input
                type="text"
                placeholder="Description or notes (optional)..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Assignee Selection */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3 text-primary" />
                <span>Assign to Collaborator</span>
              </label>
              <select
                value={newAssigneeId}
                onChange={(e) => setNewAssigneeId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Unassigned (Open to anyone)</option>
                {membersList.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} ({m.role}) {m.userId === currentUser.uid ? "- (Me)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority (Urgent)</option>
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="academic">Academic / Classwork</option>
                <option value="homework">Homework / Assignment</option>
                <option value="exam">Exam Preparation</option>
                <option value="project">Group Project</option>
                <option value="personal">Personal / Team Goal</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
            >
              Add to Shared List
            </button>
          </div>
        </form>
      )}

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-2xl border border-border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-foreground">No tasks found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery || filterAssignee !== "all" || filterStatus !== "all"
                ? "No tasks match your current filters. Try changing or clearing filters."
                : "This shared list is currently empty. Click 'Add Shared Task' to create collaborative assignments."}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isAssignedToMe = task.assigneeId === currentUser.uid;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all bg-card ${
                  task.completed
                    ? "border-border/60 bg-muted/20 opacity-75"
                    : isAssignedToMe
                    ? "border-primary/40 shadow-xs ring-1 ring-primary/10"
                    : "border-border hover:border-border/80 shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      disabled={isViewer}
                      className={`mt-0.5 p-1 rounded-lg transition-colors ${
                        task.completed
                          ? "text-emerald-500 hover:text-emerald-600"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-semibold truncate ${
                            task.completed
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            task.priority === "high"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : task.priority === "medium"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* Category Badge */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground capitalize">
                          {task.category}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Meta info footer */}
                      <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground pt-1">
                        {task.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{task.date}</span>
                          </span>
                        )}

                        {/* Assignee Badge with Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold text-foreground">Assignee:</span>
                          {!isViewer ? (
                            <select
                              value={task.assigneeId || ""}
                              onChange={(e) => handleReassign(task, e.target.value)}
                              className="px-2 py-0.5 bg-background border border-border rounded-lg text-[11px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                              <option value="">Unassigned</option>
                              {membersList.map((m) => (
                                <option key={m.userId} value={m.userId}>
                                  {m.name} {m.userId === currentUser.uid ? "(Me)" : ""}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-medium">
                              {task.assigneeName || "Unassigned"}
                            </span>
                          )}
                        </div>

                        {task.completedBy && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ Done by {task.completedBy.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task Delete */}
                  {!isViewer && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Share Modal */}
      <ShareWorkspaceModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        workspace={workspace}
        currentUser={currentUser}
        onWorkspaceUpdated={onWorkspaceUpdated}
      />

      {/* Activity Log Drawer */}
      <ActivityLogDrawer
        isOpen={showActivityDrawer}
        onClose={() => setShowActivityDrawer(false)}
        workspace={workspace}
      />
    </div>
  );
};
