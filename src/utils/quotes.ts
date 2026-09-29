export interface MotivationalQuote {
  id: string;
  quote: string;
  author: string;
  category: "focus" | "resilience" | "consistency" | "excellence" | "discipline" | "mindset";
  hindiTranslation?: string;
  affirmation: string;
  affirmationHindi?: string;
  morningActionTip?: string;
  tags?: string[];
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    id: "q-1",
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    category: "focus",
    hindiTranslation: "आगे बढ़ने का राज़ बस शुरुआत करना है।",
    affirmation: "I begin my most important study task today with clarity, energy, and zero hesitation.",
    affirmationHindi: "मैं आज अपने सबसे महत्वपूर्ण अध्ययन कार्य की शुरुआत स्पष्टता और ऊर्जा के साथ करता हूँ।",
    morningActionTip: "Complete 1 high-priority chapter or numerical set before checking distractions.",
    tags: ["action", "start", "productivity"],
  },
  {
    id: "q-2",
    quote: "Continuous effort – not strength or intelligence – is the key to unlocking our potential.",
    author: "Winston Churchill",
    category: "consistency",
    hindiTranslation: "लगातार प्रयास ही हमारी वास्तविक क्षमता को उजागर करने की कुंजी है।",
    affirmation: "My steady daily effort compounds into deep academic mastery every single morning.",
    affirmationHindi: "मेरा निरंतर दैनिक प्रयास हर दिन मेरी शैक्षणिक महारत को मजबूत बनाता है।",
    morningActionTip: "Show up for a focused 25-minute study session even on busy days.",
    tags: ["grit", "perseverance", "effort"],
  },
  {
    id: "q-3",
    quote: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
    category: "consistency",
    hindiTranslation: "सफलता हर दिन दोहराए जाने वाले छोटे-छोटे प्रयासों का जोड़ है।",
    affirmation: "Every concept I revise today builds an unshakeable foundation for my exams.",
    affirmationHindi: "आज मैं जिस भी विषय का रिवीजन करता हूँ, वह मेरी परीक्षाओं के लिए मजबूत नींव बनाता है।",
    morningActionTip: "Review yesterday's key formulas or summary notes for 10 minutes this morning.",
    tags: ["habits", "daily", "success"],
  },
  {
    id: "q-4",
    quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
    category: "excellence",
    hindiTranslation: "ऐसे जियो जैसे कल तुम्हारा अंतिम दिन हो। ऐसे सीखो जैसे तुम्हें हमेशा जीना हो।",
    affirmation: "I approach my subjects with curiosity, deep understanding, and a love for learning.",
    affirmationHindi: "मैं अपने विषयों को जिज्ञासा और गहरी समझ के साथ पढ़ता हूँ।",
    morningActionTip: "Ask 'why' behind one core theorem or principle in today's syllabus.",
    tags: ["learning", "wisdom", "education"],
  },
  {
    id: "q-5",
    quote: "Discipline is the bridge between goals and accomplishment.",
    author: "Jim Rohn",
    category: "discipline",
    hindiTranslation: "अनुशासन ही लक्ष्यों और उपलब्धियों के बीच का सेतु है।",
    affirmation: "I honor my study schedule and protect my focus time with calm self-discipline.",
    affirmationHindi: "मैं अपनी अध्ययन समय-सारणी का सम्मान करता हूँ और पूरे अनुशासन से ध्यान केंद्रित करता हूँ।",
    morningActionTip: "Sort your tasks by High Priority first and finish the top item before noon.",
    tags: ["discipline", "goals", "mastery"],
  },
  {
    id: "q-6",
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
    category: "excellence",
    hindiTranslation: "ज्ञान में किया गया निवेश जीवन में सबसे अच्छा प्रतिफल देता है।",
    affirmation: "Every hour I invest in deep study today multiplies my future confidence and opportunities.",
    affirmationHindi: "आज अध्ययन में लगाया गया हर घंटा मेरे भविष्य के आत्मविश्वास को बढ़ाता है।",
    morningActionTip: "Log your first study session in Study Tracker to lock in today's streak.",
    tags: ["knowledge", "growth", "study"],
  },
  {
    id: "q-7",
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
    category: "resilience",
    hindiTranslation: "जब तक कोई काम पूरा न हो जाए, तब तक वह हमेशा असंभव लगता है।",
    affirmation: "I can break down the toughest syllabus chapters into manageable, conquerable steps.",
    affirmationHindi: "मैं सबसे कठिन अध्यायों को भी आसान चरणों में बांटकर पूरा कर सकता हूँ।",
    morningActionTip: "Pick one difficult topic you've been postponing and study it for 20 minutes.",
    tags: ["courage", "possibility", "grit"],
  },
  {
    id: "q-8",
    quote: "Do not wait; the time will never be 'just right'. Start where you stand.",
    author: "Napoleon Hill",
    category: "focus",
    hindiTranslation: "इंतज़ार मत करो; समय कभी 'बिल्कुल सही' नहीं होगा। जहां हो वहीं से शुरू करो।",
    affirmation: "Right now is the best moment to make meaningful progress on my academic goals.",
    affirmationHindi: "मेरे शैक्षणिक लक्ष्यों पर सार्थक प्रगति करने के लिए अभी का समय सबसे उत्तम है।",
    morningActionTip: "Start your study timer immediately without waiting for perfection.",
    tags: ["momentum", "action", "now"],
  },
  {
    id: "q-9",
    quote: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
    category: "excellence",
    hindiTranslation: "सीखने की सबसे खूबसूरत बात यह है कि इसे आपसे कोई छीन नहीं सकता।",
    affirmation: "The knowledge and problem-solving skills I build today belong to me forever.",
    affirmationHindi: "आज मैं जो ज्ञान और कौशल विकसित कर रहा हूँ, वह हमेशा मेरे साथ रहेगा।",
    morningActionTip: "Write down 3 key takeaways in your Notes after your morning study block.",
    tags: ["learning", "empowerment"],
  },
  {
    id: "q-10",
    quote: "Hard work beats talent when talent fails to work hard.",
    author: "Tim Notke",
    category: "discipline",
    hindiTranslation: "कठिन परिश्रम प्रतिभा को भी हरा देता है जब प्रतिभा कठिन परिश्रम नहीं करती।",
    affirmation: "My work ethic, persistence, and preparation set me apart every single day.",
    affirmationHindi: "मेरी कड़ी मेहनत, लगन और तैयारी मुझे हर दिन बेहतर बनाती है।",
    morningActionTip: "Solve 5 practice questions or PYQs right after reading a concept.",
    tags: ["hardwork", "dedication"],
  },
  {
    id: "q-11",
    quote: "Education is the most powerful weapon which you can use to change the world.",
    author: "Dr. A.P.J. Abdul Kalam",
    category: "excellence",
    hindiTranslation: "शिक्षा सबसे शक्तिशाली हथियार है जिसका उपयोग आप दुनिया को बदलने के लिए कर सकते हैं।",
    affirmation: "I study with purpose, knowing my education empowers my dreams and my community.",
    affirmationHindi: "मैं एक बड़े उद्देश्य के साथ पढ़ता हूँ क्योंकि मेरी शिक्षा मेरे सपनों को शक्ति देती है।",
    morningActionTip: "Set a clear target score and dedicate your morning block to high-yield topics.",
    tags: ["vision", "education", "impact"],
  },
  {
    id: "q-12",
    quote: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "consistency",
    hindiTranslation: "घड़ी मत देखो; वही करो जो वह करती है। निरंतर आगे बढ़ते रहो।",
    affirmation: "I stay calm, patient, and steady as I work through my daily study targets.",
    affirmationHindi: "मैं अपने दैनिक अध्ययन लक्ष्यों को पूरा करते समय शांत और स्थिर रहता हूँ।",
    morningActionTip: "Use a 25-minute Pomodoro timer and focus on one question at a time.",
    tags: ["focus", "time", "persistence"],
  },
  {
    id: "q-13",
    quote: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    category: "mindset",
    hindiTranslation: "शुरुआत करने के लिए महान होना जरूरी नहीं, लेकिन महान होने के लिए शुरुआत करना जरूरी है।",
    affirmation: "Progress matters more than perfection; every page I study makes me stronger.",
    affirmationHindi: "पूर्णता से अधिक प्रगति महत्वपूर्ण है; हर पन्ना मुझे और सक्षम बनाता है।",
    morningActionTip: "Open your textbook to the next pending chapter and read the first page now.",
    tags: ["motivation", "beginning"],
  },
  {
    id: "q-14",
    quote: "Focus is a muscle. The more you practice deep work, the stronger it becomes.",
    author: "Cal Newport",
    category: "focus",
    hindiTranslation: "एकाग्रता एक मांसपेशी की तरह है। जितना अधिक आप गहरा काम करेंगे, यह उतनी ही मजबूत होगी।",
    affirmation: "My mind is sharp, distraction-free, and fully absorbed in deep learning today.",
    affirmationHindi: "मेरा मन आज शांत, एकाग्र और गहन अध्ययन के लिए पूरी तरह तैयार है।",
    morningActionTip: "Put your phone on silent and complete one uninterrupted deep work block.",
    tags: ["deep-work", "focus", "flow"],
  },
  {
    id: "q-15",
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
    category: "consistency",
    hindiTranslation: "समय के साथ छोटे-छोटे दैनिक सुधार आश्चर्यजनक परिणाम लाते हैं।",
    affirmation: "I am 1% better today than I was yesterday in my focus, recall, and confidence.",
    affirmationHindi: "मैं अपनी एकाग्रता और आत्मविश्वास में कल की तुलना में आज और बेहतर हूँ।",
    morningActionTip: "Keep your study streak alive by logging your morning revision session.",
    tags: ["compounding", "habits", "growth"],
  },
  {
    id: "q-16",
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "mindset",
    hindiTranslation: "विश्वास रखें कि आप कर सकते हैं, और आपने आधा रास्ता तय कर लिया है।",
    affirmation: "I trust my preparation, my capability to learn, and my resilience under pressure.",
    affirmationHindi: "मुझे अपनी तैयारी, सीखने की क्षमता और अपने आत्मविश्वास पर पूरा भरोसा है।",
    morningActionTip: "Visualize yourself calmly solving your exam paper with high accuracy.",
    tags: ["confidence", "belief"],
  },
];

/**
 * Returns the YYYY-MM-DD morning cycle key in local time.
 */
export function getMorningDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Deterministically fetch the daily motivational quote based on the calendar date
 */
export function fetchDailyQuote(dateStr?: string, category?: string): MotivationalQuote {
  const filtered =
    category && category !== "all"
      ? MOTIVATIONAL_QUOTES.filter((q) => q.category === category)
      : MOTIVATIONAL_QUOTES;

  const quotePool = filtered.length > 0 ? filtered : MOTIVATIONAL_QUOTES;

  const targetDateStr = dateStr || getMorningDateKey();
  const parts = targetDateStr.split("-").map((n) => parseInt(n, 10));
  let dayHash = 0;
  if (parts.length === 3 && !parts.some(isNaN)) {
    const [y, m, d] = parts;
    const utcCurrent = Date.UTC(y, m - 1, d);
    const utcStart = Date.UTC(y, 0, 0);
    dayHash = Math.floor((utcCurrent - utcStart) / (1000 * 60 * 60 * 24)) + y * 3;
  } else {
    const date = new Date();
    dayHash = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  const index = Math.abs(dayHash) % quotePool.length;
  return quotePool[index];
}

export interface MorningMotivationCache {
  dateKey: string;
  quote: MotivationalQuote;
  fetchedAt: number;
  affirmedToday?: boolean;
  bookmarkedIds?: string[];
}

function getMotivationStorageKey(profileId?: string): string {
  const safeProfile = profileId && profileId.trim() ? profileId.trim() : "default";
  return `garia_morning_motivation_${safeProfile}`;
}

export function loadMorningMotivationState(profileId?: string): MorningMotivationCache | null {
  try {
    const raw = localStorage.getItem(getMotivationStorageKey(profileId));
    if (!raw) return null;
    return JSON.parse(raw) as MorningMotivationCache;
  } catch {
    return null;
  }
}

export function saveMorningMotivationState(
  state: MorningMotivationCache,
  profileId?: string
): void {
  try {
    localStorage.setItem(getMotivationStorageKey(profileId), JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Fetches an inspirational quote from a public quotes API (DummyJSON Quotes API / backend proxy)
 * and enriches it with a morning student affirmation & action tip.
 */
export async function fetchQuoteFromPublicApi(
  category?: string
): Promise<MotivationalQuote | null> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return null;
  }

  const fallbackTemplate = fetchDailyQuote(undefined, category);

  // 1. Try public CORS-enabled inspirational quotes API (https://dummyjson.com/quotes/random)
  if (!category || category === "all") {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2800);
      const pubRes = await fetch("https://dummyjson.com/quotes/random", {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (pubRes.ok) {
        const pubData = await pubRes.json();
        if (pubData && typeof pubData.quote === "string" && pubData.quote.trim()) {
          return {
            id: `pub-${pubData.id || Date.now()}`,
            quote: pubData.quote.trim(),
            author:
              typeof pubData.author === "string" && pubData.author.trim()
                ? pubData.author.trim()
                : "Anonymous",
            category: fallbackTemplate.category,
            affirmation: fallbackTemplate.affirmation,
            affirmationHindi: fallbackTemplate.affirmationHindi,
            morningActionTip: fallbackTemplate.morningActionTip,
            tags: ["daily-inspiration", "morning-mindset"],
          };
        }
      }
    } catch {
      // Proceed to backend /api/motivation/daily or local fallback
    }
  }

  return null;
}

/**
 * Fetches a fresh inspirational quote & affirmation each morning.
 * Checks if today's morning quote is already cached for the current dateKey;
 * if not (or if forceRefresh is true), fetches a fresh quote from a public API / /api/motivation/daily
 * with graceful fallback to the local deterministic daily quote pool.
 */
export async function fetchMorningDailyMotivation(options?: {
  profileId?: string;
  dateKey?: string;
  category?: string;
  forceRefresh?: boolean;
  excludeId?: string;
}): Promise<{ quote: MotivationalQuote; affirmedToday: boolean; bookmarkedIds: string[]; dateKey: string }> {
  const profileId = options?.profileId;
  const todayKey = options?.dateKey || getMorningDateKey();
  const category = options?.category;
  const forceRefresh = options?.forceRefresh || false;

  const existing = loadMorningMotivationState(profileId);
  const bookmarkedIds = existing?.bookmarkedIds || [];
  const affirmedToday = existing?.dateKey === todayKey ? Boolean(existing.affirmedToday) : false;

  if (
    !forceRefresh &&
    existing &&
    existing.dateKey === todayKey &&
    existing.quote &&
    (!category || category === "all" || existing.quote.category === category)
  ) {
    return {
      quote: existing.quote,
      affirmedToday,
      bookmarkedIds,
      dateKey: todayKey,
    };
  }

  let resolvedQuote: MotivationalQuote | null = null;

  if (typeof navigator === "undefined" || navigator.onLine !== false) {
    try {
      const params = new URLSearchParams({
        date: todayKey,
        ...(category && category !== "all" ? { category } : {}),
        ...(forceRefresh ? { refresh: "true" } : {}),
        ...(options?.excludeId ? { excludeId: options.excludeId } : {}),
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`/api/motivation/daily?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && data.quote && data.quote.quote && data.quote.author) {
          resolvedQuote = data.quote as MotivationalQuote;
        }
      }
    } catch {
      // Try public quote API directly if server endpoint is unreachable
    }

    if (!resolvedQuote) {
      resolvedQuote = await fetchQuoteFromPublicApi(category);
    }
  }

  if (!resolvedQuote) {
    if (forceRefresh) {
      const pool =
        category && category !== "all"
          ? MOTIVATIONAL_QUOTES.filter((q) => q.category === category)
          : MOTIVATIONAL_QUOTES;
      const candidates = pool.filter((q) => q.id !== options?.excludeId);
      const activePool = candidates.length > 0 ? candidates : pool.length > 0 ? pool : MOTIVATIONAL_QUOTES;
      resolvedQuote = activePool[Math.floor(Math.random() * activePool.length)];
    } else {
      resolvedQuote = fetchDailyQuote(todayKey, category);
    }
  }

  const nextState: MorningMotivationCache = {
    dateKey: todayKey,
    quote: resolvedQuote,
    fetchedAt: Date.now(),
    affirmedToday,
    bookmarkedIds,
  };
  saveMorningMotivationState(nextState, profileId);

  return {
    quote: resolvedQuote,
    affirmedToday,
    bookmarkedIds,
    dateKey: todayKey,
  };
}

/**
 * Fetch the next quote in sequence for periodic cycling
 */
export function fetchNextQuote(currentIndex: number, category?: string): { quote: MotivationalQuote; index: number } {
  const filtered =
    category && category !== "all"
      ? MOTIVATIONAL_QUOTES.filter((q) => q.category === category)
      : MOTIVATIONAL_QUOTES;

  const quotePool = filtered.length > 0 ? filtered : MOTIVATIONAL_QUOTES;
  const nextIndex = (currentIndex + 1) % quotePool.length;
  return {
    quote: quotePool[nextIndex],
    index: nextIndex,
  };
}

/**
 * Fetch a random quote, optionally excluding a specific index
 */
export function fetchRandomQuote(excludeIndex?: number): { quote: MotivationalQuote; index: number } {
  if (MOTIVATIONAL_QUOTES.length <= 1) {
    return { quote: MOTIVATIONAL_QUOTES[0], index: 0 };
  }

  let nextIdx: number;
  do {
    nextIdx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  } while (excludeIndex !== undefined && nextIdx === excludeIndex);

  return {
    quote: MOTIVATIONAL_QUOTES[nextIdx],
    index: nextIdx,
  };
}

/**
 * Get all available motivational quotes
 */
export function fetchAllQuotes(): MotivationalQuote[] {
  return [...MOTIVATIONAL_QUOTES];
}
