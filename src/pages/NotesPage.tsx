import React, { useState } from "react";
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
} from "lucide-react";
import { Note, ActiveTab } from "../types";

interface NotesPageProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onAskAbyaWithContext: (contextText: string) => void;
  onBack?: () => void;
}

export const NotesPage: React.FC<NotesPageProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAskAbyaWithContext,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pinned" | "recent">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);

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

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              id="notes-back-btn"
              aria-label="Go Back"
              className="p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Notes System
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Capture revision notes, key formulas, and study summaries.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Create Note</span>
        </button>
      </div>

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
                onEdit={handleOpenEdit}
                onDelete={onDeleteNote}
                onTogglePin={(n) => onUpdateNote({ ...n, pinned: !n.pinned })}
                onAskAbya={onAskAbyaWithContext}
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
                onEdit={handleOpenEdit}
                onDelete={onDeleteNote}
                onTogglePin={(n) => onUpdateNote({ ...n, pinned: !n.pinned })}
                onAskAbya={onAskAbyaWithContext}
              />
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
};

// Subcomponent NoteCard
const NoteCard: React.FC<{
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (note: Note) => void;
  onAskAbya: (context: string) => void;
}> = ({ note, onEdit, onDelete, onTogglePin, onAskAbya }) => {
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

      <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
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
