export interface MotivationalQuote {
  id: string;
  quote: string;
  author: string;
  category: "focus" | "resilience" | "consistency" | "excellence" | "discipline" | "mindset";
  hindiTranslation?: string;
  tags?: string[];
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    id: "q-1",
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    category: "focus",
    hindiTranslation: "आगे बढ़ने का राज़ बस शुरुआत करना है।",
    tags: ["action", "start", "productivity"],
  },
  {
    id: "q-2",
    quote: "Continuous effort – not strength or intelligence – is the key to unlocking our potential.",
    author: "Winston Churchill",
    category: "consistency",
    hindiTranslation: "लगातार प्रयास ही हमारी वास्तविक क्षमता को उजागर करने की कुंजी है।",
    tags: ["grit", "perseverance", "effort"],
  },
  {
    id: "q-3",
    quote: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
    category: "consistency",
    hindiTranslation: "सफलता हर दिन दोहराए जाने वाले छोटे-छोटे प्रयासों का जोड़ है।",
    tags: ["habits", "daily", "success"],
  },
  {
    id: "q-4",
    quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
    category: "excellence",
    hindiTranslation: "ऐसे जियो जैसे कल तुम्हारा अंतिम दिन हो। ऐसे सीखो जैसे तुम्हें हमेशा जीना हो।",
    tags: ["learning", "wisdom", "education"],
  },
  {
    id: "q-5",
    quote: "Discipline is the bridge between goals and accomplishment.",
    author: "Jim Rohn",
    category: "discipline",
    hindiTranslation: "अनुशासन ही लक्ष्यों और उपलब्धियों के बीच का सेतु है।",
    tags: ["discipline", "goals", "mastery"],
  },
  {
    id: "q-6",
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
    category: "excellence",
    hindiTranslation: "ज्ञान में किया गया निवेश जीवन में सबसे अच्छा प्रतिफल देता है।",
    tags: ["knowledge", "growth", "study"],
  },
  {
    id: "q-7",
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
    category: "resilience",
    hindiTranslation: "जब तक कोई काम पूरा न हो जाए, तब तक वह हमेशा असंभव लगता है।",
    tags: ["courage", "possibility", "grit"],
  },
  {
    id: "q-8",
    quote: "Do not wait; the time will never be 'just right'. Start where you stand.",
    author: "Napoleon Hill",
    category: "focus",
    hindiTranslation: "इंतज़ार मत करो; समय कभी 'बिल्कुल सही' नहीं होगा। जहां हो वहीं से शुरू करो।",
    tags: ["momentum", "action", "now"],
  },
  {
    id: "q-9",
    quote: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
    category: "excellence",
    hindiTranslation: "सीखने की सबसे खूबसूरत बात यह है कि इसे आपसे कोई छीन नहीं सकता।",
    tags: ["learning", "empowerment"],
  },
  {
    id: "q-10",
    quote: "Hard work beats talent when talent fails to work hard.",
    author: "Tim Notke",
    category: "discipline",
    hindiTranslation: "कठिन परिश्रम प्रतिभा को भी हरा देता है जब प्रतिभा कठिन परिश्रम नहीं करती।",
    tags: ["hardwork", "dedication"],
  },
  {
    id: "q-11",
    quote: "Education is the most powerful weapon which you can use to change the world.",
    author: "Dr. A.P.J. Abdul Kalam",
    category: "excellence",
    hindiTranslation: "शिक्षा सबसे शक्तिशाली हथियार है जिसका उपयोग आप दुनिया को बदलने के लिए कर सकते हैं।",
    tags: ["vision", "education", "impact"],
  },
  {
    id: "q-12",
    quote: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "consistency",
    hindiTranslation: "घड़ी मत देखो; वही करो जो वह करती है। निरंतर आगे बढ़ते रहो।",
    tags: ["focus", "time", "persistence"],
  },
  {
    id: "q-13",
    quote: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    category: "mindset",
    hindiTranslation: "शुरुआत करने के लिए महान होना जरूरी नहीं, लेकिन महान होने के लिए शुरुआत करना जरूरी है।",
    tags: ["motivation", "beginning"],
  },
  {
    id: "q-14",
    quote: "Focus is a muscle. The more you practice deep work, the stronger it becomes.",
    author: "Cal Newport",
    category: "focus",
    hindiTranslation: "एकाग्रता एक मांसपेशी की तरह है। जितना अधिक आप गहरा काम करेंगे, यह उतनी ही मजबूत होगी।",
    tags: ["deep-work", "focus", "flow"],
  },
  {
    id: "q-15",
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
    category: "consistency",
    hindiTranslation: "समय के साथ छोटे-छोटे दैनिक सुधार आश्चर्यजनक परिणाम लाते हैं।",
    tags: ["compounding", "habits", "growth"],
  },
  {
    id: "q-16",
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "mindset",
    hindiTranslation: "विश्वास रखें कि आप कर सकते हैं, और आपने आधा रास्ता तय कर लिया है।",
    tags: ["confidence", "belief"],
  },
];

/**
 * Deterministically fetch the daily motivational quote based on the current calendar date
 */
export function fetchDailyQuote(dateStr?: string, category?: string): MotivationalQuote {
  const filtered = category
    ? MOTIVATIONAL_QUOTES.filter((q) => q.category === category)
    : MOTIVATIONAL_QUOTES;

  const quotePool = filtered.length > 0 ? filtered : MOTIVATIONAL_QUOTES;

  const date = dateStr ? new Date(dateStr) : new Date();
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const index = Math.abs(dayOfYear) % quotePool.length;
  return quotePool[index];
}

/**
 * Fetch the next quote in sequence for periodic cycling
 */
export function fetchNextQuote(currentIndex: number, category?: string): { quote: MotivationalQuote; index: number } {
  const filtered = category
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
