import React, { useState, useRef } from "react";
import {
  X,
  User,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  Download,
  Upload,
  Users,
  Sparkles,
  ShieldAlert,
  GraduationCap,
  ArrowRight,
  Globe,
  BookOpen,
} from "lucide-react";
import { StudentProfile, StreamType, ExamBoard } from "../types";
import { StreamSelector } from "./StreamSelector";
import { APP_VERSION } from "../constants/version";
import { AppLanguage, translations, saveStoredLanguage } from "../utils/i18n";

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: StudentProfile[];
  activeProfile: StudentProfile;
  onSwitchProfile: (profileId: string) => void;
  onAddProfile: (profileData: Omit<StudentProfile, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateProfile: (profile: StudentProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onExportProfile: (profileId: string) => void;
  onImportProfile: (jsonString: string) => void;
}

const AVATAR_GRADIENTS = [
  { label: "Cyan Emerald", value: "from-cyan-500 to-emerald-500" },
  { label: "Purple Indigo", value: "from-purple-500 to-indigo-500" },
  { label: "Amber Orange", value: "from-amber-500 to-orange-500" },
  { label: "Rose Pink", value: "from-rose-500 to-pink-500" },
  { label: "Blue Cyan", value: "from-blue-500 to-cyan-500" },
  { label: "Emerald Teal", value: "from-emerald-500 to-teal-500" },
];

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfile,
  onSwitchProfile,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
  onExportProfile,
  onImportProfile,
}) => {
  const [activeTab, setActiveTab] = useState<"list" | "add" | "edit">("list");
  const [editingProfile, setEditingProfile] = useState<StudentProfile | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [classLevel, setClassLevel] = useState("Class 10");
  const [stream, setStream] = useState<StreamType>("General");
  const [board, setBoard] = useState<ExamBoard | string>("CBSE");
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [avatarColor, setAvatarColor] = useState(AVATAR_GRADIENTS[0].value);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setClassLevel("Class 10");
    setStream("General");
    setBoard("CBSE");
    setLanguage("en");
    setAvatarColor(AVATAR_GRADIENTS[0].value);
    setEditingProfile(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setActiveTab("add");
  };

  const handleStartEdit = (p: StudentProfile) => {
    setEditingProfile(p);
    setName(p.name);
    setClassLevel(p.classLevel);
    setStream(p.classLevel === "Class 10" ? "General" : (p.stream === "General" ? "Science" : p.stream));
    setBoard(p.board);
    setLanguage(p.language || "en");
    setAvatarColor(p.avatarColor || AVATAR_GRADIENTS[0].value);
    setActiveTab("edit");
  };

  const handleClassChange = (newClass: string) => {
    setClassLevel(newClass);
    if (newClass === "Class 10") {
      setStream("General");
    } else if (stream === "General") {
      setStream("Science");
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalStream: StreamType = classLevel === "Class 10" ? "General" : stream;
    onAddProfile({
      name: name.trim(),
      classLevel,
      stream: finalStream,
      board,
      language,
      avatarColor,
    });
    saveStoredLanguage(language);
    resetForm();
    setActiveTab("list");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !name.trim()) return;
    const finalStream: StreamType = classLevel === "Class 10" ? "General" : stream;
    onUpdateProfile({
      ...editingProfile,
      name: name.trim(),
      classLevel,
      stream: finalStream,
      board,
      language,
      avatarColor,
    });
    saveStoredLanguage(language);
    resetForm();
    setActiveTab("list");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onImportProfile(content);
          setActiveTab("list");
        }
      };
      reader.readAsText(file);
    }
  };

  const t = translations[language];

  return (
    <div
      id="student-profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="student-profile-modal-card"
        className="relative w-full max-w-2xl glass-card rounded-3xl border border-emerald-500/30 p-4 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/10 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <img
                src="/icon.svg"
                alt="Garia OS Logo"
                className="w-full h-full object-contain rounded-[12px]"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                Student Profiles
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  v{APP_VERSION}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Switch, manage, and isolate student intelligence environments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation */}
        <div className="flex items-center gap-2 my-4 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "list"
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Profiles ({profiles.length})
          </button>
          <button
            onClick={handleStartAdd}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "add"
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Student
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Import JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* LIST TAB */}
          {activeTab === "list" && (
            <div className="space-y-3">
              {profiles.map((p) => {
                const isActive = p.id === activeProfile.id;
                const isDeleteConfirm = deleteConfirmId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-transparent border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                        : "bg-slate-900/40 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${
                          p.avatarColor || "from-cyan-500 to-emerald-500"
                        } p-0.5 flex items-center justify-center shadow-md text-white font-bold text-lg font-heading shrink-0`}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-base font-heading">
                            {p.name}
                          </h4>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                              Active Environment
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                            {p.classLevel}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {p.classLevel === "Class 10" ? "General Curriculum" : p.stream}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {p.board}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {p.language === "hi" ? "हिन्दी" : "English"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      {!isActive && (
                        <button
                          onClick={() => {
                            onSwitchProfile(p.id);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Switch
                        </button>
                      )}

                      <button
                        onClick={() => handleStartEdit(p)}
                        title="Edit Profile"
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all text-xs flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onExportProfile(p.id)}
                        title="Export JSON Backup"
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 border border-white/10 transition-all text-xs flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {profiles.length > 1 && (
                        <>
                          {isDeleteConfirm ? (
                            <div className="flex items-center gap-1 bg-rose-500/20 p-1 rounded-xl border border-rose-500/40">
                              <span className="text-[10px] text-rose-300 px-1 font-bold">
                                Confirm?
                              </span>
                              <button
                                onClick={() => {
                                  onDeleteProfile(p.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-2 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-bold"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px]"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              title="Delete Profile"
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ADD OR EDIT TAB */}
          {(activeTab === "add" || activeTab === "edit") && (
            <form
              onSubmit={activeTab === "add" ? handleSaveAdd : handleSaveEdit}
              className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-white/10"
            >
              <h4 className="font-bold text-white text-base font-heading flex items-center gap-2">
                {activeTab === "add" ? (
                  <>
                    <UserPlus className="w-4 h-4 text-emerald-400" /> {t.addNewProfileBtn}
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 text-cyan-400" /> Edit Student Profile
                  </>
                )}
              </h4>

              <div className="space-y-3">
                {/* 1. Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.studentNameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.studentNamePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm text-left"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 2. Board */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.boardLabel}
                    </label>
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="CBSE">CBSE Board</option>
                      <option value="ICSE">ICSE / ISC Board</option>
                      <option value="BSEB">BSEB (Bihar Board)</option>
                      <option value="State Board">Other State Board</option>
                    </select>
                  </div>

                  {/* 3. Language */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      {t.languageLabel}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="en">English (English UI)</option>
                      <option value="hi">हिन्दी (Hindi UI)</option>
                    </select>
                  </div>

                  {/* 4. Class */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.classLabel}
                    </label>
                    <select
                      value={classLevel}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                      <option value="Dropper / Gap Year">Dropper / Gap Year</option>
                    </select>
                  </div>
                </div>

                {/* Class Logic: Class 10 -> No Stream Selection; Class 11/12 -> Stream Selection */}
                {classLevel === "Class 10" ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 text-xs text-slate-300 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <BookOpen className="w-4 h-4" />
                      {t.noStreamNeededClass10}
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Subjects: Mathematics, Science (Physics/Chemistry/Biology), Social Science, English, Hindi.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        {t.streamLabel} (Required for {classLevel})
                      </label>
                      <span className="text-[10px] text-cyan-400 font-medium">
                        {t.streamHelperText}
                      </span>
                    </div>
                    <StreamSelector
                      selectedStream={stream === "General" ? "Science" : stream}
                      onSelectStream={(s) => setStream(s)}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Avatar Theme Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_GRADIENTS.map((g) => (
                      <button
                        type="button"
                        key={g.value}
                        onClick={() => setAvatarColor(g.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${
                          avatarColor === g.value
                            ? "border-emerald-400 bg-white/10 text-white shadow-md"
                            : "border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${g.value}`}
                        />
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {activeTab === "add" ? t.saveProfileBtn : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
          <span>Active Profile ID: {activeProfile.id}</span>
          <span>Per-student isolated storage active</span>
        </div>
      </div>
    </div>
  );
};

