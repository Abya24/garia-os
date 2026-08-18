import React, { useState } from "react";
import {
  X,
  Link2,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { SharedWorkspace } from "../../types";
import { joinWorkspaceByCode } from "../../utils/collaborationEngine";

interface JoinWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  };
  onJoined: (workspace: SharedWorkspace) => void;
  initialCode?: string;
}

export const JoinWorkspaceModal: React.FC<JoinWorkspaceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onJoined,
  initialCode = "",
}) => {
  const [codeInput, setCodeInput] = useState(initialCode);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;

    setIsJoining(true);
    setErrorMsg(null);

    try {
      // Extract join code if full URL was pasted
      let targetCode = codeInput.trim();
      if (targetCode.includes("join=")) {
        const urlParams = new URLSearchParams(targetCode.split("?")[1] || "");
        targetCode = urlParams.get("join") || targetCode;
      }

      const res = await joinWorkspaceByCode(targetCode, currentUser);
      if (res.success && res.workspace) {
        onJoined(res.workspace);
        onClose();
      } else {
        setErrorMsg(res.error || "Could not find or join the specified workspace.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to join workspace.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Join Shared Workspace
              </h3>
              <p className="text-xs text-muted-foreground">
                Collaborate on shared tasks or study notes
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

        <form onSubmit={handleJoin} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Enter 6-Character Join Code or Paste Link</span>
              <span className="text-primary font-mono text-[11px]">e.g. G-8X39K2</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Paste code or link here..."
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl font-mono text-base tracking-wider text-foreground placeholder:text-muted-foreground placeholder:font-sans placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                autoFocus
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs flex items-center gap-2 border border-destructive/20 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Instant Team Collaboration</span>
            </div>
            <p>
              Joining gives you access to real-time shared tasks, live note editing, and team progress tracking.
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
              disabled={isJoining || !codeInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <span>{isJoining ? "Joining..." : "Join Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
