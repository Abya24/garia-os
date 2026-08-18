import React, { useState, useEffect } from "react";
import {
  X,
  History,
  CheckCircle2,
  PlusCircle,
  Edit3,
  UserCheck,
  UserMinus,
  FileText,
  Clock,
  Filter,
  Sparkles,
  Link,
} from "lucide-react";
import { ActivityLogItem, SharedWorkspace } from "../../types";
import { subscribeToWorkspaceActivities } from "../../utils/collaborationEngine";

interface ActivityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: SharedWorkspace | null;
}

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({
  isOpen,
  onClose,
  workspace,
}) => {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [filterAction, setFilterAction] = useState<string>("all");

  useEffect(() => {
    if (!isOpen || !workspace) return;

    const unsubscribe = subscribeToWorkspaceActivities(
      workspace.id,
      (newActivities) => {
        setActivities(newActivities);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, workspace?.id]);

  if (!isOpen || !workspace) return null;

  const formatTimeAgo = (timestamp: number): string => {
    const diffMs = Date.now() - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  const getActionIcon = (action: ActivityLogItem["action"]) => {
    switch (action) {
      case "task_created":
        return <PlusCircle className="w-4 h-4 text-primary" />;
      case "task_completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "task_assigned":
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case "notes_updated":
      case "task_updated":
        return <Edit3 className="w-4 h-4 text-amber-500" />;
      case "member_invited":
      case "joined_workspace":
        return <UserCheck className="w-4 h-4 text-indigo-500" />;
      case "member_removed":
        return <UserMinus className="w-4 h-4 text-rose-500" />;
      case "created_workspace":
        return <Sparkles className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filterAction === "all") return true;
    if (filterAction === "tasks") return act.action.startsWith("task_");
    if (filterAction === "members")
      return (
        act.action === "member_invited" ||
        act.action === "joined_workspace" ||
        act.action === "member_removed" ||
        act.action === "member_role_changed"
      );
    if (filterAction === "notes") return act.action === "notes_updated";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-md h-full border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">Activity Log</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {workspace.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-muted/10 overflow-x-auto">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Filter className="w-3 h-3" />
          </span>
          {(["all", "tasks", "members", "notes"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilterAction(key)}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap capitalize ${
                filterAction === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {key === "all" ? "All Activity" : key}
            </button>
          ))}
        </div>

        {/* Activity Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Actions such as creating tasks, assigning teammates, or editing notes will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
              {filteredActivities.map((act) => (
                <div key={act.id} className="relative group">
                  {/* Timeline Node */}
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-colors shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                        {getActionIcon(act.action)}
                        <span className="truncate max-w-[140px]">{act.userName}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0 font-medium">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(act.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/90 leading-relaxed font-normal">
                      {act.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 text-center">
          <span className="text-xs text-muted-foreground">
            Audit logs are recorded automatically for all workspace members.
          </span>
        </div>
      </div>
    </div>
  );
};
