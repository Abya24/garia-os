import React, { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  UserPlus,
  Shield,
  Trash2,
  Users,
  Link2,
  Lock,
  Globe,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  SharedWorkspace,
  CollaborationRole,
  WorkspaceMember,
} from "../../types";
import {
  generateShareableLink,
  inviteCollaboratorToWorkspace,
  updateMemberRoleInWorkspace,
  removeMemberFromWorkspace,
} from "../../utils/collaborationEngine";

interface ShareWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: SharedWorkspace | null;
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  };
  onWorkspaceUpdated: (updated: SharedWorkspace) => void;
}

export const ShareWorkspaceModal: React.FC<ShareWorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspace,
  currentUser,
  onWorkspaceUpdated,
}) => {
  const [inviteInput, setInviteInput] = useState("");
  const [inviteRole, setInviteRole] = useState<CollaborationRole>("editor");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen || !workspace) return null;

  const isOwner = workspace.ownerId === currentUser.uid;
  const currentMember = workspace.members[currentUser.uid];
  const userRole = isOwner ? "owner" : currentMember?.role || "viewer";
  const canManageMembers = isOwner || userRole === "editor";

  const shareLink = generateShareableLink(workspace.joinCode);
  const membersList: WorkspaceMember[] = Object.values(workspace.members);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(workspace.joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    setIsInviting(true);
    setFeedbackMsg(null);
    try {
      const res = await inviteCollaboratorToWorkspace(
        workspace,
        inviteInput.trim(),
        inviteRole,
        currentUser
      );
      onWorkspaceUpdated(res.workspace);
      setInviteInput("");
      setFeedbackMsg({
        type: "success",
        text: `Collaborator invitation sent with ${inviteRole.toUpperCase()} permissions!`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to send invitation.",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: CollaborationRole) => {
    if (!isOwner) return;
    try {
      const updated = await updateMemberRoleInWorkspace(
        workspace,
        targetUserId,
        newRole,
        currentUser
      );
      onWorkspaceUpdated(updated);
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!isOwner) return;
    if (targetUserId === workspace.ownerId) return;
    if (window.confirm("Are you sure you want to remove this collaborator?")) {
      try {
        const updated = await removeMemberFromWorkspace(
          workspace,
          targetUserId,
          currentUser
        );
        onWorkspaceUpdated(updated);
      } catch (err) {
        console.error("Failed to remove member:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  Share &amp; Collaborate
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary uppercase">
                  {workspace.type === "tasks" ? "Task List" : "Notes Doc"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-xs">
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Join Code & Link Card */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Unique Join Code
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Enter in Garia OS to join instantly
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl font-mono text-base font-bold tracking-wider text-primary flex items-center justify-between">
                <span>{workspace.joinCode}</span>
                <span className="text-xs font-normal text-muted-foreground font-sans">
                  Active Share Code
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3.5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct Link Share */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground gap-2">
              <span className="truncate max-w-[280px]">
                {shareLink}
              </span>
              <button
                onClick={handleCopyLink}
                className="text-primary hover:underline font-medium flex items-center gap-1 shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Invite User Section */}
          {canManageMembers && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Invite Collaborator</span>
              </div>

              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter student email or username..."
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />

                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as CollaborationRole)}
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-medium"
                >
                  <option value="editor">Editor (Full Access)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>

                <button
                  type="submit"
                  disabled={isInviting || !inviteInput.trim()}
                  className="px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isInviting ? "Inviting..." : "Send Invite"}</span>
                </button>
              </form>

              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    feedbackMsg.type === "success"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  {feedbackMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{feedbackMsg.text}</span>
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Collaborators ({membersList.length})</span>
              </div>
              <span className="text-xs text-muted-foreground font-normal">
                {isOwner ? "You are Owner" : `Your Role: ${userRole.toUpperCase()}`}
              </span>
            </div>

            <div className="space-y-2 border border-border rounded-xl p-2 bg-muted/10 divide-y divide-border/50">
              {membersList.map((member) => {
                const isMemberOwner = member.role === "owner" || member.userId === workspace.ownerId;
                const isSelf = member.userId === currentUser.uid;

                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-2.5 pt-3 first:pt-2.5 hover:bg-muted/30 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                        style={{ backgroundColor: member.avatarColor || "#3B82F6" }}
                      >
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {member.name}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOwner && !isMemberOwner ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.userId, e.target.value as CollaborationRole)
                          }
                          className="px-2 py-1 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 ${
                            isMemberOwner
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : member.role === "editor"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span className="capitalize">{member.role}</span>
                        </span>
                      )}

                      {isOwner && !isMemberOwner && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          title="Remove collaborator"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permissions Guide Info */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Permission Controls &amp; Security</span>
            </div>
            <p>
              • <strong>Owner:</strong> Full control. Can manage collaborators, assign roles, edit content, and delete workspace.
            </p>
            <p>
              • <strong>Editor:</strong> Can create, edit, assign &amp; complete tasks, update notes, and post comments.
            </p>
            <p>
              • <strong>Viewer:</strong> Read-only access with live real-time synchronization and activity stream.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border bg-muted/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-secondary-foreground font-medium text-sm rounded-xl hover:bg-secondary/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
