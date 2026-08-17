import React, { useState, useMemo } from "react";
import {
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Bookmark,
  Shuffle,
  HelpCircle,
  Flame,
  Award,
  Zap,
  BookOpen,
} from "lucide-react";
import { FlashcardItem } from "../types";

interface FlashcardDeckPlayerProps {
  flashcards: FlashcardItem[];
  profileId: string;
  masteredIds?: string[];
  bookmarkedIds?: string[];
  onToggleMastered: (cardId: string) => void;
  onToggleBookmark: (cardId: string) => void;
  onAskTutor?: (prompt: string) => void;
}

export const FlashcardDeckPlayer: React.FC<FlashcardDeckPlayerProps> = ({
  flashcards,
  profileId,
  masteredIds = [],
  bookmarkedIds = [],
  onToggleMastered,
  onToggleBookmark,
  onAskTutor,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [shuffledCards, setShuffledCards] = useState<FlashcardItem[]>([]);
  const [isShuffleOn, setIsShuffleOn] = useState<boolean>(false);

  const activePool = useMemo(() => {
    let pool = isShuffleOn && shuffledCards.length > 0 ? shuffledCards : flashcards;
    if (selectedCategory !== "ALL") {
      pool = pool.filter((c) => c.category === selectedCategory);
    }
    return pool;
  }, [flashcards, shuffledCards, isShuffleOn, selectedCategory]);

  const currentCard = activePool[currentIndex] || activePool[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % (activePool.length || 1));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + activePool.length) % (activePool.length || 1));
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setIsShuffleOn(true);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (!currentCard) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 text-center space-y-3">
        <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
        <h4 className="font-bold text-white text-base">No Flashcards Available for this Filter</h4>
        <p className="text-xs text-slate-400">Try changing the subject or category filter above.</p>
      </div>
    );
  }

  const isMastered = masteredIds.includes(currentCard.id);
  const isBookmarked = bookmarkedIds.includes(currentCard.id);
  const totalMasteredInPool = activePool.filter((c) => masteredIds.includes(c.id)).length;
  const masteryPercentage = activePool.length > 0 ? Math.round((totalMasteredInPool / activePool.length) * 100) : 0;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Top Deck Stats & Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "Concept", "High-Yield Point", "Formula"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedCategory === cat
                  ? "bg-purple-600 text-white border-purple-400 shadow-md"
                  : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
              }`}
            >
              {cat === "ALL" ? "All Flashcards" : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleShuffle}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              isShuffleOn
                ? "bg-indigo-600 text-white border-indigo-400"
                : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle Deck
          </button>
        </div>
      </div>

      {/* Progress & Deck Counter */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="font-mono text-slate-400 font-semibold">
          Card <strong className="text-white font-bold">{currentIndex + 1}</strong> of {activePool.length}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {totalMasteredInPool} Mastered ({masteryPercentage}%)
          </span>
        </div>
      </div>

      {/* The Interactive Flip Card */}
      <div
        onClick={() => setIsFlipped((prev) => !prev)}
        className="cursor-pointer min-h-[300px] md:min-h-[340px] p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-white/15 hover:border-purple-500/40 shadow-2xl transition-all relative flex flex-col justify-between select-none group"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {currentCard.category}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {currentCard.subjectName} • {currentCard.chapterTitle}
            </span>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onToggleBookmark(currentCard.id)}
              className={`p-2 rounded-xl border transition-all ${
                isBookmarked
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              <Bookmark className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            <span className="px-2 py-1 rounded-xl text-[10px] font-mono bg-white/5 text-slate-400 border border-white/10">
              {isFlipped ? "Answer / Back" : "Question / Front"}
            </span>
          </div>
        </div>

        {/* Card Center Content */}
        <div className="py-6 my-auto text-center space-y-4">
          {!isFlipped ? (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider font-mono">
                {currentCard.topicName}
              </div>
              <h3 className="text-lg md:text-2xl font-extrabold text-white leading-relaxed">
                {currentCard.front}
              </h3>
              <p className="text-xs text-slate-400 pt-2 flex items-center justify-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                Click anywhere to flip and reveal answer & key formulas
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-left p-4 rounded-2xl bg-slate-950/80 border border-purple-500/20">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Core Concept & Formula Solution
              </div>
              <div className="text-sm md:text-base text-slate-100 whitespace-pre-line leading-relaxed font-medium">
                {currentCard.back}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer Helper */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-white/10">
          <span className="text-[11px]">Topic: {currentCard.topicName}</span>
          {onAskTutor && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAskTutor(`Please explain the concept and solved numericals for this flashcard topic: ${currentCard.topicName} in ${currentCard.subjectName}. Question was: ${currentCard.front}`);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask Abya AI
            </button>
          )}
        </div>
      </div>

      {/* Action Controls & Mastery Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-white transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={() => setIsFlipped((prev) => !prev)}
            className="px-4 py-3 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          >
            <RotateCw className="w-4 h-4" />
            {isFlipped ? "Flip to Question" : "Flip to Answer"}
          </button>
          <button
            onClick={handleNext}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-white transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleMastered(currentCard.id)}
            className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border ${
              isMastered
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                : "bg-slate-900 hover:bg-emerald-500/10 text-slate-300 border-white/10 hover:border-emerald-500/30"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {isMastered ? "✓ Mastered" : "Mark as Mastered"}
          </button>
        </div>
      </div>
    </div>
  );
};
