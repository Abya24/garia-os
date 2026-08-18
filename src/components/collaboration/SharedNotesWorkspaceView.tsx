import React, { useState, useEffect, useRef } from "react";
import {
  Share2,
  History,
  Users,
  Shield,
  ArrowLeft,
  Save,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Tag,
  Plus,
  X,
} from "lucide-react";
import { SharedWorkspace, WorkspaceMember } from "../../types";
import { updateSharedNotesInWorkspace } from "../../utils/collaborationEngine";
import { ShareWorkspaceModal } from "./ShareWorkspaceModal";
import { ActivityLogDrawer } from "./ActivityLogDrawer";

interface SharedNotesWorkspaceViewProps {
  workspace: SharedWorkspace;
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  };
  onBack: () => void;
  onWorkspaceUpdated: (updated: SharedWorkspace) => void;
}

export const SharedNotesWorkspaceView: React.FC<SharedNotesWorkspaceViewProps> = ({
  workspace,
  currentUser,
  onBack,
  onWorkspaceUpdated,
}) => {
  const [title, setTitle] = useState(workspace.title);
  const [content, setContent] = useState(workspace.noteContent || "");
  const [tags, setTags] = useState<string[]>(workspace.noteTags || []);
  const [newTagInput, setNewTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOwner = workspace.ownerId === currentUser.uid;
  const currentMember = workspace.members[currentUser.uid];
  const userRole = isOwner ? "owner" : currentMember?.role || "viewer";
  const isViewer = userRole === "viewer";

  const membersList: WorkspaceMember[] = Object.values(workspace.members);

  // Sync external changes from props if not currently typing
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setTitle(workspace.title);
      setContent(workspace.noteContent || "");
      setTags(workspace.noteTags || []);
    }
  }, [workspace, hasUnsavedChanges]);

  // Debounced auto-save function
  const triggerAutoSave = (newTitle: string, newContent: string, newTags: string[]) => {
    if (isViewer) return;
    setHasUnsavedChanges(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const updated = await updateSharedNotesInWorkspace(
          workspace,
          {
            title: newTitle.trim(),
            noteContent: newContent,
            noteTags: newTags,
          },
          currentUser
        );
        onWorkspaceUpdated(updated);
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 1200);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content, tags);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    triggerAutoSave(title, val, tags);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().replace(/^#/, "");
      if (!tags.includes(cleanTag)) {
        const updatedTags = [...tags, cleanTag];
        setTags(updatedTags);
        setNewTagInput("");
        triggerAutoSave(title, content, updatedTags);
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (isViewer) return;
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    triggerAutoSave(title, content, updatedTags);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors shrink-0"
              title="Back to notes"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                  Shared Study Notes
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-muted text-muted-foreground font-semibold">
                  {workspace.joinCode}
                </span>
                {isSaving ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Save className="w-3 h-3 animate-spin" />
                    <span>Syncing cloud...</span>
                  </span>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Saved</span>
                  </span>
                )}
              </div>

              {workspace.lastModifiedBy && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last edited by{" "}
                  <strong>{workspace.lastModifiedBy.name}</strong> •{" "}
                  {new Date(workspace.updatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
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
              <span>{membersList.length} Collaborators</span>
            </button>

            <button
              onClick={() => setShowActivityDrawer(true)}
              className="px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <History className="w-4 h-4 text-primary" />
              <span>Audit Log</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Note</span>
            </button>
          </div>
        </div>

        {/* Tags Row */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-lg bg-muted text-xs text-foreground font-medium flex items-center gap-1"
            >
              #{tag}
              {!isViewer && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-destructive text-muted-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}

          {!isViewer && (
            <input
              type="text"
              placeholder="+ Add tag (Press Enter)"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="px-2 py-0.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-36"
            />
          )}
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        {/* Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            disabled={isViewer}
            placeholder="Untitled Document..."
            className="w-full text-2xl font-bold bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          />
        </div>

        {/* Text Area Body */}
        <div className="min-h-[400px]">
          <textarea
            value={content}
            onChange={handleContentChange}
            disabled={isViewer}
            placeholder="Type your collaborative notes here... Markdown syntax (# Heading, - List, **Bold**) is supported."
            className="w-full min-h-[420px] p-4 bg-background/50 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          />
        </div>
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
