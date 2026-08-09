import React, { useState } from "react";
import { Flame, Plus, CheckCircle2, Clock, BookOpen, AlertCircle, Trash2 } from "lucide-react";
import { AcademicVVITopic, AcademicSubject, AcademicChapter, ChapterPriority } from "../types";

interface AcademicVVITopicSectionProps {
  vviTopics: AcademicVVITopic[];
  subjects: AcademicSubject[];
  chapters: AcademicChapter[];
  onAddVVITopic: (topic: Omit<AcademicVVITopic, "id" | "createdAt">) => void;
  onUpdateVVITopic: (id: string, updates: Partial<AcademicVVITopic>) => void;
  onDeleteVVITopic: (id: string) => void;
}

export const AcademicVVITopicSection: React.FC<AcademicVVITopicSectionProps> = ({
  vviTopics,
  subjects,
  chapters,
  onAddVVITopic,
  onUpdateVVITopic,
  onDeleteVVITopic,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state
  const [formSubjectId, setFormSubjectId] = useState<string>(subjects[0]?.id || "");
  const [formChapterTitle, setFormChapterTitle] = useState<string>("");
  const [formTopicName, setFormTopicName] = useState<string>("");
  const [formPriority, setFormPriority] = useState<ChapterPriority>("VVI");
  const [formNotes, setFormNotes] = useState<string>("");

  const filteredTopics = vviTopics.filter((t) =>
    selectedSubjectId === "ALL" ? true : t.subjectId === selectedSubjectId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChapterTitle || !formTopicName) return;

    const sub = subjects.find((s) => s.id === formSubjectId);
    onAddVVITopic({
      subjectId: formSubjectId,
      subjectName: sub ? sub.name : "Subject",
      chapterTitle: formChapterTitle,
      topicName: formTopicName,
      priority: formPriority,
      status: "In Progress",
      revisionCount: 0,
      notes: formNotes || "High Priority / Suggested Focus topic",
    });

    setFormChapterTitle("");
    setFormTopicName("");
    setFormNotes("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-900/40 via-amber-900/30 to-slate-900/80 border border-rose-500/30 backdrop-blur-md shadow-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" /> High Priority / Suggested Focus
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">VVI Topic System</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Suggested focus topics for maximum mark density in board and entrance examinations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-lg transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add VVI Topic
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedSubjectId("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedSubjectId === "ALL"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200"
          }`}
        >
          All Subjects ({vviTopics.length})
        </button>
        {subjects.map((sub) => {
          const count = vviTopics.filter((t) => t.subjectId === sub.id).length;
          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSubjectId === sub.id
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200"
              }`}
            >
              {sub.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Topics List */}
      {filteredTopics.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Flame className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No VVI Topics for this filter</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Mark high-priority chapters or topics as VVI to highlight them for revision and practice.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium border border-slate-700 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add VVI Topic
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                topic.status === "Completed"
                  ? "bg-slate-900/40 border-slate-800/80 opacity-80"
                  : "bg-slate-900/80 border-slate-800 hover:border-rose-500/40"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    🔥 VVI / Suggested Focus
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        onUpdateVVITopic(topic.id, {
                          status: topic.status === "Completed" ? "In Progress" : "Completed",
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        topic.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 border border-slate-700"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {topic.status === "Completed" ? "Done" : "Mark Done"}
                    </button>
                    <button
                      onClick={() => onDeleteVVITopic(topic.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete topic"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-purple-400 font-medium">{topic.subjectName}</span>
                  <h3 className="font-bold text-slate-100 text-base">{topic.chapterTitle}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Topic: {topic.topicName}</p>
                </div>

                {topic.notes && (
                  <p className="text-xs text-slate-400 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 italic">
                    "{topic.notes}"
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Revisions: {topic.revisionCount}</span>
                <span className="text-[10px] text-slate-500">
                  Disclaimer: Suggested Focus based on priority scoring
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-400" /> Add New VVI Topic
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Chapter Title</label>
                <input
                  type="text"
                  placeholder="e.g. Electrostatics & Electric Charges"
                  value={formChapterTitle}
                  onChange={(e) => setFormChapterTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Topic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gauss's Law Applications"
                  value={formTopicName}
                  onChange={(e) => setFormTopicName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Priority</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as ChapterPriority)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="VVI">🔥 VVI (Very Very Important)</option>
                  <option value="Important">⚡ Important</option>
                  <option value="Normal">📘 Normal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes / Key Focus</label>
                <textarea
                  placeholder="e.g. Must practice 5-mark numericals"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium"
                >
                  Save VVI Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
