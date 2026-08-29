import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Sparkles,
  X,
  Share2,
  ArrowLeft,
  Filter,
  Users,
  Link2,
  Clock,
  BookOpen,
} from "lucide-react";
import { Note, ActiveTab, SharedWorkspace, WorkspaceMember } from "../types";
import { auth } from "../utils/firebase";
import {
  subscribeToUserWorkspaces,
  updateSharedNotesInWorkspace,
} from "../utils/collaborationEngine";
import { CreateSharedWorkspaceModal } from "../components/collaboration/CreateSharedWorkspaceModal";
import { JoinWorkspaceModal } from "../components/collaboration/JoinWorkspaceModal";
import { SharedNotesWorkspaceView } from "../components/collaboration/SharedNotesWorkspaceView";

interface NotesPageProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onAskAbyaWithContext: (contextText: string) => void;
  onBack?: () => void;
  currentUserId?: string;
  currentUserName?: string;
  currentUserEmail?: string;
}

export const NotesPage: React.FC<NotesPageProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAskAbyaWithContext,
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pinned" | "recent">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);

  const userObj = {
    uid: auth.currentUser?.uid || currentUserId || "garia_student_user",
    displayName: auth.currentUser?.displayName || currentUserName || "Student User",
    email: auth.currentUser?.email || currentUserEmail || "student@garia.os",
  };

  // Subscribe to collaborative notes workspaces
  useEffect(() => {
    const unsubscribe = subscribeToUserWorkspaces(userObj.uid, (workspaces) => {
      const notesWorkspaces = workspaces.filter((w) => w.type === "notes");
      setSharedWorkspaces(notesWorkspaces);

      if (selectedWorkspace) {
        const updatedSelected = notesWorkspaces.find((w) => w.id === selectedWorkspace.id);
        if (updatedSelected) {
          setSelectedWorkspace(updatedSelected);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userObj.uid, selectedWorkspace?.id]);

  const handleOpenAdd = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setPinned(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setPinned(note.pinned);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingNote) {
      onUpdateNote({
        ...editingNote,
        title: title.trim(),
        content: content.trim(),
        pinned,
        updatedAt: Date.now(),
      });
    } else {
      onAddNote({
        title: title.trim(),
        content: content.trim(),
        pinned,
      });
    }

    setIsModalOpen(false);
  };

  // Share a personal note into a collaborative notes workspace
  const handleShareNoteToWorkspace = async (note: Note, ws: SharedWorkspace) => {
    try {
      const existingContent = ws.noteContent || "";
      const newContent = `${existingContent ? existingContent + "\n\n---\n\n" : ""}# ${note.title}\n\n${note.content}`;
      const updated = await updateSharedNotesInWorkspace(
        ws,
        { noteContent: newContent },
        userObj
      );
      setSelectedWorkspace(updated);
      setActiveViewMode("workspaces");
    } catch (err) {
      console.error("Failed to share note to workspace:", err);
    }
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedFilter === "pinned") return n.pinned;
    if (selectedFilter === "recent") return Date.now() - n.createdAt <= 86400000 * 7;
    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned);

  // If a specific shared workspace is actively open, render its dedicated collaborative view
  if (selectedWorkspace) {
    return (
      <SharedNotesWorkspaceView
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
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Notes & Docs
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Capture study summaries or collaborate in real-time on shared documents.
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Actions */}
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
              Personal Notes ({notes.length})
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
              <span>Shared Docs ({sharedWorkspaces.length})</span>
            </button>
          </div>

          {activeViewMode === "personal" ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Note</span>
            </button>
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
                <span>Create Shared Doc</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SHARED DOCS WORKSPACES TAB CONTENT */}
      {activeViewMode === "workspaces" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white font-heading">
                Shared Collaborative Docs
              </h2>
              <p className="text-xs text-slate-400">
                Live multi-user revision notes, cheat sheets, and study material.
              </p>
            </div>
          </div>

          {sharedWorkspaces.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-white/10 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-heading">
                  No Shared Documents Yet
                </h3>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Create a collaborative document for group study, shared summaries, or formula compilation, or enter a join code from a classmate.
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
                  Create Shared Document
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedWorkspaces.map((ws) => {
                const members = Object.values(ws.members || {}) as WorkspaceMember[];
                const isOwner = ws.ownerId === userObj.uid;
                const contentLength = ws.noteContent?.length || 0;
                const wordCount = ws.noteContent ? ws.noteContent.trim().split(/\s+/).length : 0;

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

                      {/* Content preview snippet */}
                      <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-white/5 line-clamp-3 font-mono">
                        {ws.noteContent ? ws.noteContent.slice(0, 150) : "Empty document... Tap to write collaboratively."}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{wordCount} words</span>
                        <span>{members.length} collaborator{members.length !== 1 ? "s" : ""}</span>
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
                          Edit Document →
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

      {/* PERSONAL NOTES TAB CONTENT */}
      {activeViewMode === "personal" && (
        <>
          {/* Search Bar & Dropdown Filter */}
          <div className="glass-card p-3 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-pill text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/10"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl glass-pill text-xs font-bold text-emerald-300 border border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-slate-900 shadow-sm"
              >
                <option value="all" className="bg-slate-900 text-white">All Notes ({notes.length})</option>
                <option value="pinned" className="bg-slate-900 text-white">Pinned Notes Only</option>
                <option value="recent" className="bg-slate-900 text-white">Recent Notes (Last 7 Days)</option>
              </select>
            </div>
          </div>

          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-heading">
                <Pin className="w-3.5 h-3.5 fill-emerald-400" />
                <span>Pinned Notes</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    sharedWorkspaces={sharedWorkspaces}
                    onEdit={handleOpenEdit}
                    onDelete={onDeleteNote}
                    onTogglePin={(n) => onUpdateNote({ ...n, pinned: !n.pinned })}
                    onAskAbya={onAskAbyaWithContext}
                    onShareToWorkspace={(ws) => handleShareNoteToWorkspace(note, ws)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Notes Section */}
          <div className="space-y-3">
            {pinnedNotes.length > 0 && (
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">
                All Notes
              </h3>
            )}

            {filteredNotes.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center border border-white/10 my-8">
                <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <h3 className="font-bold text-white font-heading text-lg">
                  No notes found
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Create your first revision note or summary using the button above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    sharedWorkspaces={sharedWorkspaces}
                    onEdit={handleOpenEdit}
                    onDelete={onDeleteNote}
                    onTogglePin={(n) => onUpdateNote({ ...n, pinned: !n.pinned })}
                    onAskAbya={onAskAbyaWithContext}
                    onShareToWorkspace={(ws) => handleShareNoteToWorkspace(note, ws)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Note Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="w-full max-w-xl glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white">
                {editingNote ? "Edit Note" : "Create New Note"}
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
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Note Title (e.g., Chapter 4 Ratio Analysis Formulas)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Content
                </label>
                <textarea
                  rows={8}
                  placeholder="Write your study notes, formulas, or markdown summary here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="pinCheck" className="text-slate-300 cursor-pointer">
                  Pin this note to top
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-pill text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Shared Workspace Modal */}
      <CreateSharedWorkspaceModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
        defaultType="notes"
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

// Subcomponent NoteCard
const NoteCard: React.FC<{
  note: Note;
  sharedWorkspaces: SharedWorkspace[];
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (note: Note) => void;
  onAskAbya: (context: string) => void;
  onShareToWorkspace: (ws: SharedWorkspace) => void;
}> = ({
  note,
  sharedWorkspaces,
  onEdit,
  onDelete,
  onTogglePin,
  onAskAbya,
  onShareToWorkspace,
}) => {
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-bold text-base text-white font-heading line-clamp-1">
            {note.title}
          </h4>
          <button
            onClick={() => onTogglePin(note)}
            className={`p-1.5 rounded-lg transition-colors ${
              note.pinned
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-slate-500 hover:text-slate-300"
            }`}
            title={note.pinned ? "Unpin Note" : "Pin Note"}
          >
            <Pin className={`w-4 h-4 ${note.pinned ? "fill-emerald-400" : ""}`} />
          </button>
        </div>

        <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-6 font-mono leading-relaxed">
          {note.content}
        </p>
      </div>

      <div className="pt-4 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onAskAbya(`Notes context: "${note.title}"\n${note.content}`)
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all text-[11px] font-semibold"
            title="Send note to Abya AI for explanation or revision quiz"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Ask Abya AI</span>
          </button>

          {sharedWorkspaces.length > 0 && (
            <select
              onChange={(e) => {
                const targetWs = sharedWorkspaces.find((w) => w.id === e.target.value);
                if (targetWs) {
                  onShareToWorkspace(targetWs);
                }
              }}
              defaultValue=""
              className="px-2 py-1 bg-slate-800 border border-white/10 rounded-xl text-[11px] text-slate-300 focus:outline-none cursor-pointer"
              title="Copy to shared doc"
            >
              <option value="" disabled>Share to Doc ▾</option>
              {sharedWorkspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

