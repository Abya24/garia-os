import React, { useState, useMemo, useEffect } from "react";
import {
  Layers,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  BookOpen,
  Trash2,
  Edit3,
  ArrowLeft,
  Search,
  Brain,
  HelpCircle,
  ChevronRight,
  Award,
  X,
  BarChart2,
  Flame,
  Target,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import {
  FlashcardDeck,
  StudyFlashcard,
  SpacedRepetitionRating,
  FlashcardMasteryStatus,
  FlashcardDeckPerformanceStats,
  FlashcardQuizSession,
  Subject,
  AcademicSubject,
} from "../types";

interface FlashcardsPageProps {
  decks: FlashcardDeck[];
  subjects?: Subject[];
  academicSubjects?: AcademicSubject[];
  onUpdateDecks: (decks: FlashcardDeck[]) => void;
  onBack?: () => void;
}

const DECK_COLORS = [
  { label: "Emerald", hex: "#10b981" },
  { label: "Cyan", hex: "#06b6d4" },
  { label: "Violet", hex: "#8b5cf6" },
  { label: "Amber", hex: "#f59e0b" },
  { label: "Rose", hex: "#f43f5e" },
  { label: "Sky", hex: "#0ea5e9" },
];

const RATING_WEIGHTS: Record<SpacedRepetitionRating, number> = {
  again: 0,
  hard: 50,
  good: 85,
  easy: 100,
};

export function applySpacedRepetitionSM2(
  card: StudyFlashcard,
  rating: SpacedRepetitionRating
): StudyFlashcard {
  const now = Date.now();
  let { intervalDays, easeFactor, repetitions, masteryLevel } = card;

  if (rating === "again") {
    repetitions = 0;
    intervalDays = 0;
    easeFactor = Math.max(1.3, Number((easeFactor - 0.2).toFixed(2)));
    masteryLevel = Math.max(5, masteryLevel - 15);
  } else if (rating === "hard") {
    repetitions = Math.max(1, repetitions);
    intervalDays = intervalDays === 0 ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
    easeFactor = Math.max(1.3, Number((easeFactor - 0.15).toFixed(2)));
    masteryLevel = Math.min(100, masteryLevel + 12);
  } else if (rating === "good") {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(3, Math.round(intervalDays * easeFactor));
    }
    masteryLevel = Math.min(100, masteryLevel + 25);
  } else if (rating === "easy") {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 4;
    } else {
      intervalDays = Math.max(4, Math.round(intervalDays * easeFactor * 1.35));
    }
    easeFactor = Math.min(3.2, Number((easeFactor + 0.15).toFixed(2)));
    masteryLevel = Math.min(100, masteryLevel + 35);
  }

  let status: FlashcardMasteryStatus = "learning";
  if (masteryLevel >= 80) {
    status = "mastered";
  } else if (masteryLevel >= 50) {
    status = "reviewing";
  } else if (repetitions === 0 && rating === "again") {
    status = "learning";
  }

  const nextReviewAt =
    intervalDays === 0
      ? now + 10 * 60 * 1000 // 10 minutes if "Again"
      : now + intervalDays * 24 * 60 * 60 * 1000;

  const prevHistory = Array.isArray(card.recallHistory) ? card.recallHistory : [];

  return {
    ...card,
    intervalDays,
    easeFactor,
    repetitions,
    masteryLevel,
    status,
    lastReviewedAt: now,
    nextReviewAt,
    recallHistory: [...prevHistory.slice(-19), { rating, timestamp: now }],
  };
}

/**
 * Derives or normalizes performance statistics for a deck so every deck has
 * accurate, up-to-date performance metrics even before or after quizzes.
 */
export function getDeckPerformanceStats(deck: FlashcardDeck): FlashcardDeckPerformanceStats {
  const existing = deck.performanceStats;
  const reviewedCards = deck.cards.filter((c) => c.repetitions > 0 || (c.lastReviewedAt && c.lastReviewedAt > 0));
  const avgMastery =
    deck.cards.length > 0
      ? Math.round(deck.cards.reduce((sum, c) => sum + (c.masteryLevel || 0), 0) / deck.cards.length)
      : 0;

  if (existing && existing.totalQuizzesTaken > 0) {
    return existing;
  }

  // Compute baseline stats from existing cards if no formal quiz session has been saved yet
  let easy = 0;
  let good = 0;
  let hard = 0;
  let again = 0;

  deck.cards.forEach((c) => {
    if (Array.isArray(c.recallHistory) && c.recallHistory.length > 0) {
      c.recallHistory.forEach((h) => {
        if (h.rating === "easy") easy++;
        else if (h.rating === "good") good++;
        else if (h.rating === "hard") hard++;
        else again++;
      });
    } else if (c.repetitions > 0) {
      if (c.masteryLevel >= 85) easy++;
      else if (c.masteryLevel >= 60) good++;
      else if (c.masteryLevel >= 35) hard++;
      else again++;
    }
  });

  const totalRated = easy + good + hard + again;
  const baselineAccuracy =
    totalRated > 0
      ? Math.round((easy * 100 + good * 85 + hard * 50 + again * 0) / totalRated)
      : avgMastery;

  return {
    totalQuizzesTaken: existing?.totalQuizzesTaken ?? (reviewedCards.length > 0 ? 1 : 0),
    totalCardsReviewed: existing?.totalCardsReviewed ?? totalRated,
    averageRecallAccuracy: existing?.averageRecallAccuracy ?? baselineAccuracy,
    bestRecallAccuracy: existing?.bestRecallAccuracy ?? baselineAccuracy,
    lastQuizAccuracy: existing?.lastQuizAccuracy ?? (reviewedCards.length > 0 ? baselineAccuracy : undefined),
    lastQuizAt: existing?.lastQuizAt ?? deck.lastStudiedAt,
    totalStudySeconds: existing?.totalStudySeconds ?? reviewedCards.length * 18,
    ratingCounts: existing?.ratingCounts ?? {
      again,
      hard,
      good,
      easy,
    },
    quizHistory: existing?.quizHistory ?? [],
  };
}

function formatQuizSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const FlashcardsPage: React.FC<FlashcardsPageProps> = ({
  decks,
  subjects = [],
  academicSubjects = [],
  onUpdateDecks,
  onBack,
}) => {
  // View states: "decks" | "deck_detail" | "quiz"
  const [viewMode, setViewMode] = useState<"decks" | "deck_detail" | "quiz">("decks");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deckDetailTab, setDeckDetailTab] = useState<"cards" | "stats">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  // Create Deck Modal State
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckSubject, setNewDeckSubject] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [newDeckColor, setNewDeckColor] = useState(DECK_COLORS[0].hex);

  // Add/Edit Card Form State
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<StudyFlashcard | null>(null);
  const [cardTerm, setCardTerm] = useState("");
  const [cardDefinition, setCardDefinition] = useState("");
  const [cardHint, setCardHint] = useState("");
  const [cardCategory, setCardCategory] = useState("Definition");
  const [targetDeckIdForCard, setTargetDeckIdForCard] = useState<string>("");

  // Quiz Mode State
  const [quizQueue, setQuizQueue] = useState<StudyFlashcard[]>([]);
  const [quizDeckId, setQuizDeckId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState<string>("Flashcards Quiz Mode");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [userRecallAttempt, setUserRecallAttempt] = useState("");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizElapsedSeconds, setQuizElapsedSeconds] = useState(0);
  const [currentRecallStreak, setCurrentRecallStreak] = useState(0);
  const [bestSessionStreak, setBestSessionStreak] = useState(0);
  const [sessionStats, setSessionStats] = useState<{
    reviewed: number;
    easyOrGood: number;
    againOrHard: number;
    totalMasteryDelta: number;
    weightedScoreSum: number;
    ratings: {
      again: number;
      hard: number;
      good: number;
      easy: number;
    };
  }>({
    reviewed: 0,
    easyOrGood: 0,
    againOrHard: 0,
    totalMasteryDelta: 0,
    weightedScoreSum: 0,
    ratings: { again: 0, hard: 0, good: 0, easy: 0 },
  });

  const now = Date.now();

  // Live Quiz Timer
  useEffect(() => {
    if (viewMode !== "quiz" || quizCompleted) return;
    const timer = setInterval(() => {
      setQuizElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [viewMode, quizCompleted]);

  const availableSubjects = useMemo(() => {
    const names = new Set<string>();
    academicSubjects.forEach((s) => names.add(s.name));
    subjects.forEach((s) => names.add(s.name));
    decks.forEach((d) => {
      if (d.subjectName) names.add(d.subjectName);
    });
    if (names.size === 0) {
      ["Accountancy", "Economics", "Business Studies", "Mathematics", "Physics", "General"].forEach((n) =>
        names.add(n)
      );
    }
    return Array.from(names);
  }, [academicSubjects, subjects, decks]);

  // Aggregate statistics across all decks
  const globalStats = useMemo(() => {
    let totalCards = 0;
    let dueCards = 0;
    let masteredCards = 0;
    let totalMasterySum = 0;
    let totalQuizzesTaken = 0;
    let totalReviewedCount = 0;
    let accuracySum = 0;
    let decksWithQuizStats = 0;

    decks.forEach((deck) => {
      const perf = getDeckPerformanceStats(deck);
      totalQuizzesTaken += perf.totalQuizzesTaken;
      totalReviewedCount += perf.totalCardsReviewed;
      if (perf.totalQuizzesTaken > 0 || perf.totalCardsReviewed > 0) {
        accuracySum += perf.averageRecallAccuracy;
        decksWithQuizStats += 1;
      }

      deck.cards.forEach((card) => {
        totalCards += 1;
        totalMasterySum += card.masteryLevel || 0;
        if (card.nextReviewAt <= now || card.status === "new") {
          dueCards += 1;
        }
        if (card.masteryLevel >= 80 || card.status === "mastered") {
          masteredCards += 1;
        }
      });
    });

    const overallMasteryPct = totalCards > 0 ? Math.round(totalMasterySum / totalCards) : 0;
    const globalAvgRecallAccuracy =
      decksWithQuizStats > 0 ? Math.round(accuracySum / decksWithQuizStats) : overallMasteryPct;

    return {
      totalDecks: decks.length,
      totalCards,
      dueCards,
      masteredCards,
      overallMasteryPct,
      totalQuizzesTaken,
      totalReviewedCount,
      globalAvgRecallAccuracy,
    };
  }, [decks, now]);

  const activeDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) || null,
    [decks, selectedDeckId]
  );

  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      const matchesSubject = subjectFilter === "all" || deck.subjectName === subjectFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        deck.title.toLowerCase().includes(q) ||
        deck.subjectName.toLowerCase().includes(q) ||
        (deck.description && deck.description.toLowerCase().includes(q)) ||
        deck.cards.some(
          (c) => c.term.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q)
        );
      return matchesSubject && matchesSearch;
    });
  }, [decks, subjectFilter, searchQuery]);

  // Create a new Deck
  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;

    const createdDeck: FlashcardDeck = {
      id: `deck-${Date.now()}`,
      title: newDeckTitle.trim(),
      subjectName: newDeckSubject.trim() || availableSubjects[0] || "General",
      description: newDeckDesc.trim() || "Custom study flashcards deck for active recall.",
      color: newDeckColor,
      cards: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      performanceStats: {
        totalQuizzesTaken: 0,
        totalCardsReviewed: 0,
        averageRecallAccuracy: 0,
        bestRecallAccuracy: 0,
        totalStudySeconds: 0,
        ratingCounts: { again: 0, hard: 0, good: 0, easy: 0 },
        quizHistory: [],
      },
    };

    onUpdateDecks([createdDeck, ...decks]);
    setNewDeckTitle("");
    setNewDeckDesc("");
    setIsCreateDeckOpen(false);
    setSelectedDeckId(createdDeck.id);
    setDeckDetailTab("cards");
    setViewMode("deck_detail");
  };

  const handleDeleteDeck = (deckId: string) => {
    const updated = decks.filter((d) => d.id !== deckId);
    onUpdateDecks(updated);
    if (selectedDeckId === deckId) {
      setSelectedDeckId(null);
      setViewMode("decks");
    }
  };

  // Open Modal to Add or Edit a Study Card
  const handleOpenAddCard = (deckId?: string) => {
    const resolvedDeckId = deckId || selectedDeckId || decks[0]?.id || "";
    setTargetDeckIdForCard(resolvedDeckId);
    setEditingCard(null);
    setCardTerm("");
    setCardDefinition("");
    setCardHint("");
    setCardCategory("Definition");
    setIsCardModalOpen(true);
  };

  const handleOpenEditCard = (card: StudyFlashcard) => {
    setTargetDeckIdForCard(card.deckId);
    setEditingCard(card);
    setCardTerm(card.term);
    setCardDefinition(card.definition);
    setCardHint(card.hint || "");
    setCardCategory(card.category || "Definition");
    setIsCardModalOpen(true);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTerm.trim() || !cardDefinition.trim() || !targetDeckIdForCard) return;

    const updatedDecks = decks.map((deck) => {
      if (deck.id !== targetDeckIdForCard) return deck;

      if (editingCard) {
        return {
          ...deck,
          updatedAt: Date.now(),
          cards: deck.cards.map((c) =>
            c.id === editingCard.id
              ? {
                  ...c,
                  term: cardTerm.trim(),
                  definition: cardDefinition.trim(),
                  hint: cardHint.trim() || undefined,
                  category: cardCategory,
                }
              : c
          ),
        };
      } else {
        const newCard: StudyFlashcard = {
          id: `fc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          deckId: deck.id,
          term: cardTerm.trim(),
          definition: cardDefinition.trim(),
          hint: cardHint.trim() || undefined,
          category: cardCategory,
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          nextReviewAt: Date.now(),
          masteryLevel: 0,
          status: "new",
          createdAt: Date.now(),
          recallHistory: [],
        };
        return {
          ...deck,
          updatedAt: Date.now(),
          cards: [...deck.cards, newCard],
        };
      }
    });

    onUpdateDecks(updatedDecks);
    setIsCardModalOpen(false);
    setEditingCard(null);
    setCardTerm("");
    setCardDefinition("");
    setCardHint("");
  };

  const handleDeleteCard = (deckId: string, cardId: string) => {
    const updatedDecks = decks.map((deck) => {
      if (deck.id !== deckId) return deck;
      return {
        ...deck,
        updatedAt: Date.now(),
        cards: deck.cards.filter((c) => c.id !== cardId),
      };
    });
    onUpdateDecks(updatedDecks);
  };

  // Start Quiz Mode (Deck-specific or All Decks)
  const startSpacedRepetitionQuiz = (deck?: FlashcardDeck, dueOnly: boolean = false) => {
    let pool: StudyFlashcard[] = [];
    if (deck) {
      pool = [...deck.cards];
      setQuizDeckId(deck.id);
      setSelectedDeckId(deck.id);
      setQuizTitle(`${deck.title} — Quiz Mode`);
    } else {
      decks.forEach((d) => {
        pool.push(...d.cards);
      });
      setQuizDeckId(null);
      setQuizTitle("All Decks — Spaced Repetition Quiz Mode");
    }

    if (pool.length === 0) return;

    const currentTs = Date.now();
    let filteredPool = dueOnly
      ? pool.filter((c) => c.nextReviewAt <= currentTs || c.status === "new")
      : pool;

    // Fallback to full pool if all cards were already reviewed
    if (filteredPool.length === 0) {
      filteredPool = [...pool];
    }

    // Sort by priority: due/new first, then lowest masteryLevel
    filteredPool.sort((a, b) => {
      const aDue = a.nextReviewAt <= currentTs ? 0 : 1;
      const bDue = b.nextReviewAt <= currentTs ? 0 : 1;
      if (aDue !== bDue) return aDue - bDue;
      return a.masteryLevel - b.masteryLevel;
    });

    setQuizQueue(filteredPool);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setUserRecallAttempt("");
    setQuizCompleted(false);
    setQuizElapsedSeconds(0);
    setCurrentRecallStreak(0);
    setBestSessionStreak(0);
    setSessionStats({
      reviewed: 0,
      easyOrGood: 0,
      againOrHard: 0,
      totalMasteryDelta: 0,
      weightedScoreSum: 0,
      ratings: { again: 0, hard: 0, good: 0, easy: 0 },
    });
    setViewMode("quiz");
  };

  // Record completed quiz session into each participating deck's performanceStats
  const finalizeQuizSessionStats = (
    latestDecks: FlashcardDeck[],
    finalStats: typeof sessionStats,
    durationSecs: number
  ): FlashcardDeck[] => {
    if (finalStats.reviewed === 0) return latestDecks;

    const sessionAccuracy = Math.round(finalStats.weightedScoreSum / finalStats.reviewed);
    const todayDate = new Date().toISOString().split("T")[0];
    const targetIds = quizDeckId
      ? new Set([quizDeckId])
      : new Set(quizQueue.slice(0, finalStats.reviewed).map((c) => c.deckId));

    return latestDecks.map((deck) => {
      if (!targetIds.has(deck.id)) return deck;

      const prevPerf = getDeckPerformanceStats(deck);
      const newTotalQuizzes = prevPerf.totalQuizzesTaken + 1;
      const newAvgAccuracy = Math.round(
        (prevPerf.averageRecallAccuracy * prevPerf.totalQuizzesTaken + sessionAccuracy) /
          newTotalQuizzes
      );
      const newBestAccuracy = Math.max(prevPerf.bestRecallAccuracy, sessionAccuracy);

      const sessionEntry: FlashcardQuizSession = {
        id: `quiz-sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        deckId: deck.id,
        deckTitle: deck.title,
        timestamp: Date.now(),
        date: todayDate,
        totalCards: quizQueue.length,
        reviewedCount: finalStats.reviewed,
        recallAccuracyPct: sessionAccuracy,
        durationSeconds: Math.max(1, durationSecs),
        masteryGain: finalStats.totalMasteryDelta,
        ratings: { ...finalStats.ratings },
      };

      const updatedPerf: FlashcardDeckPerformanceStats = {
        ...prevPerf,
        totalQuizzesTaken: newTotalQuizzes,
        lastQuizAccuracy: sessionAccuracy,
        lastQuizAt: Date.now(),
        averageRecallAccuracy: newAvgAccuracy,
        bestRecallAccuracy: newBestAccuracy,
        totalStudySeconds: prevPerf.totalStudySeconds + Math.max(1, durationSecs),
        quizHistory: [sessionEntry, ...(prevPerf.quizHistory || [])].slice(0, 25),
      };

      return {
        ...deck,
        lastStudiedAt: Date.now(),
        updatedAt: Date.now(),
        performanceStats: updatedPerf,
      };
    });
  };

  // Rate current card in Quiz Mode
  const handleRateCard = (rating: SpacedRepetitionRating) => {
    const currentCard = quizQueue[currentCardIndex];
    if (!currentCard) return;

    const updatedCard = applySpacedRepetitionSM2(currentCard, rating);
    const masteryDelta = updatedCard.masteryLevel - currentCard.masteryLevel;
    const ratingWeight = RATING_WEIGHTS[rating];

    const nextRatings = {
      ...sessionStats.ratings,
      [rating]: sessionStats.ratings[rating] + 1,
    };

    const nextStats = {
      reviewed: sessionStats.reviewed + 1,
      easyOrGood:
        rating === "good" || rating === "easy"
          ? sessionStats.easyOrGood + 1
          : sessionStats.easyOrGood,
      againOrHard:
        rating === "again" || rating === "hard"
          ? sessionStats.againOrHard + 1
          : sessionStats.againOrHard,
      totalMasteryDelta: sessionStats.totalMasteryDelta + masteryDelta,
      weightedScoreSum: sessionStats.weightedScoreSum + ratingWeight,
      ratings: nextRatings,
    };

    // Update streak
    const nextStreak =
      rating === "good" || rating === "easy" ? currentRecallStreak + 1 : 0;
    setCurrentRecallStreak(nextStreak);
    if (nextStreak > bestSessionStreak) {
      setBestSessionStreak(nextStreak);
    }

    // Update card & per-card rating counters inside its deck
    let updatedDecks = decks.map((deck) => {
      if (deck.id !== currentCard.deckId) return deck;
      const prevPerf = getDeckPerformanceStats(deck);
      const updatedRatingCounts = {
        ...prevPerf.ratingCounts,
        [rating]: (prevPerf.ratingCounts[rating] || 0) + 1,
      };
      const newTotalReviewed = prevPerf.totalCardsReviewed + 1;

      return {
        ...deck,
        updatedAt: Date.now(),
        lastStudiedAt: Date.now(),
        cards: deck.cards.map((c) => (c.id === currentCard.id ? updatedCard : c)),
        performanceStats: {
          ...prevPerf,
          totalCardsReviewed: newTotalReviewed,
          ratingCounts: updatedRatingCounts,
        },
      };
    });

    // Update local quiz queue item
    const nextQueue = quizQueue.map((c, idx) => (idx === currentCardIndex ? updatedCard : c));
    setQuizQueue(nextQueue);
    setSessionStats(nextStats);
    setUserRecallAttempt("");

    if (currentCardIndex + 1 < quizQueue.length) {
      onUpdateDecks(updatedDecks);
      setIsFlipped(false);
      setShowHint(false);
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      // Final card rated — finalize quiz session statistics on the deck
      updatedDecks = finalizeQuizSessionStats(updatedDecks, nextStats, quizElapsedSeconds);
      onUpdateDecks(updatedDecks);
      setQuizCompleted(true);
    }
  };

  // Finish Quiz early & save stats if at least 1 card reviewed
  const handleFinishQuizEarly = () => {
    if (sessionStats.reviewed > 0 && !quizCompleted) {
      const updatedDecks = finalizeQuizSessionStats(decks, sessionStats, quizElapsedSeconds);
      onUpdateDecks(updatedDecks);
      setQuizCompleted(true);
    } else {
      setViewMode(selectedDeckId ? "deck_detail" : "decks");
    }
  };

  const currentQuizCard = quizQueue[currentCardIndex];
  const liveSessionAccuracyPct =
    sessionStats.reviewed > 0
      ? Math.round(sessionStats.weightedScoreSum / sessionStats.reviewed)
      : 100;

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {viewMode !== "decks" && (
            <button
              onClick={() => {
                if (viewMode === "quiz") {
                  setViewMode(selectedDeckId ? "deck_detail" : "decks");
                } else if (viewMode === "deck_detail") {
                  setSelectedDeckId(null);
                  setViewMode("decks");
                } else if (onBack) {
                  onBack();
                }
              }}
              className="p-2.5 rounded-2xl bg-slate-900/80 border border-white/10 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-emerald-400" />
              <span>Flashcards & Quiz Mode</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Create study decks, self-rate recall in Quiz Mode, and track deck performance statistics.
            </p>
          </div>
        </div>

        {/* Primary Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {viewMode === "decks" && (
            <>
              <button
                onClick={() => startSpacedRepetitionQuiz(undefined, true)}
                disabled={globalStats.totalCards === 0}
                data-testid="start-global-spaced-repetition-btn"
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>
                  Start Quiz Mode ({globalStats.dueCards > 0 ? `${globalStats.dueCards} Due` : "All Cards"})
                </span>
              </button>

              <button
                onClick={() => handleOpenAddCard()}
                data-testid="quick-add-flashcard-btn"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Add Card</span>
              </button>

              <button
                onClick={() => setIsCreateDeckOpen(true)}
                data-testid="create-deck-btn"
                className="px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Deck</span>
              </button>
            </>
          )}

          {viewMode === "deck_detail" && activeDeck && (
            <>
              <button
                onClick={() => startSpacedRepetitionQuiz(activeDeck, false)}
                disabled={activeDeck.cards.length === 0}
                data-testid="start-deck-quiz-btn"
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Quiz Mode ({activeDeck.cards.length} Cards)</span>
              </button>

              <button
                onClick={() => handleOpenAddCard(activeDeck.id)}
                data-testid="add-card-to-deck-btn"
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Term & Definition</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Mastery & Quiz Performance Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Study Decks & Cards</span>
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-white">
            {globalStats.totalDecks} <span className="text-xs font-sans font-normal text-slate-400">decks</span> ·{" "}
            {globalStats.totalCards}{" "}
            <span className="text-xs font-sans font-normal text-slate-400">cards</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {globalStats.dueCards} due for recall review
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Quiz Recall Accuracy</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-300">
            {globalStats.globalAvgRecallAccuracy}%
          </div>
          <p className="text-[11px] text-slate-400">
            Across {globalStats.totalQuizzesTaken} quizzes · {globalStats.totalReviewedCount} reviews
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Deck Mastery</span>
            <Brain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-white">
            {globalStats.overallMasteryPct}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${globalStats.overallMasteryPct}%` }}
            />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cards Mastered</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-white">
            {globalStats.masteredCards}{" "}
            <span className="text-xs font-sans font-normal text-slate-400">
              / {globalStats.totalCards}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">80%+ retention threshold</p>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: DECKS GALLERY WITH PER-DECK PERFORMANCE STATS
          ===================================================================== */}
      {viewMode === "decks" && (
        <div className="space-y-5">
          {/* Search & Subject Filter Bar */}
          <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search decks, terms, or definitions..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSubjectFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  subjectFilter === "all"
                    ? "bg-emerald-500 text-slate-950 font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                All Subjects
              </button>
              {availableSubjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubjectFilter(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    subjectFilter === sub
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Decks Grid */}
          {filteredDecks.length === 0 ? (
            <div className="glass-card p-10 rounded-3xl border border-white/10 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No Flashcard Decks Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Create your first flashcard deck with terms and definitions to start tracking mastery with Quiz Mode.
              </p>
              <button
                onClick={() => setIsCreateDeckOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Deck</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDecks.map((deck) => {
                const total = deck.cards.length;
                const dueCount = deck.cards.filter(
                  (c) => c.nextReviewAt <= now || c.status === "new"
                ).length;
                const masteredCount = deck.cards.filter(
                  (c) => c.masteryLevel >= 80 || c.status === "mastered"
                ).length;
                const deckMastery =
                  total > 0
                    ? Math.round(
                        deck.cards.reduce((acc, c) => acc + (c.masteryLevel || 0), 0) / total
                      )
                    : 0;
                const perf = getDeckPerformanceStats(deck);

                return (
                  <div
                    key={deck.id}
                    data-testid={`flashcard-deck-${deck.id}`}
                    className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col justify-between gap-4 hover:border-white/20 transition-all"
                  >
                    <div className="space-y-3">
                      {/* Quiet Kicker Metadata */}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: deck.color || "#10b981" }}
                          />
                          <span className="font-semibold text-slate-300">{deck.subjectName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{total} cards</span>
                        </div>
                        <button
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                          title="Delete Deck"
                          aria-label={`Delete ${deck.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-base font-bold font-heading text-white leading-snug">
                          {deck.title}
                        </h3>
                        {deck.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {deck.description}
                          </p>
                        )}
                      </div>

                      {/* Mastery Bar & Stats */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            Mastery:{" "}
                            <strong className="text-white font-mono tabular-nums">
                              {deckMastery}%
                            </strong>
                          </span>
                          <span className="text-slate-400 font-mono tabular-nums">
                            {dueCount > 0 ? (
                              <span className="text-amber-300 font-semibold">{dueCount} due now</span>
                            ) : (
                              <span className="text-emerald-400">
                                {masteredCount}/{total} mastered
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${deckMastery}%`,
                              backgroundColor: deck.color || "#10b981",
                            }}
                          />
                        </div>
                      </div>

                      {/* Per-Deck Quiz Performance Statistics Strip */}
                      <div
                        data-testid={`deck-perf-stats-${deck.id}`}
                        className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 grid grid-cols-3 gap-2 text-center"
                      >
                        <div>
                          <div className="text-[10px] text-slate-400">Avg Recall</div>
                          <div className="text-xs font-extrabold font-mono tabular-nums text-emerald-300">
                            {perf.averageRecallAccuracy}%
                          </div>
                        </div>
                        <div className="border-x border-white/5">
                          <div className="text-[10px] text-slate-400">Best Quiz</div>
                          <div className="text-xs font-extrabold font-mono tabular-nums text-cyan-300">
                            {perf.bestRecallAccuracy}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Reviewed</div>
                          <div className="text-xs font-extrabold font-mono tabular-nums text-white">
                            {perf.totalCardsReviewed}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deck Action Footer */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => startSpacedRepetitionQuiz(deck, false)}
                        disabled={total === 0}
                        data-testid={`start-quiz-deck-${deck.id}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Quiz Mode</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDeckId(deck.id);
                          setDeckDetailTab("stats");
                          setViewMode("deck_detail");
                        }}
                        data-testid={`view-stats-deck-${deck.id}`}
                        className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-white/10 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="View Deck Performance Statistics"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Stats</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDeckId(deck.id);
                          setDeckDetailTab("cards");
                          setViewMode("deck_detail");
                        }}
                        className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Cards ({total})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW 2: DECK DETAIL, STUDY CARDS & DECK PERFORMANCE STATISTICS
          ===================================================================== */}
      {viewMode === "deck_detail" && activeDeck && (
        <div className="space-y-5">
          {(() => {
            const perf = getDeckPerformanceStats(activeDeck);
            const totalRatings =
              perf.ratingCounts.easy +
              perf.ratingCounts.good +
              perf.ratingCounts.hard +
              perf.ratingCounts.again;
            const easyPct =
              totalRatings > 0 ? Math.round((perf.ratingCounts.easy / totalRatings) * 100) : 0;
            const goodPct =
              totalRatings > 0 ? Math.round((perf.ratingCounts.good / totalRatings) * 100) : 0;
            const hardPct =
              totalRatings > 0 ? Math.round((perf.ratingCounts.hard / totalRatings) * 100) : 0;
            const againPct =
              totalRatings > 0 ? Math.round((perf.ratingCounts.again / totalRatings) * 100) : 0;

            return (
              <>
                <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: activeDeck.color }}
                      />
                      <span>{activeDeck.subjectName}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{activeDeck.cards.length} Cards</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums text-emerald-300">
                        {perf.averageRecallAccuracy}% Avg Recall
                      </span>
                    </div>
                    <h2 className="text-xl font-bold font-heading text-white">{activeDeck.title}</h2>
                    {activeDeck.description && (
                      <p className="text-xs text-slate-400">{activeDeck.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/90 border border-white/10">
                      <button
                        type="button"
                        onClick={() => setDeckDetailTab("cards")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          deckDetailTab === "cards"
                            ? "bg-emerald-500 text-slate-950"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Study Cards ({activeDeck.cards.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeckDetailTab("stats")}
                        data-testid="deck-detail-stats-tab"
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                          deckDetailTab === "stats"
                            ? "bg-cyan-500 text-slate-950"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Performance Stats</span>
                      </button>
                    </div>

                    <button
                      onClick={() => startSpacedRepetitionQuiz(activeDeck, true)}
                      disabled={activeDeck.cards.length === 0}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Quiz Due Cards
                    </button>
                  </div>
                </div>

                {/* Always-visible Deck Performance Overview Panel */}
                <section
                  aria-label="Deck Performance Statistics"
                  data-testid="deck-performance-panel"
                  className="glass-card p-5 rounded-3xl border border-white/10 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>Deck Performance Statistics — {activeDeck.title}</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Cumulative self-rated recall accuracy, quiz sessions completed, and rating distribution.
                      </p>
                    </div>
                    {perf.lastQuizAt && (
                      <span className="text-[11px] font-mono text-slate-400">
                        Last Quiz: {new Date(perf.lastQuizAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-0.5">
                      <span className="text-[11px] text-slate-400">Quizzes Completed</span>
                      <div className="text-xl font-extrabold font-mono tabular-nums text-white">
                        {perf.totalQuizzesTaken}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {perf.totalCardsReviewed} total card ratings
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-0.5">
                      <span className="text-[11px] text-slate-400">Avg Recall Accuracy</span>
                      <div className="text-xl font-extrabold font-mono tabular-nums text-emerald-300">
                        {perf.averageRecallAccuracy}%
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Self-rated recall score
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-0.5">
                      <span className="text-[11px] text-slate-400">Best Quiz Score</span>
                      <div className="text-xl font-extrabold font-mono tabular-nums text-cyan-300">
                        {perf.bestRecallAccuracy}%
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Last: {perf.lastQuizAccuracy !== undefined ? `${perf.lastQuizAccuracy}%` : "N/A"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-0.5">
                      <span className="text-[11px] text-slate-400">Recall Distribution</span>
                      <div className="text-xs font-mono tabular-nums text-slate-200 pt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-emerald-300">Easy: {perf.ratingCounts.easy}</span>
                        <span className="text-cyan-300">Good: {perf.ratingCounts.good}</span>
                        <span className="text-amber-300">Hard: {perf.ratingCounts.hard}</span>
                        <span className="text-rose-300">Again: {perf.ratingCounts.again}</span>
                      </div>
                    </div>
                  </div>

                  {/* Self-Rating Recall Distribution Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Self-Rated Recall Breakdown</span>
                      <span>
                        Easy {easyPct}% · Good {goodPct}% · Hard {hardPct}% · Again {againPct}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden flex">
                      {totalRatings === 0 ? (
                        <div className="w-full h-full bg-slate-800" />
                      ) : (
                        <>
                          <div
                            className="h-full bg-emerald-400 transition-all"
                            style={{ width: `${easyPct}%` }}
                            title={`Easy: ${perf.ratingCounts.easy} (${easyPct}%)`}
                          />
                          <div
                            className="h-full bg-cyan-400 transition-all"
                            style={{ width: `${goodPct}%` }}
                            title={`Good: ${perf.ratingCounts.good} (${goodPct}%)`}
                          />
                          <div
                            className="h-full bg-amber-400 transition-all"
                            style={{ width: `${hardPct}%` }}
                            title={`Hard: ${perf.ratingCounts.hard} (${hardPct}%)`}
                          />
                          <div
                            className="h-full bg-rose-500 transition-all"
                            style={{ width: `${againPct}%` }}
                            title={`Again: ${perf.ratingCounts.again} (${againPct}%)`}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Detailed Quiz Session History when in Stats tab or if quiz history exists */}
                  {(deckDetailTab === "stats" || (perf.quizHistory && perf.quizHistory.length > 0)) && (
                    <div className="pt-2 border-t border-white/10 space-y-2.5">
                      <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                        <span>Recent Quiz Sessions Log</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {perf.quizHistory?.length || 0} recorded sessions
                        </span>
                      </div>

                      {!perf.quizHistory || perf.quizHistory.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-center text-xs text-slate-400">
                          Complete a Quiz Mode session on this deck to record detailed session accuracy and recall logs.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {perf.quizHistory.map((sess) => (
                            <div
                              key={sess.id}
                              className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                                  {sess.recallAccuracyPct}% Recall
                                </span>
                                <div>
                                  <div className="font-semibold text-white">
                                    Reviewed {sess.reviewedCount} of {sess.totalCards} cards
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {sess.date} · Duration: {formatQuizSeconds(sess.durationSeconds)} · Mastery{" "}
                                    {sess.masteryGain >= 0 ? `+${sess.masteryGain}%` : `${sess.masteryGain}%`}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 font-mono text-[11px]">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300">
                                  Easy: {sess.ratings.easy}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300">
                                  Good: {sess.ratings.good}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300">
                                  Hard: {sess.ratings.hard}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300">
                                  Again: {sess.ratings.again}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Study Cards List */}
                {deckDetailTab === "cards" && (
                  <>
                    {activeDeck.cards.length === 0 ? (
                      <div className="glass-card p-8 rounded-3xl border border-white/10 text-center space-y-3">
                        <p className="text-sm font-semibold text-white">
                          This deck has no study cards yet.
                        </p>
                        <p className="text-xs text-slate-400">
                          Add terms and definitions to start practicing in Quiz Mode.
                        </p>
                        <button
                          onClick={() => handleOpenAddCard(activeDeck.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add First Term & Definition</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeDeck.cards.map((card, idx) => {
                          const isDue = card.nextReviewAt <= now || card.status === "new";
                          return (
                            <div
                              key={card.id}
                              className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                            >
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                                  <span className="font-mono font-bold text-slate-300">
                                    {String(idx + 1).padStart(2, "0")}.
                                  </span>
                                  <span>{card.category || "Concept"}</span>
                                  <span>·</span>
                                  <span className="font-mono tabular-nums">
                                    Mastery:{" "}
                                    <strong className="text-emerald-300">{card.masteryLevel}%</strong>
                                  </span>
                                  <span>·</span>
                                  <span className="font-mono tabular-nums">
                                    Reviews: {card.repetitions}
                                  </span>
                                  <span>·</span>
                                  <span className="font-mono tabular-nums">
                                    Interval:{" "}
                                    {card.intervalDays === 0 ? "New / Same-day" : `${card.intervalDays}d`}
                                  </span>
                                  <span>·</span>
                                  <span
                                    className={
                                      isDue ? "text-amber-300 font-semibold" : "text-slate-400"
                                    }
                                  >
                                    {isDue ? "Due for Review" : "Scheduled"}
                                  </span>
                                </div>

                                <div>
                                  <h4 className="text-sm font-bold text-white">{card.term}</h4>
                                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                    {card.definition}
                                  </p>
                                  {card.hint && (
                                    <p className="text-[11px] text-slate-400 mt-1 italic">
                                      Hint: {card.hint}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                                <button
                                  onClick={() => handleOpenEditCard(card)}
                                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                                  title="Edit Card"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCard(activeDeck.id, card.id)}
                                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-white/10 transition-colors cursor-pointer"
                                  title="Delete Card"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* =====================================================================
          VIEW 3: INTERACTIVE QUIZ MODE WITH SELF-RATED RECALL & STATS
          ===================================================================== */}
      {viewMode === "quiz" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {!quizCompleted && currentQuizCard ? (
            <div className="space-y-5">
              {/* Quiz Progress & Live Performance Bar */}
              <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">{quizTitle}</span>
                  </div>

                  <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
                    <span className="text-emerald-300 font-bold">
                      Recall Accuracy: {liveSessionAccuracyPct}%
                    </span>
                    <span className="text-amber-300 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {currentRecallStreak} Streak
                    </span>
                    <span className="text-slate-400">
                      {formatQuizSeconds(quizElapsedSeconds)}
                    </span>
                    <span className="text-slate-200 font-bold">
                      Card {currentCardIndex + 1} / {quizQueue.length}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round(((currentCardIndex + 1) / quizQueue.length) * 100)}%`,
                    }}
                  />
                </div>

                {sessionStats.reviewed > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      Rated so far: {sessionStats.reviewed} card{sessionStats.reviewed === 1 ? "" : "s"} (
                      {sessionStats.easyOrGood} strong recall, {sessionStats.againOrHard} needs review)
                    </span>
                    <button
                      type="button"
                      onClick={handleFinishQuizEarly}
                      className="text-cyan-300 hover:underline font-semibold cursor-pointer"
                    >
                      Finish & Save Stats
                    </button>
                  </div>
                )}
              </div>

              {/* Optional Self-Test Recall Input before revealing */}
              {!isFlipped && (
                <div className="glass-card p-3.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="text"
                    value={userRecallAttempt}
                    onChange={(e) => setUserRecallAttempt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setIsFlipped(true);
                      }
                    }}
                    placeholder="Optional: Type your recalled answer here before flipping to compare..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/90 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    Check & Reveal Answer
                  </button>
                </div>
              )}

              {/* Flashcard Interactive Flip Box */}
              <div
                onClick={() => setIsFlipped((prev) => !prev)}
                data-testid="spaced-repetition-card"
                className="glass-card p-6 sm:p-10 rounded-3xl border border-emerald-500/30 min-h-[280px] flex flex-col justify-between cursor-pointer select-none transition-all hover:border-emerald-400/50"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-300">
                      {isFlipped ? "DEFINITION / ANSWER" : "TERM / PROMPT"}
                    </span>
                    <span>·</span>
                    <span>{currentQuizCard.category || "Concept"}</span>
                  </div>
                  <span className="font-mono tabular-nums">
                    Current Mastery: {currentQuizCard.masteryLevel}%
                  </span>
                </div>

                <div className="my-auto py-6 text-center space-y-4">
                  {!isFlipped ? (
                    <>
                      <h3 className="text-xl sm:text-2xl font-extrabold font-heading text-white leading-snug">
                        {currentQuizCard.term}
                      </h3>
                      {currentQuizCard.hint && (
                        <div>
                          {showHint ? (
                            <p className="text-xs text-amber-300 font-medium">
                              Hint: {currentQuizCard.hint}
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowHint(true);
                              }}
                              className="text-xs text-slate-400 hover:text-amber-300 inline-flex items-center gap-1 underline"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Show Hint</span>
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div className="text-xs text-slate-400 font-medium">
                        {currentQuizCard.term}
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-emerald-200 leading-relaxed max-w-xl mx-auto">
                        {currentQuizCard.definition}
                      </p>
                      {userRecallAttempt.trim() && (
                        <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 max-w-lg mx-auto text-left text-xs space-y-1">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Your Recalled Response:
                          </span>
                          <p className="text-slate-200 font-medium">{userRecallAttempt}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFlipped((prev) => !prev);
                    }}
                    data-testid="flip-card-btn"
                    className="text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isFlipped ? "Flip Back to Term" : "Click to Reveal Definition"}</span>
                  </button>
                </div>
              </div>

              {/* Self-Rate Recall Controls */}
              <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-white">
                    How well did you recall this card? Self-Rate Your Recall:
                  </span>
                  <span className="text-slate-400">
                    {isFlipped
                      ? "Select a recall rating below to update deck performance statistics"
                      : "Reveal definition first or rate your recall directly"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRateCard("again")}
                    data-testid="rate-again-btn"
                    className="p-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-rose-300">1. Again (Forgot)</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      0% Recall · Repeat &lt;10m
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateCard("hard")}
                    data-testid="rate-hard-btn"
                    className="p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-amber-300">2. Hard (Partial)</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      50% Recall · +12% Mastery
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateCard("good")}
                    data-testid="rate-good-btn"
                    className="p-3 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-cyan-300">3. Good (Recalled)</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      85% Recall · +25% Mastery
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateCard("easy")}
                    data-testid="rate-easy-btn"
                    className="p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-emerald-300">4. Easy (Instant)</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      100% Recall · +35% Mastery
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Quiz Session Summary & Deck Performance Statistics Card */
            <div
              data-testid="quiz-summary-card"
              className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-500/30 text-center space-y-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold font-heading text-white">
                  Quiz Mode Complete — Performance Recorded
                </h2>
                <p className="text-xs text-slate-400">
                  Your self-rated recall accuracy, SM-2 intervals, and deck performance statistics have been saved.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
                  <div className="text-[11px] text-slate-400">Recall Accuracy</div>
                  <div
                    data-testid="quiz-summary-accuracy"
                    className="text-xl font-extrabold font-mono tabular-nums text-emerald-300 mt-0.5"
                  >
                    {liveSessionAccuracyPct}%
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
                  <div className="text-[11px] text-slate-400">Cards Reviewed</div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-white mt-0.5">
                    {sessionStats.reviewed}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
                  <div className="text-[11px] text-slate-400">Strong Recall</div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-cyan-300 mt-0.5">
                    {sessionStats.easyOrGood} / {sessionStats.reviewed}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
                  <div className="text-[11px] text-slate-400">Mastery Gain</div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-amber-300 mt-0.5">
                    {sessionStats.totalMasteryDelta >= 0
                      ? `+${sessionStats.totalMasteryDelta}%`
                      : `${sessionStats.totalMasteryDelta}%`}
                  </div>
                </div>
              </div>

              {/* Self-Rating Breakdown in Quiz Summary */}
              <div className="max-w-xl mx-auto p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>Self-Rated Recall Breakdown</span>
                  <span className="font-mono text-slate-400">
                    Duration: {formatQuizSeconds(quizElapsedSeconds)} · Best Streak: {bestSessionStreak}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs pt-1">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    Easy: <strong>{sessionStats.ratings.easy}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                    Good: <strong>{sessionStats.ratings.good}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    Hard: <strong>{sessionStats.ratings.hard}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                    Again: <strong>{sessionStats.ratings.again}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setQuizCompleted(false);
                    setQuizElapsedSeconds(0);
                    setCurrentRecallStreak(0);
                    setSessionStats({
                      reviewed: 0,
                      easyOrGood: 0,
                      againOrHard: 0,
                      totalMasteryDelta: 0,
                      weightedScoreSum: 0,
                      ratings: { again: 0, hard: 0, good: 0, easy: 0 },
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Retake Quiz Mode
                </button>

                {selectedDeckId && (
                  <button
                    onClick={() => {
                      setDeckDetailTab("stats");
                      setViewMode("deck_detail");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition-colors cursor-pointer"
                  >
                    View Deck Performance Stats
                  </button>
                )}

                <button
                  onClick={() => setViewMode("decks")}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-white/10 font-bold text-xs transition-colors cursor-pointer"
                >
                  Back to All Decks
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL: CREATE NEW DECK
          ===================================================================== */}
      {isCreateDeckOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-3xl border border-white/15 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-white">Create Study Deck</h3>
              <button
                onClick={() => setIsCreateDeckOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Deck Title *</label>
                <input
                  type="text"
                  required
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  placeholder="e.g. Organic Chemistry Named Reactions"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Subject</label>
                <input
                  type="text"
                  value={newDeckSubject}
                  onChange={(e) => setNewDeckSubject(e.target.value)}
                  placeholder={availableSubjects[0] || "e.g. Accountancy, Physics, History"}
                  list="flashcard-subject-suggestions"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <datalist id="flashcard-subject-suggestions">
                  {availableSubjects.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  placeholder="Key formulas, definitions, or chapter focus..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Deck Accent Color</label>
                <div className="flex items-center gap-2">
                  {DECK_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewDeckColor(c.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newDeckColor === c.hex ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateDeckOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-create-deck-btn"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                >
                  Create Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD / EDIT FLASHCARD (TERM & DEFINITION)
          ===================================================================== */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-3xl border border-white/15 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-white">
                {editingCard ? "Edit Study Card" : "Add Study Card (Term & Definition)"}
              </h3>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4">
              {!editingCard && decks.length > 1 && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Target Deck</label>
                  <select
                    value={targetDeckIdForCard}
                    onChange={(e) => setTargetDeckIdForCard(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {decks.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.subjectName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Term / Question (Front) *</label>
                <input
                  type="text"
                  required
                  value={cardTerm}
                  onChange={(e) => setCardTerm(e.target.value)}
                  placeholder="e.g. Law of Diminishing Marginal Utility"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Definition / Explanation (Back) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={cardDefinition}
                  onChange={(e) => setCardDefinition(e.target.value)}
                  placeholder="As more units of a commodity are consumed, the marginal utility derived from each successive unit goes on diminishing..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Card Category</label>
                  <select
                    value={cardCategory}
                    onChange={(e) => setCardCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Definition">Definition</option>
                    <option value="Formula">Formula</option>
                    <option value="Concept">Concept</option>
                    <option value="High-Yield Point">High-Yield Point</option>
                    <option value="Date / Event">Date / Event</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Memory Hint (Optional)</label>
                  <input
                    type="text"
                    value={cardHint}
                    onChange={(e) => setCardHint(e.target.value)}
                    placeholder="Short mnemonic or clue"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-save-card-btn"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                >
                  {editingCard ? "Save Changes" : "Add to Deck"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsPage;
