import React, { useState } from "react";
import {
  X,
  Plus,
  CheckSquare,
  FileText,
  Users,
  Sparkles,
  Shield,
} from "lucide-react";
import { SharedWorkspace, WorkspaceType } from "../../types";
import { createSharedWorkspace } from "../../utils/collaborationEngine";

interface CreateSharedWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: WorkspaceType;
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  };
  onCreated: (workspace: SharedWorkspace) => void;
}

export const CreateSharedWorkspaceModal: React.FC<CreateSharedWorkspaceModalProps> = ({
  isOpen,
  onClose,
  defaultType = "tasks",
  currentUser,
  onCreated,
}) => {
  const [type, setType] = useState<WorkspaceType>(defaultType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const newWs = await createSharedWorkspace({
        type,
        title: title.trim(),
        description: description.trim(),
        currentUser,
        initialNoteContent:
          type === "notes"
            ? `# ${title.trim()}\n\n*Created by ${
                currentUser.displayName || "Student"
              } on ${new Date().toLocaleDateString()}*\n\n### Overview & Key Points\n- Write shared study notes or formula summaries here...\n- Teammates can view or edit in real-time.\n`
            : "",
      });

      onCreated(newWs);
      onClose();
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                New Shared Workspace
              </h3>
              <p className="text-xs text-muted-foreground">
                Create a collaborative task list or study notes doc
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Workspace Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Workspace Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("tasks")}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  type === "tasks"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    type === "tasks"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    Shared Task List
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Assign tasks to team members &amp; track progress
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType("notes")}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  type === "notes"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    type === "notes"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    Collaborative Notes
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live notes doc, cheat sheets, &amp; study summaries
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Workspace Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder={
                type === "tasks"
                  ? "e.g. Board Exam Physics Group, Hackathon Tasks"
                  : "e.g. Organic Chemistry Reactions Cheat Sheet"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Description / Objective (Optional)
            </label>
            <textarea
              placeholder="Add goals, instructions, or group rules..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-xs"
            />
          </div>

          {/* Information box */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Permission Defaults</span>
            </div>
            <p>
              You will be the <strong>Owner</strong>. You can share unique join links or invite teammates with <strong>Editor</strong> or <strong>Viewer</strong> roles.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <span>{isSubmitting ? "Creating..." : "Create Workspace"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
