import {
  TopicMCQ,
  ChapterPYQ,
  PracticeQuestion,
  QuestionBankProfileProgress,
  MCQAttemptRecord,
} from "../types";

// ==========================================
// GARIA OS V2.6 SEED QUESTION DATASET
// Hierarchy: Class -> Subject -> Chapter -> Topic
// ==========================================

export const SEED_MCQS: TopicMCQ[] = [
  // ----------------------------------------
  // CLASS 10 MATHEMATICS
  // ----------------------------------------
  {
    id: "mcq-c10-math-1-1-1",
    classLevel: "Class 10",
    subjectName: "Mathematics",
    chapterTitle: "Real Numbers",
    topicName: "Euclid's Division Lemma",
    questionText: "According to Euclid's Division Lemma, for positive integers a and b, there exist unique integers q and r such that a = bq + r, where r satisfies:",
    options: [
      "0 < r < b",
      "0 ≤ r < b",
      "0 < r ≤ b",
      "0 ≤ r ≤ b"
    ],
    correctOptionIndex: 1,
    explanation: "In Euclid's Division Lemma, the remainder r is non-negative and strictly smaller than the divisor b, i.e., 0 ≤ r < b.",
    difficulty: "Easy",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Real Numbers", "Lemma"]
  },
  {
    id: "mcq-c10-math-1-1-2",
    classLevel: "Class 10",
    subjectName: "Mathematics",
    chapterTitle: "Real Numbers",
    topicName: "Euclid's Division Lemma",
    questionText: "If HCF(135, 225) is expressed in the form 225 × 5 + 135 × x, then the value of x is:",
    options: [
      "-8",
      "8",
      "-4",
      "4"
    ],
    correctOptionIndex: 0,
    explanation: "HCF(135, 225) = 45. Solving 45 = 225(5) + 135(x) => 45 = 1125 + 135x => 135x = -1080 => x = -8.",
    difficulty: "Medium",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Real Numbers", "HCF"]
  },
  {
    id: "mcq-c10-math-1-2-1",
    classLevel: "Class 10",
    subjectName: "Mathematics",
    chapterTitle: "Real Numbers",
    topicName: "Fundamental Theorem of Arithmetic",
    questionText: "Every composite number can be uniquely expressed as a product of primes, apart from the order in which prime factors occur. This is known as:",
    options: [
      "Euclid's Division Lemma",
      "Fundamental Theorem of Arithmetic",
      "Fundamental Theorem of Algebra",
      "Remainder Theorem"
    ],
    correctOptionIndex: 1,
    explanation: "The Fundamental Theorem of Arithmetic guarantees unique prime factorization for composite numbers.",
    difficulty: "Easy",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Prime Factorization"]
  },
  {
    id: "mcq-c10-math-1-2-2",
    classLevel: "Class 10",
    subjectName: "Mathematics",
    chapterTitle: "Real Numbers",
    topicName: "Fundamental Theorem of Arithmetic",
    questionText: "The exponent of 5 in the prime factorization of 3750 is:",
    options: [
      "2",
      "3",
      "4",
      "5"
    ],
    correctOptionIndex: 2,
    explanation: "3750 = 2 × 3 × 5⁴. Therefore, the exponent of 5 is 4.",
    difficulty: "Medium",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Factorization"]
  },

  // ----------------------------------------
  // CLASS 10 SCIENCE
  // ----------------------------------------
  {
    id: "mcq-c10-sci-1-1-1",
    classLevel: "Class 10",
    subjectName: "Science",
    chapterTitle: "Life Processes",
    topicName: "Autotrophic Nutrition",
    questionText: "Which gas is released as a byproduct during photosynthesis by autotrophs?",
    options: [
      "Carbon dioxide",
      "Oxygen",
      "Nitrogen",
      "Hydrogen"
    ],
    correctOptionIndex: 1,
    explanation: "Water molecules undergo photolysis during photosynthesis, releasing Oxygen (O₂) as a byproduct.",
    difficulty: "Easy",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Photosynthesis", "Biology"]
  },
  {
    id: "mcq-c10-sci-1-2-1",
    classLevel: "Class 10",
    subjectName: "Science",
    chapterTitle: "Life Processes",
    topicName: "Respiration & Transpiration",
    questionText: "In human lungs, the exchange of gases takes place in:",
    options: [
      "Trachea",
      "Bronchi",
      "Alveoli",
      "Larynx"
    ],
    correctOptionIndex: 2,
    explanation: "Alveoli provide a large surface area with thin walls lined with blood capillaries where gas exchange occurs.",
    difficulty: "Easy",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Human Physiology"]
  },

  // ----------------------------------------
  // CLASS 11 PHYSICS
  // ----------------------------------------
  {
    id: "mcq-c11-phy-1-1-1",
    classLevel: "Class 11",
    subjectName: "Physics",
    chapterTitle: "Units and Measurements",
    topicName: "Dimensional Analysis",
    questionText: "Which of the following physical quantities has the dimensional formula [M L T⁻²]?",
    options: [
      "Work",
      "Force",
      "Power",
      "Impulse"
    ],
    correctOptionIndex: 1,
    explanation: "Force = mass × acceleration = [M] × [L T⁻²] = [M L T⁻²].",
    difficulty: "Easy",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Dimensions", "Mechanics"]
  },
  {
    id: "mcq-c11-phy-1-1-2",
    classLevel: "Class 11",
    subjectName: "Physics",
    chapterTitle: "Units and Measurements",
    topicName: "Dimensional Analysis",
    questionText: "If Energy (E), Velocity (V) and Time (T) are chosen as fundamental quantities, the dimensions of Surface Tension are:",
    options: [
      "[E V⁻² T⁻²]",
      "[E V⁻¹ T⁻²]",
      "[E V⁻² T⁻¹]",
      "[E² V⁻¹ T⁻²]"
    ],
    correctOptionIndex: 0,
    explanation: "Surface Tension = Force/Length = [M T⁻²]. Expressing in E, V, T yields [E V⁻² T⁻²].",
    difficulty: "Hard",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Dimensions"]
  },

  // ----------------------------------------
  // CLASS 12 ACCOUNTANCY
  // ----------------------------------------
  {
    id: "mcq-c12-acc-1-1-1",
    classLevel: "Class 12",
    subjectName: "Accountancy",
    chapterTitle: "Partnership Fundamentals",
    topicName: "Profit & Loss Appropriation",
    questionText: "In the absence of a partnership deed, the rate of interest allowed on a partner's loan to the firm is:",
    options: [
      "6% p.a.",
      "12% p.a.",
      "No interest allowed",
      "10% p.a."
    ],
    correctOptionIndex: 0,
    explanation: "Under the Indian Partnership Act 1932, if no deed exists, partners are entitled to 6% p.a. interest on loans advanced to the firm.",
    difficulty: "Easy",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Partnership", "Interest on Loan"]
  },
  {
    id: "mcq-c12-acc-1-2-1",
    classLevel: "Class 12",
    subjectName: "Accountancy",
    chapterTitle: "Admission of a Partner",
    topicName: "Calculation of Sacrificing Ratio",
    questionText: "A and B are partners sharing profits in the ratio 3:2. C is admitted for a 1/5th share. The sacrificing ratio between A and B, if not specified otherwise, is:",
    options: [
      "1:1",
      "3:2",
      "2:3",
      "3:1"
    ],
    correctOptionIndex: 1,
    explanation: "When a new partner acquires a share without specified proportions, old partners sacrifice in their old profit sharing ratio (3:2).",
    difficulty: "Medium",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Admission", "Sacrificing Ratio"]
  },
  {
    id: "mcq-c12-acc-1-2-2",
    classLevel: "Class 12",
    subjectName: "Accountancy",
    chapterTitle: "Admission of a Partner",
    topicName: "Revaluation of Assets and Liabilities",
    questionText: "Unrecorded assets when brought into books at the time of admission of a partner are credited to:",
    options: [
      "Old Partners' Capital Accounts",
      "Revaluation Account",
      "New Partner's Capital Account",
      "Profit & Loss Appropriation Account"
    ],
    correctOptionIndex: 1,
    explanation: "Increase in asset value or unrecorded assets are credited to the Revaluation Account.",
    difficulty: "Medium",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Revaluation", "Admission"]
  },

  // ----------------------------------------
  // CLASS 12 PHYSICS
  // ----------------------------------------
  {
    id: "mcq-c12-phy-1-1-1",
    classLevel: "Class 12",
    subjectName: "Physics",
    chapterTitle: "Electrostatics",
    topicName: "Gauss's Law Applications",
    questionText: "The electric flux through a closed Gaussian surface enclosing a electric dipole is:",
    options: [
      "q / ε₀",
      "2q / ε₀",
      "Zero",
      "Depends on the size of the surface"
    ],
    correctOptionIndex: 2,
    explanation: "An electric dipole consists of equal and opposite charges (+q and -q). Total net enclosed charge = 0, so by Gauss's Law, total flux = 0.",
    difficulty: "Easy",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Gauss Law", "Dipole"]
  },

  // ----------------------------------------
  // CLASS 12 ECONOMICS
  // ----------------------------------------
  {
    id: "mcq-c12-eco-1-1-1",
    classLevel: "Class 12",
    subjectName: "Economics",
    chapterTitle: "National Income Accounting",
    topicName: "Value Added Method",
    questionText: "Gross Value Added at market price (GVA_mp) equals:",
    options: [
      "Value of Output - Intermediate Consumption",
      "Value of Output + Intermediate Consumption",
      "Net Value Added - Depreciation",
      "GDP_mp + Subsidies"
    ],
    correctOptionIndex: 0,
    explanation: "GVA at market price is calculated as total Value of Output minus Intermediate Consumption.",
    difficulty: "Easy",
    sourceType: "SAMPLE PRACTICE",
    tags: ["National Income", "Macroeconomics"]
  }
];

// ==========================================
// SEED CHAPTER-WISE PYQs (VERIFIED PREVIOUS YEAR QUESTIONS)
// ==========================================

export const SEED_PYQS: ChapterPYQ[] = [
  // ----------------------------------------
  // CLASS 10 SCIENCE
  // ----------------------------------------
  {
    id: "pyq-c10-sci-lp-2024",
    classLevel: "Class 10",
    subjectName: "Science",
    chapterTitle: "Life Processes",
    year: 2024,
    board: "CBSE",
    questionText: "State the role of hydrochloric acid (HCl) produced in the human stomach during digestion. Why does it not damage the stomach lining under normal conditions?",
    questionType: "Short Answer",
    marks: 3,
    answerSolution: "1. Role of HCl: Creates an acidic medium (pH ~1.5-2) necessary for activation of pepsinogen to pepsin; kills harmful bacteria ingested with food.\n2. Protection: The inner mucosal lining secretes a thick layer of mucus which shields stomach walls from acid erosion.",
    difficulty: "Medium",
    sourceType: "VERIFIED PYQ"
  },
  {
    id: "pyq-c10-sci-lp-2023",
    classLevel: "Class 10",
    subjectName: "Science",
    chapterTitle: "Life Processes",
    year: 2023,
    board: "CBSE",
    questionText: "Differentiate between aerobic and anaerobic respiration based on location in cell, end products, and energy yield.",
    questionType: "Short Answer",
    marks: 3,
    answerSolution: "Aerobic: Occurs in Cytoplasm + Mitochondria; End products CO₂ and H₂O; High energy yield (38 ATP).\nAnaerobic: Occurs in Cytoplasm; End products Ethanol/Lactic acid + CO₂; Low energy yield (2 ATP).",
    difficulty: "Easy",
    sourceType: "VERIFIED PYQ"
  },

  // ----------------------------------------
  // CLASS 10 MATHEMATICS
  // ----------------------------------------
  {
    id: "pyq-c10-math-rn-2024",
    classLevel: "Class 10",
    subjectName: "Mathematics",
    chapterTitle: "Real Numbers",
    year: 2024,
    board: "CBSE",
    questionText: "Prove that √5 is an irrational number.",
    questionType: "Long Answer",
    marks: 5,
    answerSolution: "Proof by contradiction: Assume √5 = a/b where a, b are co-prime integers (b ≠ 0). 5 = a²/b² => a² = 5b². Thus 5 divides a², so 5 divides a. Let a = 5c => (5c)² = 5b² => 25c² = 5b² => b² = 5c². Thus 5 divides b. This contradicts that a and b are co-prime. Hence, √5 is irrational.",
    difficulty: "Medium",
    sourceType: "VERIFIED PYQ"
  },
  {
    id: "pyq-c10-math-rn-2022",
    classLevel: "Class 10",
    subjectName: "Mathematics",
    chapterTitle: "Real Numbers",
    year: 2022,
    board: "CBSE",
    questionText: "Find the largest number which divides 70 and 125, leaving remainders 5 and 8 respectively.",
    questionType: "Short Answer",
    marks: 3,
    answerSolution: "Required number = HCF(70 - 5, 125 - 8) = HCF(65, 117). Prime factors: 65 = 5 × 13, 117 = 3² × 13. HCF = 13. Thus, the required number is 13.",
    difficulty: "Medium",
    sourceType: "VERIFIED PYQ"
  },

  // ----------------------------------------
  // CLASS 12 ACCOUNTANCY
  // ----------------------------------------
  {
    id: "pyq-c12-acc-pf-2024",
    classLevel: "Class 12",
    subjectName: "Accountancy",
    chapterTitle: "Partnership Fundamentals",
    year: 2024,
    board: "CBSE",
    questionText: "A, B and C were partners sharing profits equally. C retired on 31st March 2024. Capital accounts of A, B and C showed credit balances of ₹2,00,000, ₹1,50,000 and ₹1,00,000 respectively after all adjustments. Calculate C's share of goodwill if goodwill of the firm is valued at ₹90,000.",
    questionType: "Numerical",
    marks: 3,
    answerSolution: "C's share of goodwill = ₹90,000 × (1/3) = ₹30,000. This ₹30,000 will be debited to remaining partners A and B in their gaining ratio (1:1), ₹15,000 each.",
    difficulty: "Medium",
    sourceType: "VERIFIED PYQ"
  },
  {
    id: "pyq-c12-acc-ap-2023",
    classLevel: "Class 12",
    subjectName: "Accountancy",
    chapterTitle: "Admission of a Partner",
    year: 2023,
    board: "CBSE",
    questionText: "Explain the accounting treatment of Accumulated Profits and Reserves appearing in the Balance Sheet at the time of admission of a new partner.",
    questionType: "Short Answer",
    marks: 4,
    answerSolution: "Accumulated profits, General Reserve, and Reserve Funds are transferred to Old Partners' Capital/Current Accounts in their OLD profit sharing ratio by crediting their capital accounts and debiting Reserve accounts.",
    difficulty: "Easy",
    sourceType: "VERIFIED PYQ"
  },

  // ----------------------------------------
  // CLASS 12 PHYSICS
  // ----------------------------------------
  {
    id: "pyq-c12-phy-elec-2024",
    classLevel: "Class 12",
    subjectName: "Physics",
    chapterTitle: "Electrostatics",
    year: 2024,
    board: "CBSE",
    questionText: "Derive an expression for the electric field at a point on the equatorial line of a short electric dipole of dipole moment P.",
    questionType: "Long Answer",
    marks: 5,
    answerSolution: "E_equatorial = (1 / 4πε₀) × (p / (r² + a²)^(3/2)). For a short dipole (r >> a), E_equatorial = (1 / 4πε₀) × (p / r³), directed opposite to dipole moment p.",
    difficulty: "Hard",
    sourceType: "VERIFIED PYQ"
  }
];

// ==========================================
// SEED PRACTICE QUESTIONS (CHAPTER & TOPIC WISE)
// ==========================================

export const SEED_PRACTICE_QUESTIONS: PracticeQuestion[] = [
  // ----------------------------------------
  // CLASS 10 MATHEMATICS
  // ----------------------------------------
  {
    id: "prac-c10-math-rn-1",
    classLevel: "Class 10",
    subjectName: "Mathematics",
    chapterTitle: "Real Numbers",
    topicName: "Euclid's Division Lemma",
    questionText: "Explain why 7 × 11 × 13 + 13 is a composite number.",
    questionType: "Conceptual",
    marks: 2,
    answerSolution: "7 × 11 × 13 + 13 = 13 × (7 × 11 + 1) = 13 × (77 + 1) = 13 × 78 = 13 × 13 × 6. Since it has factors other than 1 and itself (13, 6, 2, 3), it is a composite number.",
    difficulty: "Easy",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Real Numbers", "Composite"]
  },
  {
    id: "prac-c10-math-rn-2",
    classLevel: "Class 10",
    subjectName: "Mathematics",
    chapterTitle: "Real Numbers",
    topicName: "Fundamental Theorem of Arithmetic",
    questionText: "Find the HCF and LCM of 96 and 404 by prime factorization method and verify that HCF × LCM = Product of the two numbers.",
    questionType: "Numerical",
    marks: 3,
    answerSolution: "96 = 2⁵ × 3, 404 = 2² × 101. HCF = 2² = 4. LCM = 2⁵ × 3 × 101 = 9696. Verification: HCF × LCM = 4 × 9696 = 38784. Product = 96 × 404 = 38784. Verified.",
    difficulty: "Medium",
    sourceType: "SAMPLE PRACTICE",
    tags: ["HCF", "LCM"]
  },

  // ----------------------------------------
  // CLASS 10 SCIENCE
  // ----------------------------------------
  {
    id: "prac-c10-sci-lp-1",
    classLevel: "Class 10",
    subjectName: "Science",
    chapterTitle: "Life Processes",
    topicName: "Autotrophic Nutrition",
    questionText: "Write a balanced chemical equation for photosynthesis and mention three events that occur during this process.",
    questionType: "Short Answer",
    marks: 3,
    answerSolution: "Equation: 6CO₂ + 12H₂O + Sunlight/Chlorophyll → C₆H₁₂O₆ + 6O₂ + 6H₂O.\nEvents:\n1. Absorption of light energy by chlorophyll.\n2. Conversion of light energy to chemical energy & splitting of water molecules.\n3. Reduction of carbon dioxide to carbohydrates.",
    difficulty: "Medium",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Photosynthesis"]
  },

  // ----------------------------------------
  // CLASS 12 ACCOUNTANCY
  // ----------------------------------------
  {
    id: "prac-c12-acc-pf-1",
    classLevel: "Class 12",
    subjectName: "Accountancy",
    chapterTitle: "Partnership Fundamentals",
    topicName: "Profit & Loss Appropriation",
    questionText: "Pass necessary journal entries for interest on capital allowed to partners when capital accounts are maintained under (a) Fixed Capital Method, and (b) Fluctuating Capital Method.",
    questionType: "Short Answer",
    marks: 3,
    answerSolution: "(a) Fixed Capital Method: Interest on Capital A/c Dr. to Partners' Current Accounts.\n(b) Fluctuating Capital Method: Interest on Capital A/c Dr. to Partners' Capital Accounts.",
    difficulty: "Medium",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Journal Entries", "Partnership"]
  },
  {
    id: "prac-c12-acc-ap-1",
    classLevel: "Class 12",
    subjectName: "Accountancy",
    chapterTitle: "Admission of a Partner",
    topicName: "Admission of a Partner",
    questionText: "Define Sacrificing Ratio and state its formula. Why is Sacrificing Ratio calculated on the admission of a partner?",
    questionType: "Conceptual",
    marks: 2,
    answerSolution: "Sacrificing Ratio = Old Share - New Share. It represents the proportion in which old partners forego their profit share in favor of the new partner, so premium for goodwill brought by the incoming partner can be distributed fairly.",
    difficulty: "Easy",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Sacrificing Ratio"]
  },

  // ----------------------------------------
  // CLASS 12 PHYSICS
  // ----------------------------------------
  {
    id: "prac-c12-phy-elec-1",
    classLevel: "Class 12",
    subjectName: "Physics",
    chapterTitle: "Electrostatics",
    topicName: "Gauss's Law Applications",
    questionText: "Two point charges +q and -2q are placed at points (a,0,0) and (4a,0,0) respectively. Find the magnitude and direction of the net electric field at the origin.",
    questionType: "Numerical",
    marks: 3,
    answerSolution: "Field due to +q at origin E₁ = (q / 4πε₀ a²) along -x axis.\nField due to -2q at origin E₂ = (2q / 4πε₀ (4a)²) = (q / 32πε₀ a²) along +x axis.\nNet E = E₁ - E₂ = (31 q / 128πε₀ a²) along -x axis.",
    difficulty: "Hard",
    sourceType: "SAMPLE PRACTICE",
    tags: ["Electric Field", "Vector"]
  }
];

// ==========================================
// STORAGE & PROGRESS MANAGEMENT
// ==========================================

export function loadQuestionBankProgress(profileId: string): QuestionBankProfileProgress {
  const storageKey = `garia_question_progress_${profileId}`;
  try {
    const dataStr = localStorage.getItem(storageKey);
    if (dataStr) {
      return JSON.parse(dataStr);
    }
  } catch (e) {
    console.error("Failed to parse question bank progress:", e);
  }

  return {
    profileId,
    mcqAttempts: {},
    mcqBookmarks: [],
    practiceCompleted: [],
    practiceBookmarks: [],
    pyqCompleted: [],
    pyqBookmarks: [],
    updatedAt: Date.now(),
  };
}

export function saveQuestionBankProgress(
  progress: QuestionBankProfileProgress,
  profileId: string
): void {
  const storageKey = `garia_question_progress_${profileId}`;
  try {
    const updated = { ...progress, updatedAt: Date.now() };
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save question bank progress:", e);
  }
}

export function recordMCQAttempt(
  profileId: string,
  mcqId: string,
  selectedOption: number,
  isCorrect: boolean
): QuestionBankProfileProgress {
  const current = loadQuestionBankProgress(profileId);
  const updatedRecord: MCQAttemptRecord = {
    mcqId,
    selectedOption,
    isCorrect,
    attemptedAt: Date.now(),
  };

  const updated: QuestionBankProfileProgress = {
    ...current,
    mcqAttempts: {
      ...current.mcqAttempts,
      [mcqId]: updatedRecord,
    },
    updatedAt: Date.now(),
  };

  saveQuestionBankProgress(updated, profileId);
  return updated;
}

export function toggleQuestionBookmark(
  profileId: string,
  itemType: "MCQ" | "PRACTICE" | "PYQ",
  itemId: string
): QuestionBankProfileProgress {
  const current = loadQuestionBankProgress(profileId);
  let updatedBookmarks: string[] = [];

  if (itemType === "MCQ") {
    const exists = current.mcqBookmarks.includes(itemId);
    updatedBookmarks = exists
      ? current.mcqBookmarks.filter((id) => id !== itemId)
      : [...current.mcqBookmarks, itemId];
    current.mcqBookmarks = updatedBookmarks;
  } else if (itemType === "PRACTICE") {
    const exists = current.practiceBookmarks.includes(itemId);
    updatedBookmarks = exists
      ? current.practiceBookmarks.filter((id) => id !== itemId)
      : [...current.practiceBookmarks, itemId];
    current.practiceBookmarks = updatedBookmarks;
  } else {
    const exists = current.pyqBookmarks.includes(itemId);
    updatedBookmarks = exists
      ? current.pyqBookmarks.filter((id) => id !== itemId)
      : [...current.pyqBookmarks, itemId];
    current.pyqBookmarks = updatedBookmarks;
  }

  saveQuestionBankProgress(current, profileId);
  return current;
}

export function toggleItemCompleted(
  profileId: string,
  itemType: "PRACTICE" | "PYQ",
  itemId: string
): QuestionBankProfileProgress {
  const current = loadQuestionBankProgress(profileId);

  if (itemType === "PRACTICE") {
    const exists = current.practiceCompleted.includes(itemId);
    current.practiceCompleted = exists
      ? current.practiceCompleted.filter((id) => id !== itemId)
      : [...current.practiceCompleted, itemId];
  } else {
    const exists = current.pyqCompleted.includes(itemId);
    current.pyqCompleted = exists
      ? current.pyqCompleted.filter((id) => id !== itemId)
      : [...current.pyqCompleted, itemId];
  }

  saveQuestionBankProgress(current, profileId);
  return current;
}

// ==========================================
// REAL DATA COUNT CALCULATOR
// ==========================================

export function calculateRealQuestionCounts(
  classLevel?: string,
  subjectName?: string,
  chapterTitle?: string,
  topicName?: string
) {
  let mcqList = SEED_MCQS;
  let pyqList = SEED_PYQS;
  let pracList = SEED_PRACTICE_QUESTIONS;

  if (classLevel && classLevel !== "ALL") {
    mcqList = mcqList.filter((m) => m.classLevel.toLowerCase() === classLevel.toLowerCase());
    pyqList = pyqList.filter((p) => p.classLevel.toLowerCase() === classLevel.toLowerCase());
    pracList = pracList.filter((pr) => pr.classLevel.toLowerCase() === classLevel.toLowerCase());
  }

  if (subjectName && subjectName !== "ALL") {
    mcqList = mcqList.filter((m) => m.subjectName.toLowerCase().includes(subjectName.toLowerCase()) || subjectName.toLowerCase().includes(m.subjectName.toLowerCase()));
    pyqList = pyqList.filter((p) => p.subjectName.toLowerCase().includes(subjectName.toLowerCase()) || subjectName.toLowerCase().includes(p.subjectName.toLowerCase()));
    pracList = pracList.filter((pr) => pr.subjectName.toLowerCase().includes(subjectName.toLowerCase()) || subjectName.toLowerCase().includes(pr.subjectName.toLowerCase()));
  }

  if (chapterTitle && chapterTitle !== "ALL") {
    mcqList = mcqList.filter((m) => m.chapterTitle.toLowerCase() === chapterTitle.toLowerCase());
    pyqList = pyqList.filter((p) => p.chapterTitle.toLowerCase() === chapterTitle.toLowerCase());
    pracList = pracList.filter((pr) => pr.chapterTitle.toLowerCase() === chapterTitle.toLowerCase());
  }

  if (topicName && topicName !== "ALL") {
    mcqList = mcqList.filter((m) => m.topicName.toLowerCase() === topicName.toLowerCase());
    pracList = pracList.filter((pr) => pr.topicName && pr.topicName.toLowerCase() === topicName.toLowerCase());
  }

  return {
    mcqCount: mcqList.length,
    pyqCount: pyqList.length,
    practiceCount: pracList.length,
    totalCount: mcqList.length + pyqList.length + pracList.length,
  };
}
