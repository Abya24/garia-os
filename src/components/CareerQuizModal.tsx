import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Brain,
  X,
  Compass,
  Star,
  BookOpen,
  Zap,
  Check,
} from "lucide-react";
import { CareerQuizAnswers, StreamType } from "../types";

interface CareerQuizModalProps {
  stream: StreamType;
  studentName: string;
  initialAnswers: CareerQuizAnswers;
  onSaveQuiz: (quiz: CareerQuizAnswers) => void;
  onClose?: () => void;
}

export const CareerQuizModal: React.FC<CareerQuizModalProps> = ({
  stream,
  studentName,
  initialAnswers,
  onSaveQuiz,
  onClose,
}) => {
  const streamSubjectsMap: Record<string, string[]> = {
    Commerce: ["Accountancy", "Economics", "Business Studies", "Mathematics", "English", "Informatics Practices"],
    Science: ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "English"],
    "Arts / Humanities": ["History", "Political Science", "Geography", "Psychology", "Sociology", "Economics", "English"],
    Arts: ["History", "Political Science", "Geography", "Psychology", "Sociology", "Economics", "English"],
  };

  const availableSubjects = streamSubjectsMap[stream] || streamSubjectsMap["Commerce"];

  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>(
    initialAnswers.favoriteSubjects || [availableSubjects[0]]
  );
  const [strongSubjects, setStrongSubjects] = useState<string[]>(
    initialAnswers.strongSubjects || [availableSubjects[0]]
  );
  const [problemSolvingPref, setProblemSolvingPref] = useState<string>(
    initialAnswers.problemSolvingPref || "Practical & Hands-on"
  );
  const [creativityLevel, setCreativityLevel] = useState<number>(initialAnswers.creativityLevel || 3);
  const [communicationLevel, setCommunicationLevel] = useState<number>(initialAnswers.communicationLevel || 3);
  const [numbersInterest, setNumbersInterest] = useState<number>(initialAnswers.numbersInterest || 3);
  const [scienceTechInterest, setScienceTechInterest] = useState<number>(initialAnswers.scienceTechInterest || 3);
  const [businessFinanceInterest, setBusinessFinanceInterest] = useState<number>(initialAnswers.businessFinanceInterest || 3);
  const [lawGovInterest, setLawGovInterest] = useState<number>(initialAnswers.lawGovInterest || 3);
  const [peopleHelpingInterest, setPeopleHelpingInterest] = useState<number>(initialAnswers.peopleHelpingInterest || 3);
  const [researchInterest, setResearchInterest] = useState<number>(initialAnswers.researchInterest || 3);

  const togglePill = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSave = () => {
    const quiz: CareerQuizAnswers = {
      favoriteSubjects,
      strongSubjects,
      problemSolvingPref,
      creativityLevel,
      communicationLevel,
      numbersInterest,
      scienceTechInterest,
      businessFinanceInterest,
      lawGovInterest,
      peopleHelpingInterest,
      researchInterest,
      updatedAt: Date.now(),
    };

    onSaveQuiz(quiz);
    if (onClose) onClose();
  };

  const problemSolvingOptions = [
    { id: "Practical & Hands-on", title: "Practical & Hands-on", desc: "Building, experimenting, coding, or executing direct actions." },
    { id: "Theoretical & Analytical", title: "Theoretical & Analytical", desc: "Formulas, proofs, structured logic, research papers, and deep analysis." },
    { id: "Creative & Visual", title: "Creative & Visual", desc: "Designing, writing, visual media, brand storytelling, and aesthetics." },
    { id: "People & Collaborative", title: "People & Collaborative", desc: "Counseling, teaching, leading teams, community work, and public advocacy." },
  ];

  const ratingCategories = [
    { label: "Numbers & Financial Data", value: numbersInterest, setter: setNumbersInterest, icon: "📊" },
    { label: "Science & Technology", value: scienceTechInterest, setter: setScienceTechInterest, icon: "🔬" },
    { label: "Business & Management", value: businessFinanceInterest, setter: setBusinessFinanceInterest, icon: "💼" },
    { label: "Law & Public Governance", value: lawGovInterest, setter: setLawGovInterest, icon: "⚖️" },
    { label: "Creativity & Design", value: creativityLevel, setter: setCreativityLevel, icon: "🎨" },
    { label: "Communication & Public Speaking", value: communicationLevel, setter: setCommunicationLevel, icon: "🗣️" },
    { label: "Healthcare & Helping People", value: peopleHelpingInterest, setter: setPeopleHelpingInterest, icon: "🩺" },
    { label: "Scientific & Theoretical Research", value: researchInterest, setter: setResearchInterest, icon: "🧪" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-card w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl my-8 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-2.5 flex items-center justify-center text-slate-950 font-bold shadow-lg">
              <Brain className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                Career Decision Assessment Quiz
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {stream}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Data isolation active: Saving quiz for <strong className="text-emerald-400">{studentName}</strong>
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Section 1: Favorite Subjects */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            1. Which subjects do you ENJOY studying the most?
          </label>
          <div className="flex flex-wrap gap-2">
            {availableSubjects.map((subj) => {
              const active = favoriteSubjects.includes(subj);
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => togglePill(favoriteSubjects, setFavoriteSubjects, subj)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    active
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md"
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{subj}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Performing Subjects */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            2. Which subjects do you score BEST or grasp concepts fastest in?
          </label>
          <div className="flex flex-wrap gap-2">
            {availableSubjects.map((subj) => {
              const active = strongSubjects.includes(subj);
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => togglePill(strongSubjects, setStrongSubjects, subj)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    active
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md"
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{subj}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Problem Solving Preference */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            3. What is your preferred problem-solving style?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {problemSolvingOptions.map((opt) => {
              const active = problemSolvingPref === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProblemSolvingPref(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    active
                      ? "bg-amber-500/20 border-amber-500/50 text-white shadow-lg"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <div className="font-bold text-sm text-white flex items-center justify-between">
                    <span>{opt.title}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Aptitude & Interest Ratings (1 to 5) */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Star className="w-4 h-4 text-emerald-400" />
            4. Rate your interest / aptitude in key career domains (1 to 5):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ratingCategories.map((cat) => (
              <div
                key={cat.label}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {cat.value} / 5
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => cat.setter(rating)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all border ${
                        cat.value === rating
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                          : "bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700"
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xl hover:brightness-110 transition-all"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Save Assessment & Recalculate Careers</span>
          </button>
        </div>

      </div>
    </div>
  );
};
