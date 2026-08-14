// =======================================================================
// GARIA OS V3.0 MASTER CURRICULUM DATASET
// Complete NCERT / CBSE Academic Hierarchy for:
// - Class 10 (Math, Science, Social Science, English, Hindi, Sanskrit)
// - Class 11 Science (Physics, Chem, Math, Bio, English)
// - Class 11 Commerce (Accountancy, Business Studies, Economics, English)
// - Class 11 Arts (History, Political Science, Geography, Economics, English)
// - Class 12 Science (Physics, Chem, Math, Bio, English)
// - Class 12 Commerce (Accountancy, Business Studies, Economics, English)
// - Class 12 Arts (History, Political Science, Geography, Sociology, English)
// =======================================================================

import { StreamType } from "../types";

export interface CurriculumTopic {
  id: string;
  name: string;
  keyConcepts: string[];
  vviPoints: string[];
  summaryNote: string;
  bookReference: string;
  formulasOrRules?: string[];
}

export interface CurriculumChapter {
  id: string;
  chapterNumber: number;
  title: string;
  priority: "VVI" | "Important" | "Normal";
  topics: CurriculumTopic[];
  notesSummary: string;
  bookChapterTitle: string;
  resourceLinks: { title: string; type: "Mindmap" | "Formula Sheet" | "NCERT Book" | "Quick CheatSheet"; description: string }[];
}

export interface CurriculumSubject {
  id: string;
  name: string;
  code: string;
  stream: StreamType;
  classLevel: "Class 10" | "Class 11" | "Class 12";
  color: string;
  iconName: string;
  chapters: CurriculumChapter[];
}


// -----------------------------------------------------------------------
// 1. CLASS 10 CURRICULUM
// -----------------------------------------------------------------------

export const CLASS10_CURRICULUM: CurriculumSubject[] = [
  {
    id: "sub-c10-math",
    name: "Mathematics",
    code: "MATH-041",
    stream: "General",
    classLevel: "Class 10",
    color: "blue",
    iconName: "Calculator",
    chapters: [
      {
        id: "ch-c10-m-1",
        chapterNumber: 1,
        title: "Real Numbers",
        priority: "VVI",
        notesSummary: "Fundamental Theorem of Arithmetic states that every composite number can be uniquely factored as a product of primes. Proving irrationality of √2, √3, √5 using contradiction method.",
        bookChapterTitle: "NCERT Class 10 Maths Chapter 1: Real Numbers",
        resourceLinks: [
          { title: "Fundamental Theorem Mindmap", type: "Mindmap", description: "Visual branch of prime factorization and LCM/HCF relations." },
          { title: "Prime Factorization Formula Sheet", type: "Formula Sheet", description: "HCF(a,b) × LCM(a,b) = a × b formula breakdown." },
          { title: "NCERT Textbook Chapter 1", type: "NCERT Book", description: "Complete digital chapter with solved theorems." },
        ],
        topics: [
          {
            id: "top-c10-m-1-1",
            name: "Fundamental Theorem of Arithmetic",
            keyConcepts: ["Prime Factorization", "Unique factorization for composite numbers", "LCM and HCF properties"],
            vviPoints: ["HCF × LCM = Product of two numbers", "Exponent of prime factors in factorization"],
            summaryNote: "Every composite number can be written as the product of powers of primes uniquely, apart from the order in which prime factors occur.",
            bookReference: "NCERT Class 10 Maths - Section 1.2",
            formulasOrRules: ["LCM(a, b) = (a × b) / HCF(a, b)", "If p divides a², then p divides a (where p is prime)"],
          },
          {
            id: "top-c10-m-1-2",
            name: "Revisiting Irrational Numbers",
            keyConcepts: ["Proof by contradiction", "Proving √2, √3, √5 irrational", "Sum and product of rational & irrational"],
            vviPoints: ["Direct 3-mark proof question guaranteed in CBSE board exam"],
            summaryNote: "Assume √p is rational (= a/b where a and b are co-prime). Show both a and b have a common factor p, contradicting co-primality.",
            bookReference: "NCERT Class 10 Maths - Section 1.3",
            formulasOrRules: ["Rational + Irrational = Irrational", "Non-zero Rational × Irrational = Irrational"],
          },
        ],
      },
      {
        id: "ch-c10-m-2",
        chapterNumber: 2,
        title: "Polynomials",
        priority: "VVI",
        notesSummary: "Geometrical meaning of zeroes, relationship between zeroes and coefficients of quadratic and cubic polynomials.",
        bookChapterTitle: "NCERT Class 10 Maths Chapter 2: Polynomials",
        resourceLinks: [
          { title: "Quadratic Zeroes Cheat Sheet", type: "Quick CheatSheet", description: "Sum (α+β = -b/a) and Product (αβ = c/a) rules." },
          { title: "NCERT Textbook Chapter 2", type: "NCERT Book", description: "Complete polynomials exercises & graphs." },
        ],
        topics: [
          {
            id: "top-c10-m-2-1",
            name: "Relationship between Zeroes and Coefficients",
            keyConcepts: ["Quadratic Polynomials ax² + bx + c", "Sum of Zeroes α + β = -b/a", "Product of Zeroes αβ = c/a"],
            vviPoints: ["Finding polynomial given sum and product of zeroes: k[x² - (α+β)x + αβ]"],
            summaryNote: "For quadratic polynomial ax² + bx + c: Sum of zeroes = -coefficient of x / coefficient of x²; Product = constant term / coefficient of x².",
            bookReference: "NCERT Class 10 Maths - Section 2.2",
            formulasOrRules: ["α + β = -b/a", "αβ = c/a", "x² - (Sum)x + Product = 0"],
          },
          {
            id: "top-c10-m-2-2",
            name: "Geometrical Meaning of Zeroes",
            keyConcepts: ["Parabola opening upwards (a > 0) / downwards (a < 0)", "Number of zeroes = number of x-axis intersections"],
            vviPoints: ["Interpreting graphs of y = p(x) for number of zeroes"],
            summaryNote: "Zeroes of polynomial p(x) are the x-coordinates of the points where the graph y = p(x) intersects the x-axis.",
            bookReference: "NCERT Class 10 Maths - Section 2.1",
          },
        ],
      },
      {
        id: "ch-c10-m-3",
        chapterNumber: 3,
        title: "Pair of Linear Equations in Two Variables",
        priority: "Important",
        notesSummary: "Standard form ax + by + c = 0. Graphical consistency: intersecting, parallel, coincident lines. Algebraic methods: Substitution and Elimination.",
        bookChapterTitle: "NCERT Class 10 Maths Chapter 3: Pair of Linear Equations",
        resourceLinks: [
          { title: "Consistency Table & Formula", type: "Formula Sheet", description: "a1/a2 ≠ b1/b2 (Unique), a1/a2 = b1/b2 = c1/c2 (Infinite)." },
        ],
        topics: [
          {
            id: "top-c10-m-3-1",
            name: "Algebraic Methods of Solving",
            keyConcepts: ["Substitution Method", "Elimination Method", "Word problems on age, fraction, speed"],
            vviPoints: ["Elimination method is most efficient for speed-distance and upstream-downstream problems"],
            summaryNote: "Multiply equations by suitable constants to make coefficients of one variable equal, then add or subtract.",
            bookReference: "NCERT Section 3.3",
            formulasOrRules: ["Speed Upstream = u - v", "Speed Downstream = u + v"],
          },
          {
            id: "top-c10-m-3-2",
            name: "Conditions for Consistency",
            keyConcepts: ["Unique Solution (Intersecting)", "Infinitely Many Solutions (Coincident)", "No Solution (Parallel)"],
            vviPoints: ["Finding unknown parameter 'k' for no solution or infinite solutions"],
            summaryNote: "Consistent if a1/a2 ≠ b1/b2 or a1/a2 = b1/b2 = c1/c2. Inconsistent if a1/a2 = b1/b2 ≠ c1/c2.",
            bookReference: "NCERT Section 3.2",
            formulasOrRules: ["a1/a2 ≠ b1/b2 (Unique)", "a1/a2 = b1/b2 = c1/c2 (Infinite)", "a1/a2 = b1/b2 ≠ c1/c2 (No solution)"],
          },
        ],
      },
      {
        id: "ch-c10-m-4",
        chapterNumber: 4,
        title: "Quadratic Equations",
        priority: "VVI",
        notesSummary: "Standard form ax² + bx + c = 0 (a ≠ 0). Solution by factorisation and Quadratic Formula x = (-b ± √(b² - 4ac)) / 2a. Discriminant and nature of roots.",
        bookChapterTitle: "NCERT Class 10 Maths Chapter 4: Quadratic Equations",
        resourceLinks: [
          { title: "Discriminant & Nature of Roots Cheat Sheet", type: "Quick CheatSheet", description: "D > 0, D = 0, D < 0 conditions." },
        ],
        topics: [
          {
            id: "top-c10-m-4-1",
            name: "Quadratic Formula and Nature of Roots",
            keyConcepts: ["Discriminant D = b² - 4ac", "Two distinct real roots (D > 0)", "Two equal real roots (D = 0)", "No real roots (D < 0)"],
            vviPoints: ["Questions on finding k when roots are equal (D = 0) are asked every year"],
            summaryNote: "Roots given by x = (-b ± √D)/(2a). When D = 0, roots are rational and equal (-b/2a).",
            bookReference: "NCERT Section 4.4",
            formulasOrRules: ["D = b² - 4ac", "x = (-b ± √D) / (2a)"],
          },
        ],
      },
      {
        id: "ch-c10-m-5",
        chapterNumber: 5,
        title: "Arithmetic Progressions",
        priority: "Important",
        notesSummary: "General term an = a + (n-1)d. Sum of n terms Sn = n/2 [2a + (n-1)d] = n/2 [a + l]. Applications in daily life word problems.",
        bookChapterTitle: "NCERT Class 10 Maths Chapter 5: Arithmetic Progressions",
        resourceLinks: [
          { title: "AP Formulas & Series Summary", type: "Formula Sheet", description: "Formulas for nth term and sum of n terms." },
        ],
        topics: [
          {
            id: "top-c10-m-5-1",
            name: "nth Term and Sum of AP",
            keyConcepts: ["First term (a), common difference (d)", "General term an", "Sum of first n terms Sn"],
            vviPoints: ["Finding nth term from end: an = l - (n-1)d", "Relation an = Sn - S(n-1)"],
            summaryNote: "Common difference d can be positive, negative or zero. Sum of first n natural numbers = n(n+1)/2.",
            bookReference: "NCERT Section 5.2 - 5.3",
            formulasOrRules: ["an = a + (n - 1)d", "Sn = (n/2)[2a + (n - 1)d]", "Sn = (n/2)[a + l]"],
          },
        ],
      },
      {
        id: "ch-c10-m-6",
        chapterNumber: 6,
        title: "Triangles",
        priority: "VVI",
        notesSummary: "Basic Proportionality Theorem (Thales Theorem) and its converse. Criteria for similarity of triangles: AAA, SSS, SAS.",
        bookChapterTitle: "NCERT Class 10 Maths Chapter 6: Triangles",
        resourceLinks: [
          { title: "BPT Theorem Proof & Proof Diagram", type: "Mindmap", description: "Step-by-step theorem statement and derivation." },
        ],
        topics: [
          {
            id: "top-c10-m-6-1",
            name: "Basic Proportionality Theorem (BPT)",
            keyConcepts: ["Statement & Proof of BPT", "Converse of BPT", "Application in parallel lines"],
            vviPoints: ["Full theorem proof has 100% priority in CBSE Class 10 Board exam"],
            summaryNote: "If a line is drawn parallel to one side of a triangle to intersect the other two sides in distinct points, the other two sides are divided in the same ratio.",
            bookReference: "NCERT Section 6.2 - Theorem 6.1",
            formulasOrRules: ["AD/DB = AE/EC", "AD/AB = AE/AC"],
          },
          {
            id: "top-c10-m-6-2",
            name: "Criteria for Similarity of Triangles",
            keyConcepts: ["AAA (or AA) Similarity", "SSS Similarity", "SAS Similarity"],
            vviPoints: ["Ratio of corresponding sides in similar triangles"],
            summaryNote: "Two triangles are similar if their corresponding angles are equal and corresponding sides are in the same ratio.",
            bookReference: "NCERT Section 6.3",
          },
        ],
      },
      {
        id: "ch-c10-m-7",
        chapterNumber: 7,
        title: "Coordinate Geometry",
        priority: "Important",
        notesSummary: "Distance Formula d = √((x2-x1)² + (y2-y1)²). Section Formula for internal division [(mx2+nx1)/(m+n), (my2+ny1)/(m+n)]. Midpoint formula.",
        bookChapterTitle: "NCERT Class 10 Maths Chapter 7: Coordinate Geometry",
        resourceLinks: [
          { title: "Coordinate Formulas Sheet", type: "Formula Sheet", description: "Distance, Section, and Midpoint formulas." },
        ],
        topics: [
          {
            id: "top-c10-m-7-1",
            name: "Distance and Section Formula",
            keyConcepts: ["Distance between two points", "Section formula for internal division", "Centroid of a triangle"],
            vviPoints: ["Finding ratio k:1 in which y-axis or x-axis divides line segment"],
            summaryNote: "Distance from origin to (x, y) is √(x² + y²). Midpoint is ((x1+x2)/2, (y1+y2)/2).",
            bookReference: "NCERT Section 7.2 - 7.3",
            formulasOrRules: ["d = √[(x2 - x1)² + (y2 - y1)²]", "P(x,y) = ((mx2 + nx1)/(m+n), (my2 + ny1)/(m+n))"],
          },
        ],
      },
      {
        id: "ch-c10-m-8",
        chapterNumber: 8,
        title: "Introduction to Trigonometry & Applications",
        priority: "VVI",
        notesSummary: "Trigonometric ratios (sin, cos, tan, cosec, sec, cot). Specific angle values (0°, 30°, 45°, 60°, 90°). Fundamental identities: sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ. Heights and distances.",
        bookChapterTitle: "NCERT Class 10 Maths Chapter 8 & 9: Trigonometry",
        resourceLinks: [
          { title: "Trig Value Table & Hexagon Trick", type: "Formula Sheet", description: "Quick recall chart for 0°, 30°, 45°, 60°, 90°." },
          { title: "Height & Distance Elevation/Depression", type: "Mindmap", description: "Angle of elevation vs depression diagrams." },
        ],
        topics: [
          {
            id: "top-c10-m-8-1",
            name: "Trigonometric Identities",
            keyConcepts: ["sin²θ + cos²θ = 1", "1 + tan²θ = sec²θ", "1 + cot²θ = cosec²θ", "Algebraic proofs with LHS = RHS"],
            vviPoints: ["High weightage 4-mark proving questions in board exams"],
            summaryNote: "Convert complex trig terms into terms of sinθ and cosθ to simplify identities.",
            bookReference: "NCERT Section 8.4",
            formulasOrRules: ["sin²θ + cos²θ = 1", "sec²θ - tan²θ = 1", "cosec²θ - cot²θ = 1"],
          },
          {
            id: "top-c10-m-8-2",
            name: "Heights and Distances",
            keyConcepts: ["Line of sight", "Angle of elevation", "Angle of depression", "Applications with tan 30°, 45°, 60°"],
            vviPoints: ["Two-building or tower-river word problems"],
            summaryNote: "Construct right triangle: tan θ = Opposite / Adjacent. Angle of depression from top equals angle of elevation from bottom (alternate interior angles).",
            bookReference: "NCERT Chapter 9",
            formulasOrRules: ["tan 30° = 1/√3", "tan 45° = 1", "tan 60° = √3"],
          },
        ],
      },
      {
        id: "ch-c10-m-9",
        chapterNumber: 9,
        title: "Circles",
        priority: "VVI",
        notesSummary: "Tangent to a circle is perpendicular to the radius through point of contact. Lengths of tangents drawn from an external point to a circle are equal.",
        bookChapterTitle: "NCERT Class 10 Maths Chapter 10: Circles",
        resourceLinks: [
          { title: "Circle Theorems and Proofs", type: "Quick CheatSheet", description: "Theorem 10.1 & 10.2 complete derivations." },
        ],
        topics: [
          {
            id: "top-c10-m-9-1",
            name: "Tangents from an External Point",
            keyConcepts: ["Theorem 10.2 Proof: Tangents from external point are equal", "Perpendicularity of radius and tangent"],
            vviPoints: ["Proof of Theorem 10.2 and inscribed quadrilateral questions"],
            summaryNote: "If AP and AQ are tangents from point A to a circle with centre O, then AP = AQ and ∠OPA = ∠OQA = 90°.",
            bookReference: "NCERT Section 10.2",
            formulasOrRules: ["AP = AQ", "∠APB + ∠AOB = 180° for tangents AP and BP"],
          },
        ],
      },
      {
        id: "ch-c10-m-10",
        chapterNumber: 10,
        title: "Areas Related to Circles & Surface Areas & Volumes",
        priority: "Important",
        notesSummary: "Area of sector = (θ/360) × πr², Length of arc = (θ/360) × 2πr. Surface area and volume of combined solids (cylinders, cones, spheres, hemispheres).",
        bookChapterTitle: "NCERT Class 10 Maths Chapter 11 & 12",
        resourceLinks: [
          { title: "Mensuration 3D Formulas Poster", type: "Formula Sheet", description: "Volumes & Surface Areas of all 3D solids." },
        ],
        topics: [
          {
            id: "top-c10-m-10-1",
            name: "Areas of Sector and Segment",
            keyConcepts: ["Minor & Major Sector", "Area of Segment = Area of Sector - Area of Triangle"],
            vviPoints: ["Formula for segment when angle θ = 60°, 90°, 120°"],
            summaryNote: "Area of sector = (θ/360)πr². Area of triangle with angle θ between two radii = (1/2)r² sin θ.",
            bookReference: "NCERT Section 11.2",
            formulasOrRules: ["Area of Sector = (θ/360) × πr²", "Arc Length = (θ/360) × 2πr"],
          },
          {
            id: "top-c10-m-10-2",
            name: "Surface Areas and Volumes of Combinations",
            keyConcepts: ["Toy (cone + hemisphere)", "Capsule (cylinder + 2 hemispheres)", "Conversion of solid shapes"],
            vviPoints: ["Volume remains conserved during melting and recasting"],
            summaryNote: "Total Surface Area of combination = Sum of curved surface areas of exposed parts.",
            bookReference: "NCERT Section 12.1 - 12.2",
            formulasOrRules: ["Cone Vol = (1/3)πr²h, CSA = πrl (l = √(r²+h²))", "Sphere Vol = (4/3)πr³, TSA = 4πr²", "Hemisphere Vol = (2/3)πr³, TSA = 3πr², CSA = 2πr²"],
          },
        ],
      },
      {
        id: "ch-c10-m-11",
        chapterNumber: 11,
        title: "Statistics and Probability",
        priority: "VVI",
        notesSummary: "Mean of grouped data: Direct, Assumed Mean (a + Σfidi/Σfi). Mode = l + [(f1-f0)/(2f1-f0-f2)] × h. Median = l + [(n/2 - cf)/f] × h. Empirical formula: 3 Median = Mode + 2 Mean. Probability P(E) = favourable / total.",
        bookChapterTitle: "NCERT Class 10 Maths Chapter 13 & 14",
        resourceLinks: [
          { title: "Statistics Master Formula Table", type: "Formula Sheet", description: "Mean, Median, Mode grouped data formulas." },
        ],
        topics: [
          {
            id: "top-c10-m-11-1",
            name: "Measures of Central Tendency (Mean, Median, Mode)",
            keyConcepts: ["Assumed Mean Method", "Mode formula for grouped data", "Median using cumulative frequency (cf)"],
            vviPoints: ["Empirical relationship: 3 Median = Mode + 2 Mean", "Finding missing frequencies x and y given median"],
            summaryNote: "Modal class has highest frequency. Median class is where cumulative frequency exceeds n/2.",
            bookReference: "NCERT Section 13.2 - 13.4",
            formulasOrRules: [
              "Mean = a + (Σfi di / Σfi)",
              "Mode = l + [(f1 - f0) / (2f1 - f0 - f2)] × h",
              "Median = l + [(n/2 - cf) / f] × h",
              "3 Median = Mode + 2 Mean"
            ],
          },
          {
            id: "top-c10-m-11-2",
            name: "Classical Probability",
            keyConcepts: ["P(E) = Number of favorable outcomes / Total outcomes", "Complementary event P(not E) = 1 - P(E)", "Deck of 52 cards, dice, coin tosses"],
            vviPoints: ["P(E) is always between 0 and 1: 0 ≤ P(E) ≤ 1"],
            summaryNote: "Sure event probability = 1. Impossible event probability = 0. Deck of cards: 4 suits of 13 cards (26 Red, 26 Black, 12 Face Cards).",
            bookReference: "NCERT Section 14.1",
            formulasOrRules: ["0 ≤ P(E) ≤ 1", "P(E) + P(not E) = 1"],
          },
        ],
      },
    ],
  },
  {
    id: "sub-c10-sci",
    name: "Science",
    code: "SCI-086",
    stream: "General",
    classLevel: "Class 10",
    color: "emerald",
    iconName: "FlaskConical",
    chapters: [
      {
        id: "ch-c10-s-1",
        chapterNumber: 1,
        title: "Chemical Reactions and Equations",
        priority: "VVI",
        notesSummary: "Balancing equations based on law of conservation of mass. Types of reactions: combination, decomposition (thermal, electrolytic, photolytic), displacement, double displacement (precipitation), redox (oxidation & reduction). Corrosion & rancidity.",
        bookChapterTitle: "NCERT Class 10 Science Chapter 1",
        resourceLinks: [
          { title: "Reaction Types & Balancing Guide", type: "Mindmap", description: "Color changes, precipitate indicators." },
        ],
        topics: [
          {
            id: "top-c10-s-1-1",
            name: "Types of Chemical Reactions & Redox",
            keyConcepts: ["Combination & Decomposition", "Displacement & Reactivity Series", "Oxidation (Gain of O / Loss of e⁻)", "Reduction (Loss of O / Gain of e⁻)"],
            vviPoints: ["Decomposition of Ferrous Sulphate and Lead Nitrate (NO₂ brown fumes)"],
            summaryNote: "In redox: Substance that gains oxygen is oxidized; substance that loses oxygen is reduced. Oxidizing agent gives oxygen.",
            bookReference: "NCERT Section 1.2",
            formulasOrRules: ["2FeSO₄ (s) --Δ--> Fe₂O₃ (s) + SO₂ (g) + SO₃ (g)", "2Pb(NO₃)₂ --Δ--> 2PbO + 4NO₂ (brown) + O₂"],
          },
        ],
      },
      {
        id: "ch-c10-s-2",
        chapterNumber: 2,
        title: "Acids, Bases and Salts",
        priority: "VVI",
        notesSummary: "Indicators (litmus, phenolphthalein, methyl orange, olfactory). Reactions with metals, metal carbonates, bases. pH scale (0-14). Important salts: Bleaching powder, Baking soda, Washing soda, Plaster of Paris.",
        bookChapterTitle: "NCERT Class 10 Science Chapter 2",
        resourceLinks: [
          { title: "Salts & Formulas Cheat Sheet", type: "Quick CheatSheet", description: "Chemical names, formulas and preparation of 5 salts." },
        ],
        topics: [
          {
            id: "top-c10-s-2-1",
            name: "pH Scale and Important Chemical Salts",
            keyConcepts: ["pH = -log[H⁺]", "Chlor-alkali process (NaOH, Cl₂, H₂)", "Bleaching powder CaOCl₂", "Baking Soda NaHCO₃", "Plaster of Paris CaSO₄·½H₂O"],
            vviPoints: ["Water of crystallization in Gypsum vs POP (CaSO₄·2H₂O vs CaSO₄·½H₂O)"],
            summaryNote: "pH < 7 is acidic, pH = 7 is neutral, pH > 7 is basic. Tooth decay starts below pH 5.5.",
            bookReference: "NCERT Section 2.3 - 2.4",
            formulasOrRules: [
              "Bleaching Powder: Ca(OH)₂ + Cl₂ -> CaOCl₂ + H₂O",
              "Plaster of Paris: CaSO₄·2H₂O --373K--> CaSO₄·½H₂O + 1½H₂O"
            ],
          },
        ],
      },
      {
        id: "ch-c10-s-3",
        chapterNumber: 3,
        title: "Metals and Non-Metals",
        priority: "Important",
        notesSummary: "Physical & chemical properties, reactivity series, formation of ionic compounds (electron dot structures), metallurgy: roasting vs calcination, refining of metals, corrosion prevention.",
        bookChapterTitle: "NCERT Class 10 Science Chapter 3",
        resourceLinks: [
          { title: "Reactivity Series & Metallurgy Flowchart", type: "Mindmap", description: "Extraction of metals based on activity level." },
        ],
        topics: [
          {
            id: "top-c10-s-3-1",
            name: "Properties, Ionic Bonding & Metallurgy",
            keyConcepts: ["Ionic Bond Formation (NaCl, MgCl₂)", "Roasting (Sulphide ores in excess air)", "Calcination (Carbonate ores in limited air)", "Thermit process"],
            vviPoints: ["Electron dot structure of NaCl, MgO and properties of ionic compounds (high MP, conduct in molten state)"],
            summaryNote: "Metals lose valence electrons to form cations; non-metals gain electrons to form anions held by strong electrostatic force.",
            bookReference: "NCERT Section 3.2 - 3.4",
          },
        ],
      },
      {
        id: "ch-c10-s-4",
        chapterNumber: 4,
        title: "Carbon and its Compounds",
        priority: "VVI",
        notesSummary: "Covalent bonding, tetravalency & catenation. Saturated (alkanes) vs unsaturated (alkenes, alkynes). Functional groups: -OH, -CHO, >C=O, -COOH. Chemical reactions: combustion, oxidation, addition (hydrogenation), substitution. Soaps & detergents (micelle formation).",
        bookChapterTitle: "NCERT Class 10 Science Chapter 4",
        resourceLinks: [
          { title: "Carbon Reactions & Micelle Mindmap", type: "Mindmap", description: "Esterification, Saponification, Addition & Micelle structure." },
        ],
        topics: [
          {
            id: "top-c10-s-4-1",
            name: "Versatile Nature of Carbon & Functional Groups",
            keyConcepts: ["Catenation & Tetravalency", "Homologous Series", "IUPAC Nomenclature of alcohols, aldehydes, ketones, carboxylic acids"],
            vviPoints: ["General formulas: Alkanes (CnH2n+2), Alkenes (CnH2n), Alkynes (CnH2n-2)"],
            summaryNote: "Carbon forms covalent bonds by sharing electrons because C⁴⁺ and C⁴⁻ are energetically unfavorable.",
            bookReference: "NCERT Section 4.1 - 4.2",
          },
          {
            id: "top-c10-s-4-2",
            name: "Chemical Properties of Carbon Compounds & Soaps",
            keyConcepts: ["Esterification (Acid + Alcohol -> Ester)", "Saponification", "Hydrogenation of vegetable oils", "Micelle mechanism in cleansing"],
            vviPoints: ["Difference between soaps (fail in hard water due to scum) and detergents"],
            summaryNote: "Soap molecule has ionic hydrophilic head and non-polar hydrophobic hydrocarbon tail that traps oily dirt into micelles.",
            bookReference: "NCERT Section 4.3 - 4.5",
            formulasOrRules: ["CH₃COOH + C₂H₅OH --Acid--> CH₃COOC₂H₅ (Ester) + H₂O"],
          },
        ],
      },
      {
        id: "ch-c10-s-5",
        chapterNumber: 5,
        title: "Life Processes",
        priority: "VVI",
        notesSummary: "Nutrition: Autotrophic (photosynthesis, stomata) and Heterotrophic (amoeba, human digestive system). Respiration: aerobic vs anaerobic, human respiratory system. Transportation: human circulatory system (heart, double circulation), xylem & phloem. Excretion: Nephron structure & function, dialysis.",
        bookChapterTitle: "NCERT Class 10 Science Chapter 5",
        resourceLinks: [
          { title: "Human Heart & Nephron Diagrams", type: "Quick CheatSheet", description: "Labeled biological diagrams with blood flow pathways." },
        ],
        topics: [
          {
            id: "top-c10-s-5-1",
            name: "Human Nutrition and Respiration",
            keyConcepts: ["Digestive Enzymes (Pepsin, Trypsin, Lipase)", "Breakdown of glucose in cytoplasm to pyruvate", "Aerobic vs Anaerobic respiration pathways in yeast vs muscle cells"],
            vviPoints: ["Lactic acid build-up in muscles causing cramps during vigorous exercise"],
            summaryNote: "Aerobic respiration produces 38 ATP in mitochondria; anaerobic in yeast produces ethanol + CO₂ + 2 ATP; in muscles produces lactic acid + 2 ATP.",
            bookReference: "NCERT Section 5.1 - 5.2",
          },
          {
            id: "top-c10-s-5-2",
            name: "Transportation and Excretion in Humans",
            keyConcepts: ["Double Circulation in Human Heart", "Arteries vs Veins vs Capillaries", "Structure and Function of Nephron in Kidney"],
            vviPoints: ["Nephron filtration: Glomerulus, Bowman's capsule, selective reabsorption of glucose, amino acids, salts, water"],
            summaryNote: "Double circulation prevents mixing of oxygenated and deoxygenated blood, ensuring high energy efficiency for warm-blooded humans.",
            bookReference: "NCERT Section 5.3 - 5.4",
          },
        ],
      },
      {
        id: "ch-c10-s-6",
        chapterNumber: 6,
        title: "Control and Coordination & Reproduction",
        priority: "VVI",
        notesSummary: "Neuron structure, reflex arc, human brain parts (forebrain, midbrain, hindbrain). Plant hormones (Auxin, Gibberellin, Cytokinin, Abscisic acid). Asexual reproduction types. Sexual reproduction in plants (flower parts, pollination, fertilization) and humans (male/female reproductive organs, menstruation, contraception).",
        bookChapterTitle: "NCERT Class 10 Science Chapter 6 & 7",
        resourceLinks: [
          { title: "Brain & Reproductive System Mindmap", type: "Mindmap", description: "Hormones, reflexes, and plant tropisms." },
        ],
        topics: [
          {
            id: "top-c10-s-6-1",
            name: "Nervous System, Reflex Arc & Plant Hormones",
            keyConcepts: ["Neuron: Dendrite, Cyton, Axon, Synapse", "Reflex Arc Pathway", "Plant Tropisms (Phototropism, Geotropism, Hydrotropism)"],
            vviPoints: ["Auxin causes stem bending towards light by accumulating on shaded side"],
            summaryNote: "Reflex arc: Receptor -> Sensory neuron -> Spinal cord (Relay neuron) -> Motor neuron -> Effector muscle.",
            bookReference: "NCERT Chapter 6",
          },
          {
            id: "top-c10-s-6-2",
            name: "Sexual Reproduction in Plants and Humans",
            keyConcepts: ["Flower Anatomy (Stamen, Carpel)", "Double Fertilization in Angiosperms", "Human Reproductive Cycles", "Contraceptive Methods (Barrier, Chemical, Surgical)"],
            vviPoints: ["Surgical contraception (Vasectomy in males, Tubectomy in females)"],
            summaryNote: "Pollen tube delivers male gametes to ovary: one fuses with egg (syngamy -> zygote), other with secondary nucleus (triple fusion -> endosperm).",
            bookReference: "NCERT Chapter 7",
          },
        ],
      },
      {
        id: "ch-c10-s-7",
        chapterNumber: 7,
        title: "Light - Reflection and Refraction",
        priority: "VVI",
        notesSummary: "Spherical mirrors (concave, convex), mirror formula 1/f = 1/v + 1/u, magnification m = -v/u. Refraction, Snell's law (sin i / sin r = n), lens formula 1/f = 1/v - 1/u, magnification m = v/u, power of lens P = 1/f(in meters) in Dioptres.",
        bookChapterTitle: "NCERT Class 10 Science Chapter 9",
        resourceLinks: [
          { title: "Ray Diagrams & Sign Convention Summary", type: "Quick CheatSheet", description: "Cartesian sign convention & ray diagram rules." },
        ],
        topics: [
          {
            id: "top-c10-s-7-1",
            name: "Spherical Mirrors and Lenses Ray Diagrams",
            keyConcepts: ["Concave & Convex Mirror Cases", "Convex & Concave Lens Cases", "New Cartesian Sign Convention"],
            vviPoints: ["Virtual, erect and magnified image in concave mirror (when object between P and F) and convex lens (between F and O)"],
            summaryNote: "Distances in direction of incident light are positive; opposite are negative. Focal length of concave is negative; convex is positive.",
            bookReference: "NCERT Section 9.2 - 9.3",
            formulasOrRules: [
              "Mirror: 1/f = 1/v + 1/u, m = -v/u = h'/h",
              "Lens: 1/f = 1/v - 1/u, m = v/u = h'/h",
              "Power: P = 1 / f (in metres), Unit: Dioptre (D)"
            ],
          },
        ],
      },
      {
        id: "ch-c10-s-8",
        chapterNumber: 8,
        title: "The Human Eye and Colourful World",
        priority: "Important",
        notesSummary: "Structure of human eye, power of accommodation. Defects of vision: Myopia (corrected by concave lens), Hypermetropia (corrected by convex lens), Presbyopia (bifocal lens). Refraction through prism, dispersion, atmospheric refraction (twinkling of stars), scattering (Tyndall effect, blue sky, red sunset).",
        bookChapterTitle: "NCERT Class 10 Science Chapter 10",
        resourceLinks: [
          { title: "Eye Defects & Optical Phenomena Cheat Sheet", type: "Mindmap", description: "Causes & ray diagrams for Myopia and Hypermetropia." },
        ],
        topics: [
          {
            id: "top-c10-s-8-1",
            name: "Defects of Vision and Natural Phenomena",
            keyConcepts: ["Myopia (Near-sightedness, elongated eyeball)", "Hypermetropia (Far-sightedness)", "Atmospheric Refraction (Twinkling of stars, Advanced sunrise by 2 mins)", "Rayleigh Scattering (I ∝ 1/λ⁴)"],
            vviPoints: ["Calculation of focal length and power of corrective lens for myopic/hypermetropic eye"],
            summaryNote: "In myopia, image forms in front of retina; concave lens diverges rays to focus on retina. Red light scatters least due to longer wavelength.",
            bookReference: "NCERT Section 10.2 - 10.6",
          },
        ],
      },
      {
        id: "ch-c10-s-9",
        chapterNumber: 9,
        title: "Electricity and Magnetic Effects of Current",
        priority: "VVI",
        notesSummary: "Electric current I = Q/t. Potential difference V = W/Q. Ohm's Law V = IR. Resistance factors R = ρ(l/A). Series (Rs = R1+R2) vs Parallel (1/Rp = 1/R1+1/R2). Joule's Heating H = I²Rt. Power P = VI = I²R = V²/R. Magnetic field lines, Right Hand Thumb Rule, Solenoid, Fleming's Left Hand Rule, Domestic electric circuit (Live, Neutral, Earth wire, Fuse).",
        bookChapterTitle: "NCERT Class 10 Science Chapter 11 & 12",
        resourceLinks: [
          { title: "Circuits & Electromagnetism Cheat Sheet", type: "Formula Sheet", description: "Ohm's law, series/parallel equivalent resistance, Fleming's rules." },
        ],
        topics: [
          {
            id: "top-c10-s-9-1",
            name: "Ohm's Law, Resistor Combinations and Electric Power",
            keyConcepts: ["Resistivity ρ", "Equivalent resistance in series & parallel circuits", "Commercial unit of energy 1 kWh = 3.6 × 10⁶ J"],
            vviPoints: ["Numericals calculating power consumption and electricity bill calculations"],
            summaryNote: "In series, current is constant; in parallel, voltage is constant. Parallel connection prevents entire circuit failure if one appliance fails.",
            bookReference: "NCERT Section 11.3 - 11.7",
            formulasOrRules: [
              "V = IR",
              "R = ρ(l / A)",
              "H = I²Rt",
              "P = VI = I²R = V²/R",
              "1 kWh = 3.6 × 10⁶ Joules"
            ],
          },
          {
            id: "top-c10-s-9-2",
            name: "Magnetic Effects of Electric Current & Domestic Circuits",
            keyConcepts: ["Magnetic field of Solenoid", "Fleming's Left-Hand Rule (Force, Field, Current)", "Earthing & Safety Fuse in Domestic Circuits"],
            vviPoints: ["Difference between short circuit (zero resistance) and overloading"],
            summaryNote: "Earth wire (green insulation) provides low resistance path for leakage current to prevent electric shocks.",
            bookReference: "NCERT Chapter 12",
          },
        ],
      },
      {
        id: "ch-c10-s-10",
        chapterNumber: 10,
        title: "Our Environment",
        priority: "Normal",
        notesSummary: "Ecosystem components (biotic & abiotic), food chain and food web. 10% law of energy transfer (Lindeman's Law). Biological biomagnification. Ozone layer depletion by CFCs and waste management.",
        bookChapterTitle: "NCERT Class 10 Science Chapter 13",
        resourceLinks: [
          { title: "Ecosystem & Trophic Levels Mindmap", type: "Mindmap", description: "Energy flow and biomagnification pyramid." },
        ],
        topics: [
          {
            id: "top-c10-s-10-1",
            name: "Energy Flow, 10% Law & Biomagnification",
            keyConcepts: ["10% Energy Law", "Biological Magnification (accumulation of non-biodegradable pesticides)", "Ozone formation: O₂ + O -> O₃ by UV radiation"],
            vviPoints: ["Unidirectional flow of energy in an ecosystem"],
            summaryNote: "Only 10% of energy is transferred to next trophic level; 90% lost as metabolic heat. Top carnivores have highest pesticide concentration.",
            bookReference: "NCERT Section 13.1 - 13.2",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c10-sst",
    name: "Social Science",
    code: "SST-087",
    stream: "General",
    classLevel: "Class 10",
    color: "amber",
    iconName: "Globe2",
    chapters: [
      {
        id: "ch-c10-sst-1",
        chapterNumber: 1,
        title: "The Rise of Nationalism in Europe & Nationalism in India",
        priority: "VVI",
        notesSummary: "Frederic Sorrieu vision, French Revolution, Napoleonic Code 1804, Italian (Mazzini, Garibaldi, Cavour) & German (Bismarck) unification. India: Rowlatt Act, Jallianwala Bagh, Khilafat & Non-Cooperation, Civil Disobedience Movement, Salt March, Poona Pact.",
        bookChapterTitle: "NCERT Class 10 History Chapter 1 & 2",
        resourceLinks: [
          { title: "Nationalism Timeline & Map Work", type: "Mindmap", description: "Important Congress sessions (Nagpur, Lahore) & satyagraha centers." },
        ],
        topics: [
          {
            id: "top-c10-sst-1-1",
            name: "Nationalism in India (Non-Cooperation to Civil Disobedience)",
            keyConcepts: ["Rowlatt Satyagraha 1919", "Non-Cooperation Movement 1920-22 & Chauri Chaura", "Dandi Salt March 1930", "Gandhi-Irwin Pact & Poona Pact 1932"],
            vviPoints: ["Comparison between Non-Cooperation (refusing cooperation) and Civil Disobedience (breaking colonial laws)"],
            summaryNote: "Gandhiji launched Salt March on 12 March 1930 with 78 volunteers, reaching Dandi on 6 April to break salt law, sparking mass civil disobedience.",
            bookReference: "NCERT History Chapter 2",
          },
        ],
      },
      {
        id: "ch-c10-sst-2",
        chapterNumber: 2,
        title: "Resources, Agriculture & Manufacturing Industries",
        priority: "Important",
        notesSummary: "Resource classification, soil types (Alluvial, Black, Red, Laterite, Arid). Agriculture: Kharif, Rabi, Zaid seasons. Food crops (Rice, Wheat) & Cash crops (Cotton, Jute, Tea, Coffee). Manufacturing: Agglomeration economies, Textile, Iron & Steel, Information Technology.",
        bookChapterTitle: "NCERT Class 10 Geography Chapter 1, 4 & 6",
        resourceLinks: [
          { title: "Indian Soils & Cropping Seasons Map", type: "Quick CheatSheet", description: "Rainfall, temperature, and soil requirements for major crops." },
        ],
        topics: [
          {
            id: "top-c10-sst-2-1",
            name: "Indian Soils and Major Agricultural Crops",
            keyConcepts: ["Black Soil (Regur / Cotton Soil in Deccan Trap)", "Alluvial Soil (Khadar vs Bhangar)", "Rabi (Wheat, Gram) vs Kharif (Rice, Maize, Cotton) seasons"],
            vviPoints: ["Geographical conditions required for Rice (High temp > 25°C, high rainfall > 100cm) vs Wheat (Cool growing season, 50-75cm rainfall)"],
            summaryNote: "Agriculture provides livelihood to over 50% workforce. Modern industrialization depends on agro-based and mineral-based raw materials.",
            bookReference: "NCERT Geography Chapter 1 & 4",
          },
        ],
      },
      {
        id: "ch-c10-sst-3",
        chapterNumber: 3,
        title: "Power Sharing and Federalism",
        priority: "VVI",
        notesSummary: "Ethnic composition of Belgium (Dutch 59%, French 40%) vs Sri Lanka (Sinhala 74%, Tamil 18%). Majoritarianism vs Power Sharing. Features of Indian Federalism: Union List, State List, Concurrent List, Residuary powers. 73rd/74th Constitutional Amendments (1992 Decentralization).",
        bookChapterTitle: "NCERT Class 10 Democratic Politics Chapter 1 & 2",
        resourceLinks: [
          { title: "Power Sharing Forms & 3 Lists Sheet", type: "Mindmap", description: "Horizontal vs Vertical division of power." },
        ],
        topics: [
          {
            id: "top-c10-sst-3-1",
            name: "Forms of Power Sharing and Federal Decentralization",
            keyConcepts: ["Horizontal power sharing (Legislature, Executive, Judiciary)", "Vertical power sharing (Central, State, Local Govt)", "Union, State, Concurrent Lists", "Panchayati Raj 1992"],
            vviPoints: ["Why power sharing is desirable: Prudential reasons (reduces conflict) vs Moral reasons (essence of democracy)"],
            summaryNote: "Federalism shares sovereignty: India is 'Holding Together' federation with strong center and special provisions for states.",
            bookReference: "NCERT Democratic Politics Chapter 1 & 2",
          },
        ],
      },
      {
        id: "ch-c10-sst-4",
        chapterNumber: 4,
        title: "Development and Sectors of the Indian Economy",
        priority: "Important",
        notesSummary: "Income vs Non-income goals. HDI by UNDP (Per Capita Income, Life Expectancy, Literacy). Primary, Secondary, Tertiary sectors. Rising importance of tertiary sector. Disguised unemployment in agriculture. Organized vs Unorganized sectors. Public vs Private sectors. Money and Credit (Formal vs Informal credit sources, SHGs).",
        bookChapterTitle: "NCERT Class 10 Economics Chapter 1, 2 & 3",
        resourceLinks: [
          { title: "Economic Sectors & Credit System Summary", type: "Quick CheatSheet", description: "Formal vs Informal credit and GDP contribution." },
        ],
        topics: [
          {
            id: "top-c10-sst-4-1",
            name: "Sectors of Economy & Money and Credit",
            keyConcepts: ["Primary, Secondary, Tertiary Sectors", "Disguised Unemployment in Agriculture", "Formal (Banks, Cooperatives) vs Informal (Moneylenders) Credit", "Self Help Groups (SHGs)"],
            vviPoints: ["RBI supervises formal sector loans to ensure lending to small borrowers at reasonable interest rates"],
            summaryNote: "Tertiary sector has become largest producing sector in India, yet primary sector remains largest employer due to underemployment.",
            bookReference: "NCERT Economics Chapter 2 & 3",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c10-eng",
    name: "English Language & Lit",
    code: "ENG-184",
    stream: "General",
    classLevel: "Class 10",
    color: "cyan",
    iconName: "BookOpen",
    chapters: [
      {
        id: "ch-c10-e-1",
        chapterNumber: 1,
        title: "First Flight: Prose & Poetry Highlights",
        priority: "VVI",
        notesSummary: "A Letter to God (Lencho's supreme faith), Nelson Mandela: Long Walk to Freedom, Two Stories about Flying, From the Diary of Anne Frank, Madam Rides the Bus, The Proposal (Anton Chekhov farce). Poems: Dust of Snow, Fire and Ice, A Tiger in the Zoo, The Ball Poem, Fog, For Anne Gregory.",
        bookChapterTitle: "NCERT Class 10 English First Flight",
        resourceLinks: [
          { title: "Poetic Devices & Theme Summary", type: "Quick CheatSheet", description: "Metaphor, Alliteration, Oxymoron, Personification." },
        ],
        topics: [
          {
            id: "top-c10-e-1-1",
            name: "Key Themes, Characters and Poetic Devices",
            keyConcepts: ["Irony in 'A Letter to God'", "Mandela's concept of freedom and courage", "Symbolism in 'Fire and Ice' and 'The Ball Poem'"],
            vviPoints: ["Theme of loss and growing up in 'The Ball Poem'"],
            summaryNote: "Lencho's blind faith turns ironic when he suspects the benevolent post office employees of stealing money. Mandela reveals that true courage is triumph over fear.",
            bookReference: "NCERT First Flight Chapter 1-6",
          },
        ],
      },
      {
        id: "ch-c10-e-2",
        chapterNumber: 2,
        title: "Footprints without Feet & Advanced Writing Skills",
        priority: "Important",
        notesSummary: "A Triumph of Surgery (Tricki), The Thief's Story (Hari Singh & Anil), The Midnight Visitor (Ausable spy trick), Footprints without Feet (Griffin scientist), The Necklace (Mathilde Loisel). Writing: Formal Letters (Editor, Placing Order, Complaint) and Analytical Paragraph (Chart/Graph interpretation).",
        bookChapterTitle: "NCERT Footprints without Feet & Grammar",
        resourceLinks: [
          { title: "Formal Letter & Analytical Paragraph Formats", type: "Formula Sheet", description: "CBSE official marking schemes & standard templates." },
        ],
        topics: [
          {
            id: "top-c10-e-2-1",
            name: "Analytical Paragraph Writing & Letter Formats",
            keyConcepts: ["Format of Letter to the Editor", "Structure of Analytical Paragraph (Intro, Overview, Comparison, Conclusion)", "Grammar: Tenses, Modals, Subject-Verb Concord, Reported Speech"],
            vviPoints: ["Full format marks: Sender's address, Date, Receiver's designation, Subject, Salutation, Body in 3 paragraphs, Subscription"],
            summaryNote: "Analytical paragraph requires objective comparison of trends, highest/lowest data points, and concise synthesis without personal opinion.",
            bookReference: "CBSE Class 10 English Writing Section",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c10-hin",
    name: "Hindi Course (A & B)",
    code: "HIN-002",
    stream: "General",
    classLevel: "Class 10",
    color: "purple",
    iconName: "Languages",
    chapters: [
      {
        id: "ch-c10-h-1",
        chapterNumber: 1,
        title: "क्षितिज भाग-2 एवं कृतिका: गद्य व पद्य सार",
        priority: "VVI",
        notesSummary: "सूरदास के पद (गोपियों का विरह व भ्रमरगीत), तुलसीदास (राम-लक्ष्मण-परशुराम संवाद), जयशंकर प्रसाद (आत्मकथ्य), सूर्यकांत त्रिपाठी 'निराला' (उत्साह, अट नहीं रही है). गद्य: नेताजी का चश्मा (स्वयं प्रकाश), बालगोबिन भगत (रामवृक्ष बेनीपुरी), लखनवी अंदाज़ (यशपाल), मानवीय करुणा की दिव्य चमक (सर्वेश्वर दयाल सक्सेना). कृतिका: माता का आँचल, साना-साना हाथ जोड़ि.",
        bookChapterTitle: "NCERT क्षितिज भाग 2 एवं कृतिका",
        resourceLinks: [
          { title: "काव्य रस एवं पद-परिचय चार्ट", type: "Quick CheatSheet", description: "श्रृंगार, वीर, करुण, रौद्र रस के स्थायी भाव व उदाहरण।" },
        ],
        topics: [
          {
            id: "top-c10-h-1-1",
            name: "काव्य खंड, गद्य पाठ एवं मुख्य चरित्र-चित्रण",
            keyConcepts: ["गोपियों का वाक्चातुर्य", "परशुराम का क्रोध व लक्ष्मण का व्यंग्य", "कैप्टन चश्मेवाले की देशभक्ति", "बालगोबिन भगत का कबीर पंथ"],
            vviPoints: ["राम-लक्ष्मण-परशुराम संवाद में चौपाई व दोहा छंद तथा वीर व रौद्र रस का सुंदर प्रयोग"],
            summaryNote: "नेताजी का चश्मा पाठ यह संदेश देता है कि देश केवल सीमाओं से नहीं बल्कि नागरिकों के समर्पण व देशभक्ति से बनता है।",
            bookReference: "NCERT क्षितिज भाग 2",
          },
        ],
      },
      {
        id: "ch-c10-h-2",
        chapterNumber: 2,
        title: "हिंदी व्याकरण एवं रचनात्मक लेखन",
        priority: "Important",
        notesSummary: "रचना के आधार पर वाक्य भेद (सरल, संयुक्त, मिश्र), वाच्य (कर्तृवाच्य, कर्मवाच्य, भाववाच्य), पद-परिचय (संज्ञा, सर्वनाम, विशेषण, क्रिया, अव्यय), रस (स्थायी भाव, विभाव, अनुभाव, संचारी भाव). लेखन: अनुच्छेद, औपचारिक/अनौपचारिक पत्र, स्ववृत्त लेखन (Bio-data), विज्ञापन लेखन, संदेश लेखन.",
        bookChapterTitle: "CBSE कक्षा 10 हिंदी व्याकरण",
        resourceLinks: [
          { title: "वाक्य परिवर्तन एवं वाच्य नियम तालिका", type: "Formula Sheet", description: "संयुक्त से मिश्र एवं कर्तृवाच्य से कर्मवाच्य रूपांतरण नियम।" },
        ],
        topics: [
          {
            id: "top-c10-h-2-1",
            name: "वाक्य भेद, वाच्य, पद-परिचय एवं पत्र लेखन",
            keyConcepts: ["मिश्र वाक्य में प्रधान व आश्रित उपवाक्य", "भाववाच्य में अकर्मक क्रिया का प्रयोग", "विज्ञापन लेखन में आकर्षक शीर्षक व संपर्क सूत्र"],
            vviPoints: ["पद-परिचय में रेखांकित शब्द का व्याकरणिक भेद, लिंग, वचन, कारक एवं संबंध लिखना अनिवार्य है"],
            summaryNote: "सरल वाक्य में एक उद्देश्य व एक विधेय होता है। संयुक्त में समानाधिकरण समुच्चयबोधक (और, परन्तु, इसलिए) तथा मिश्र में व्याधिकरण (जो, क्योंकि, जब-तब) प्रयुक्त होते हैं।",
            bookReference: "CBSE कक्षा 10 व्याकरण",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c10-san",
    name: "Sanskrit",
    code: "SAN-122",
    stream: "General",
    classLevel: "Class 10",
    color: "rose",
    iconName: "BookMarked",
    chapters: [
      {
        id: "ch-c10-san-1",
        chapterNumber: 1,
        title: "शेमुषी भाग-2: पाठ सार एवं श्लोकान्वय",
        priority: "VVI",
        notesSummary: "शुचिपर्यावरणम् (पर्यावरण शुद्धता), बुद्धिर्बलवती सदा (बुद्धि चातुर्य), जननी तुल्यवत्सला (मातृ स्नेह), सुभाषितानि (सद्गुण महिमा), सौहार्दं प्रकृतेः शोभा, विचित्रः साक्षी, सूक्तयः. श्लोकार्थ, अन्वय एवं भावार्थ.",
        bookChapterTitle: "NCERT शेमुषी भाग 2",
        resourceLinks: [
          { title: "श्लोकान्वय एवं शब्दार्थ संकलन", type: "Quick CheatSheet", description: "महत्वपूर्ण श्लोकों के अन्वय एवं परीक्षा उपयोगी प्रश्न।" },
        ],
        topics: [
          {
            id: "top-c10-san-1-1",
            name: "महत्वपूर्ण पाठ एवं श्लोकान्वय विधि",
            keyConcepts: ["शुचिपर्यावरणम् श्लोकार्थ", "बुद्धिर्बलवती सदा कथासार", "अन्वय लेखनस्य नियमाः"],
            vviPoints: ["श्लोक का अन्वय करते समय कर्ता-कर्म-क्रिया का क्रमिक विन्यास आवश्यक है"],
            summaryNote: "सुभाषितानि पाठ में आलस्य को मनुष्य का सबसे बड़ा शत्रु तथा उद्यम को सबसे बड़ा मित्र बताया गया है।",
            bookReference: "NCERT शेमुषी भाग 2",
          },
        ],
      },
      {
        id: "ch-c10-san-2",
        chapterNumber: 2,
        title: "संस्कृत व्याकरणम् एवं रचनात्मक कार्यम्",
        priority: "Important",
        notesSummary: "संधि (व्यंजन व विसर्ग), समास (तत्पुरुष, बहुव्रीहि, द्वन्द्व, अव्ययीभाव), प्रत्यय (मतुप्, तल्, त्व, टाप्, ङीप्), वाच्य परिवर्तन (लट् लकार), समय लेखनम्, अव्यय पदानि, अशुद्धि संशोधनम्, चित्रवर्णनम् एवं पत्रलेखनम्.",
        bookChapterTitle: "CBSE संस्कृत व्याकरण सौरभम्",
        resourceLinks: [
          { title: "संस्कृत प्रत्यय एवं समास सूत्र तालिका", type: "Formula Sheet", description: "प्रत्यय एवं समय लेखन के नियम (सपाद, सार्ध, पादोन)।" },
        ],
        topics: [
          {
            id: "top-c10-san-2-1",
            name: "संधि, प्रत्यय, समय एवं चित्रवर्णनम्",
            keyConcepts: ["विसर्ग संधि (उत्व, रत्व, लोप)", "समय लेखनम् (सपाद, सार्ध, पादोन)", "चित्रवर्णन में ५ शुद्ध संस्कृत वाक्य ರಚना"],
            vviPoints: ["चित्रवर्णन में मञ्जूषा के शब्दों का प्रयोग करते हुए प्रथमा/द्वितीया विभक्ति में शुद्ध वाक्य बनाएँ"],
            summaryNote: "सपाद = सवा (15 mins past), सार्ध = साढ़े (30 mins past), पादोन = पौने (15 mins to).",
            bookReference: "CBSE संस्कृत व्याकरण",
          },
        ],
      },
    ],
  },
];

// -----------------------------------------------------------------------
// 2. CLASS 11 SCIENCE CURRICULUM
// -----------------------------------------------------------------------

export const CLASS11_SCIENCE_CURRICULUM: CurriculumSubject[] = [
  {
    id: "sub-c11-sci-phy",
    name: "Physics",
    code: "PHY-042",
    stream: "Science",
    classLevel: "Class 11",
    color: "cyan",
    iconName: "Zap",
    chapters: [
      {
        id: "ch-c11-phy-1",
        chapterNumber: 1,
        title: "Units and Measurements",
        priority: "Important",
        notesSummary: "SI base units, dimensional analysis, checking dimensional consistency of equations, derivation of formulas using dimensions, significant figures, and error propagation.",
        bookChapterTitle: "NCERT Class 11 Physics Chapter 1: Units and Measurements",
        resourceLinks: [
          { title: "Dimensional Formula Table", type: "Formula Sheet", description: "Dimensions of 50+ standard physical quantities." },
          { title: "Error Analysis Guide", type: "Quick CheatSheet", description: "Relative & percentage error addition rules." },
        ],
        topics: [
          {
            id: "top-c11-p-1-1",
            name: "Dimensional Analysis and Applications",
            keyConcepts: ["Principle of Homogeneity", "Converting units between systems", "Deducing relations among physical quantities"],
            vviPoints: ["Limitations of dimensional analysis (cannot determine dimensionless constants)"],
            summaryNote: "An equation is dimensionally correct if all terms on LHS and RHS have identical dimensions [M^a L^b T^c].",
            bookReference: "NCERT Section 1.5",
            formulasOrRules: ["Force [M L T⁻²]", "Work / Energy [M L² T⁻²]", "Power [M L² T⁻³]"],
          },
        ],
      },
      {
        id: "ch-c11-phy-2",
        chapterNumber: 2,
        title: "Motion in a Straight Line & Plane",
        priority: "VVI",
        notesSummary: "Kinematic equations v = u + at, s = ut + ½at², v² = u² + 2as. Vectors: dot product and cross product. Projectile motion: Time of flight T = 2u sinθ/g, Max height H = u²sin²θ/2g, Horizontal range R = u²sin2θ/g. Uniform circular motion.",
        bookChapterTitle: "NCERT Class 11 Physics Chapter 2 & 3",
        resourceLinks: [
          { title: "Projectile Trajectory & Vector Formulas", type: "Formula Sheet", description: "Formulas for time of flight, range, maximum height." },
        ],
        topics: [
          {
            id: "top-c11-p-2-1",
            name: "Projectile Motion and Kinematics",
            keyConcepts: ["Trajectory equation (parabola)", "Independence of horizontal and vertical motions", "Centripetal acceleration a = v²/r"],
            vviPoints: ["Range is maximum at angle θ = 45° where R_max = u²/g", "Two complementary angles (θ and 90°-θ) give same range"],
            summaryNote: "Horizontal velocity remains constant (ux = u cos θ); vertical velocity is governed by gravity (uy = u sin θ - gt).",
            bookReference: "NCERT Section 3.4",
            formulasOrRules: [
              "T = (2u sin θ) / g",
              "H = (u² sin² θ) / (2g)",
              "R = (u² sin 2θ) / g"
            ],
          },
        ],
      },
      {
        id: "ch-c11-phy-3",
        chapterNumber: 3,
        title: "Laws of Motion & Work, Energy and Power",
        priority: "VVI",
        notesSummary: "Newton's three laws, momentum conservation, static and kinetic friction (f_s ≤ μ_s N), banking of roads. Work-Energy Theorem W = ΔK. Conservative vs non-conservative forces. Elastic and inelastic collisions in 1D and 2D.",
        bookChapterTitle: "NCERT Class 11 Physics Chapter 4 & 5",
        resourceLinks: [
          { title: "Friction & Work-Energy Mindmap", type: "Mindmap", description: "Free body diagrams (FBD) and energy conservation." },
        ],
        topics: [
          {
            id: "top-c11-p-3-1",
            name: "Work-Energy Theorem and Collisions",
            keyConcepts: ["Work done by variable force W = ∫F dx", "Conservation of mechanical energy", "Coefficient of restitution (e) in 1D collision"],
            vviPoints: ["In perfectly elastic collision, both momentum and kinetic energy are conserved (e = 1)"],
            summaryNote: "Total work done by all forces (conservative, non-conservative, external) on a particle equals the change in its kinetic energy.",
            bookReference: "NCERT Section 5.3 - 5.7",
            formulasOrRules: ["W_net = ΔK = ½mv² - ½mu²", "F_friction = μ N", "v_max on banked road = √[rg(tan θ + μ) / (1 - μ tan θ)]"],
          },
        ],
      },
      {
        id: "ch-c11-phy-4",
        chapterNumber: 4,
        title: "Thermodynamics and Kinetic Theory",
        priority: "Important",
        notesSummary: "Zeroth law (concept of temperature), First law of thermodynamics ΔQ = ΔU + ΔW, isothermal and adiabatic processes (PV^γ = const), heat engines and Carnot cycle efficiency η = 1 - T2/T1. Kinetic theory: Pressure of ideal gas P = ⅓ρv_rms², equipartition of energy.",
        bookChapterTitle: "NCERT Class 11 Physics Chapter 11 & 12",
        resourceLinks: [
          { title: "Thermodynamic Processes & Carnot Cycle", type: "Formula Sheet", description: "Work done in Isothermal (nRT ln(V2/V1)) vs Adiabatic." },
        ],
        topics: [
          {
            id: "top-c11-p-4-1",
            name: "First Law of Thermodynamics & Carnot Engine",
            keyConcepts: ["Internal Energy U", "Isothermal (ΔT = 0) vs Adiabatic (ΔQ = 0)", "Carnot efficiency η = 1 - T_cold / T_hot"],
            vviPoints: ["Adiabatic gas relation: PV^γ = constant where γ = Cp / Cv"],
            summaryNote: "First Law is the law of conservation of energy applied to thermodynamic systems: Heat supplied = Increase in internal energy + Work done.",
            bookReference: "NCERT Section 11.4 - 11.8",
            formulasOrRules: ["ΔQ = ΔU + ΔW", "W_isothermal = nRT ln(V2/V1)", "W_adiabatic = (P1V1 - P2V2)/(γ - 1)"],
          },
        ],
      },
    ],
  },
  {
    id: "sub-c11-sci-chem",
    name: "Chemistry",
    code: "CHEM-043",
    stream: "Science",
    classLevel: "Class 11",
    color: "emerald",
    iconName: "Atom",
    chapters: [
      {
        id: "ch-c11-ch-1",
        chapterNumber: 1,
        title: "Some Basic Concepts of Chemistry & Structure of Atom",
        priority: "VVI",
        notesSummary: "Mole concept, molar mass, empirical & molecular formulas, limiting reagent, molarity (M) and molality (m). Bohr's model of atom, de Broglie relation λ = h/mv, Heisenberg uncertainty principle Δx·Δp ≥ h/4π, quantum numbers (n, l, m, s), Aufbau principle, Pauli exclusion principle, Hund's rule.",
        bookChapterTitle: "NCERT Class 11 Chemistry Chapter 1 & 2",
        resourceLinks: [
          { title: "Quantum Numbers & Mole Concept Guide", type: "Formula Sheet", description: "Formulas for molarity, molality, and electronic configuration." },
        ],
        topics: [
          {
            id: "top-c11-c-1-1",
            name: "Mole Concept, Stoichiometry & Quantum Numbers",
            keyConcepts: ["Mole = Mass / Molar Mass = Particles / 6.022×10²³", "Limiting Reagent identification", "Four Quantum Numbers (n, l, m_l, m_s)"],
            vviPoints: ["Number of radial nodes = n - l - 1; angular nodes = l; total nodes = n - 1"],
            summaryNote: "Limiting reagent is completely consumed in a reaction and dictates the maximum product yield. Electronic configuration follows Aufbau (lowest energy first).",
            bookReference: "NCERT Chemistry Chapter 1 & 2",
            formulasOrRules: ["λ = h / (mv)", "Δx · Δp ≥ h / (4π)", "Molarity M = (Moles of solute) / (Volume of solution in L)"],
          },
        ],
      },
      {
        id: "ch-c11-ch-2",
        chapterNumber: 2,
        title: "Chemical Bonding and Molecular Structure",
        priority: "VVI",
        notesSummary: "Octet rule & exceptions, ionic vs covalent bonding, dipole moment, VSEPR theory (shapes of molecules: linear, trigonal planar, tetrahedral, trigonal bipyramidal, octahedral), Valence Bond Theory, Hybridization (sp, sp², sp³, sp³d, sp³d²), Molecular Orbital Theory (MOT) for homonuclear diatomic molecules (O₂, N₂).",
        bookChapterTitle: "NCERT Class 11 Chemistry Chapter 4",
        resourceLinks: [
          { title: "Hybridization & MOT Energy Diagrams", type: "Mindmap", description: "Shapes, bond angles, and MOT bond order formula." },
        ],
        topics: [
          {
            id: "top-c11-c-2-1",
            name: "VSEPR Theory, Hybridization and Molecular Orbital Theory",
            keyConcepts: ["VSEPR Geometry vs Shape with lone pairs", "Hybridization steric number rule", "Bond Order = ½(Nb - Na)", "Paramagnetism of O₂"],
            vviPoints: ["Bond order > 0 indicates stable molecule; fractional bond order exists; O₂ is paramagnetic due to 2 unpaired electrons in antibonding π* orbitals"],
            summaryNote: "Hybridization is the intermixing of atomic orbitals of nearly same energy to produce new equivalent hybrid orbitals.",
            bookReference: "NCERT Section 4.2 - 4.7",
            formulasOrRules: ["Bond Order = (Nb - Na) / 2", "Steric Number = (Bond pairs) + (Lone pairs)"],
          },
        ],
      },
      {
        id: "ch-c11-ch-3",
        chapterNumber: 3,
        title: "Thermodynamics and Chemical Equilibrium",
        priority: "VVI",
        notesSummary: "First law, enthalpy ΔH = ΔU + ΔngRT, Hess's Law, spontaneity: Entropy ΔS and Gibbs free energy ΔG = ΔH - TΔS. Law of chemical equilibrium, Kc and Kp relation Kp = Kc(RT)^Δng, Le Chatelier's Principle, Ionic equilibrium: pH, Ostwald dilution law, Buffer solutions, Solubility product Ksp.",
        bookChapterTitle: "NCERT Class 11 Chemistry Chapter 5 & 6",
        resourceLinks: [
          { title: "Equilibrium Constants & Buffer Action Table", type: "Formula Sheet", description: "Henderson-Hasselbalch equation and Le Chatelier rules." },
        ],
        topics: [
          {
            id: "top-c11-c-3-1",
            name: "Gibbs Free Energy Spontaneity & Le Chatelier's Principle",
            keyConcepts: ["ΔG < 0 for spontaneous process", "Kp = Kc(RT)^Δng", "Effect of temperature, pressure, concentration on equilibrium", "Common ion effect & Ksp"],
            vviPoints: ["For exothermic reaction (ΔH < 0), increasing temperature shifts equilibrium to left (decreases K)"],
            summaryNote: "Le Chatelier's Principle: When a system in equilibrium is subjected to a change in temperature, pressure, or concentration, it shifts in a direction to counteract the effect.",
            bookReference: "NCERT Chemistry Chapter 5 & 6",
            formulasOrRules: ["ΔG° = -RT ln K", "pH = pKa + log([Salt]/[Acid])", "Kp = Kc(RT)^Δng"],
          },
        ],
      },
      {
        id: "ch-c11-ch-4",
        chapterNumber: 4,
        title: "Organic Chemistry: Principles and Hydrocarbons",
        priority: "VVI",
        notesSummary: "IUPAC nomenclature, inductive effect (+I, -I), resonance effect (+R, -R), hyperconjugation, electromeric effect. Carbocation, carbanion and free radical stability. Alkanes (Wurtz reaction), Alkenes (Markovnikov & Anti-Markovnikov addition, Ozonolysis), Alkynes (acidity of terminal alkynes), Aromaticity (Hückel 4n+2 rule).",
        bookChapterTitle: "NCERT Class 11 Chemistry Chapter 8 & 9",
        resourceLinks: [
          { title: "Organic Electronic Effects & Mechanism Sheet", type: "Mindmap", description: "Carbocation stability (3° > 2° > 1°) and Markovnikov rule." },
        ],
        topics: [
          {
            id: "top-c11-c-4-1",
            name: "Reaction Intermediates, Markovnikov Rule & Aromaticity",
            keyConcepts: ["Resonance & Hyperconjugation", "Carbocation Stability: 3° > 2° > 1°", "Markovnikov Addition & Peroxide Effect", "Hückel Rule (4n+2) π electrons"],
            vviPoints: ["Ozonolysis of alkenes to determine position of double bond and identify aldehydes/ketones formed"],
            summaryNote: "Markovnikov's rule: In electrophilic addition of HX to asymmetric alkene, the negative part (X⁻) adds to the carbon having fewer hydrogen atoms.",
            bookReference: "NCERT Chemistry Chapter 8 & 9",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c11-sci-math",
    name: "Mathematics",
    code: "MATH-041",
    stream: "Science",
    classLevel: "Class 11",
    color: "blue",
    iconName: "Calculator",
    chapters: [
      {
        id: "ch-c11-m-1",
        chapterNumber: 1,
        title: "Sets, Relations, Functions & Trigonometry",
        priority: "VVI",
        notesSummary: "Venn diagrams, power sets, Cartesian products, domain & range of relations and functions (polynomial, rational, modulus, signum, greatest integer). Trigonometric addition formulas: sin(A±B), cos(A±B), tan(A±B), double and triple angle identities.",
        bookChapterTitle: "NCERT Class 11 Maths Chapter 1, 2 & 3",
        resourceLinks: [
          { title: "Trigonometric Compound Angle Formulas", type: "Formula Sheet", description: "sin(A+B), cos(A+B), transformation of products to sums." },
        ],
        topics: [
          {
            id: "top-c11-m-1-1",
            name: "Functions and Compound Angle Trigonometry",
            keyConcepts: ["Domain & Range determination", "sin(A+B) and cos(A+B) expansions", "2sinA cosB = sin(A+B) + sin(A-B)"],
            vviPoints: ["Finding domain of square root functions √(f(x)) requiring f(x) ≥ 0"],
            summaryNote: "A function f: A -> B is a special relation where every element in set A has a unique image in set B.",
            bookReference: "NCERT Chapter 2 & 3",
            formulasOrRules: [
              "sin 2A = 2 sin A cos A",
              "cos 2A = cos²A - sin²A = 2cos²A - 1 = 1 - 2sin²A",
              "tan 2A = (2 tan A) / (1 - tan²A)"
            ],
          },
        ],
      },
      {
        id: "ch-c11-m-2",
        chapterNumber: 2,
        title: "Permutations, Combinations & Binomial Theorem",
        priority: "Important",
        notesSummary: "Fundamental principle of multiplication and addition, Factorials, nPr = n!/(n-r)!, nCr = n!/(r!(n-r)!). Pascal's triangle, Binomial theorem for positive integral index (a+b)^n = Σ nCr a^(n-r) b^r, general term Tr+1 = nCr a^(n-r) b^r, middle term.",
        bookChapterTitle: "NCERT Class 11 Maths Chapter 6 & 7",
        resourceLinks: [
          { title: "Combinatorics and Binomial General Term", type: "Formula Sheet", description: "Permutation with repetition, circular permutations, middle terms." },
        ],
        topics: [
          {
            id: "top-c11-m-2-1",
            name: "Combinatorics and Binomial Expansion",
            keyConcepts: ["nCr + nC(r-1) = (n+1)Cr", "General term Tr+1 = nCr a^(n-r) b^r", "Term independent of x in expansion"],
            vviPoints: ["Number of terms in (a+b)^n is always n+1"],
            summaryNote: "Permutations order matters; in combinations order does not matter. nCr = nC(n-r).",
            bookReference: "NCERT Chapter 6 & 7",
            formulasOrRules: ["nPr = n! / (n - r)!", "nCr = n! / [r! (n - r)!]", "Tr+1 = nCr x^(n-r) y^r"],
          },
        ],
      },
      {
        id: "ch-c11-m-3",
        chapterNumber: 3,
        title: "Coordinate Geometry: Lines and Conic Sections",
        priority: "VVI",
        notesSummary: "Slope of line m = (y2-y1)/(x2-x1) = tan θ, parallel (m1=m2) and perpendicular (m1·m2 = -1) lines, forms of equations of line. Distance of point from line d = |ax1+by1+c|/√(a²+b²). Standard equations of Circle (x-h)² + (y-k)² = r², Parabola (y² = 4ax), Ellipse (x²/a² + y²/b² = 1), Hyperbola (x²/a² - y²/b² = 1).",
        bookChapterTitle: "NCERT Class 11 Maths Chapter 9 & 10",
        resourceLinks: [
          { title: "Conic Sections Master Chart", type: "Mindmap", description: "Foci, directrix, eccentricity, and latus rectum for all 4 conics." },
        ],
        topics: [
          {
            id: "top-c11-m-3-1",
            name: "Straight Lines and Standard Conic Sections",
            keyConcepts: ["Distance from point to line", "Parabola (e = 1)", "Ellipse (e < 1, b² = a²(1-e²))", "Hyperbola (e > 1, b² = a²(e²-1))"],
            vviPoints: ["Length of Latus Rectum: Parabola = 4a; Ellipse/Hyperbola = 2b²/a"],
            summaryNote: "Conic section is locus of a point whose distance from a fixed point (focus) is in constant ratio (eccentricity e) to distance from fixed line (directrix).",
            bookReference: "NCERT Chapter 9 & 10",
            formulasOrRules: ["d = |ax1 + by1 + c| / √(a² + b²)", "Ellipse e = √(1 - b²/a²)", "Latus Rectum = 2b²/a"],
          },
        ],
      },
      {
        id: "ch-c11-m-4",
        chapterNumber: 4,
        title: "Limits and Derivatives",
        priority: "VVI",
        notesSummary: "Intuitive meaning of limit, standard limits lim(x->0) sin x / x = 1, lim(x->a) (x^n - a^n)/(x - a) = n a^(n-1). First principle of differentiation f'(x) = lim(h->0) [f(x+h) - f(x)]/h. Product rule (uv)' = u'v + uv', Quotient rule (u/v)' = (u'v - uv')/v².",
        bookChapterTitle: "NCERT Class 11 Maths Chapter 12",
        resourceLinks: [
          { title: "Calculus Derivatives & First Principle Table", type: "Formula Sheet", description: "Standard derivative formulas for x^n, sin x, cos x, tan x." },
        ],
        topics: [
          {
            id: "top-c11-m-4-1",
            name: "Evaluation of Limits and Derivatives from First Principles",
            keyConcepts: ["Algebra of limits", "Standard limits (0/0 indeterminate forms)", "Derivative by First Principle definition"],
            vviPoints: ["First principle derivation of derivative of sin x, cos x, x^n is guaranteed question"],
            summaryNote: "Derivative represents instantaneous rate of change of y with respect to x. d/dx(x^n) = n x^(n-1).",
            bookReference: "NCERT Chapter 12",
            formulasOrRules: ["lim(x->0) (sin x / x) = 1", "d/dx(u · v) = u'v + uv'", "d/dx(u / v) = (u'v - uv') / v²"],
          },
        ],
      },
    ],
  },
  {
    id: "sub-c11-sci-bio",
    name: "Biology",
    code: "BIO-044",
    stream: "Science",
    classLevel: "Class 11",
    color: "rose",
    iconName: "Dna",
    chapters: [
      {
        id: "ch-c11-b-1",
        chapterNumber: 1,
        title: "Cell: The Unit of Life & Cell Cycle",
        priority: "VVI",
        notesSummary: "Prokaryotic vs eukaryotic cells, cell membrane Fluid Mosaic Model (Singer & Nicolson), endomembrane system (ER, Golgi apparatus, Lysosomes, Vacuoles), Mitochondria (powerhouse, ATP), Chloroplasts, Ribosomes, Nucleus. Cell cycle: Interphase (G1, S, G2) and M-phase (Mitosis: Prophase, Metaphase, Anaphase, Telophase; Meiosis I & II).",
        bookChapterTitle: "NCERT Class 11 Biology Chapter 8 & 10",
        resourceLinks: [
          { title: "Cell Organelles & Mitosis Stages Diagram", type: "Mindmap", description: "Stages of meiosis and crossing over in Pachytene." },
        ],
        topics: [
          {
            id: "top-c11-b-1-1",
            name: "Cell Organelles, Mitosis and Meiosis",
            keyConcepts: ["Fluid Mosaic Model", "DNA replication in S-phase", "Recombinase enzyme & Crossing over in Pachytene", "Significance of meiosis in generating genetic variation"],
            vviPoints: ["Stages of Prophase I in Meiosis: Leptotene, Zygotene (synapsis), Pachytene (crossing over), Diplotene (chiasmata), Diakinesis"],
            summaryNote: "Mitosis produces two genetically identical diploid (2n) daughter cells. Meiosis produces four non-identical haploid (n) gametes.",
            bookReference: "NCERT Biology Chapter 8 & 10",
          },
        ],
      },
      {
        id: "ch-c11-b-2",
        chapterNumber: 2,
        title: "Plant and Human Physiology",
        priority: "VVI",
        notesSummary: "Plant: Photosynthesis in higher plants (Light reaction, Z-scheme, Calvin C3 cycle, Hatch-Slack C4 pathway, Photorespiration), Respiration (Glycolysis, Krebs cycle, ETS). Human: Digestion & absorption, Breathing & exchange of gases (Hemoglobin dissociation curve), Body fluids (Blood groups, ECG, Cardiac cycle), Excretory system (Nephron, RAAS mechanism), Neural and chemical coordination.",
        bookChapterTitle: "NCERT Class 11 Biology Unit 4 & 5",
        resourceLinks: [
          { title: "Calvin Cycle & Cardiac Cycle Flowchart", type: "Mindmap", description: "C3 vs C4 photosynthetic pathway and RAAS kidney loop." },
        ],
        topics: [
          {
            id: "top-c11-b-2-1",
            name: "C3/C4 Pathways, Glycolysis and RAAS Regulation",
            keyConcepts: ["RuBisCO dual enzyme nature", "Kranz anatomy in C4 plants (prevents photorespiration)", "Glycolysis 10 steps (EMP pathway)", "Renin-Angiotensin-Aldosterone System (RAAS) in kidney regulation"],
            vviPoints: ["Net ATP generated in aerobic respiration of 1 glucose molecule = 36 or 38 ATP"],
            summaryNote: "C4 plants fix CO₂ using PEP carboxylase in mesophyll cells, avoiding wasteful photorespiration and yielding higher biomass.",
            bookReference: "NCERT Biology Unit 4 & 5",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c11-sci-eng",
    name: "English Core",
    code: "ENG-301",
    stream: "Science",
    classLevel: "Class 11",
    color: "amber",
    iconName: "BookOpen",
    chapters: [
      {
        id: "ch-c11-eng-1",
        chapterNumber: 1,
        title: "Hornbill & Snapshots: Literature Core",
        priority: "VVI",
        notesSummary: "The Portrait of a Lady (Khushwant Singh), We're Not Afraid to Die... if We Can All Be Together, Discovering Tut: the Saga Continues, The Laburnum Top (Ted Hughes), The Voice of the Rain (Walt Whitman), Childhood (Markus Natten), The Summer of the Beautiful White Horse (William Saroyan), The Address (Marga Minco), Mother's Day (J.B. Priestley).",
        bookChapterTitle: "NCERT Class 11 English Hornbill & Snapshots",
        resourceLinks: [
          { title: "Literature Summaries & Poetic Themes", type: "Quick CheatSheet", description: "Key character sketches and underlying moral motifs." },
        ],
        topics: [
          {
            id: "top-c11-e-1-1",
            name: "Prose Analysis, Character Sketches and Poetic Devices",
            keyConcepts: ["Spiritual connection in Portrait of a Lady", "Human courage and endurance in maritime storm", "Symbolism in Laburnum Top and Voice of Rain"],
            vviPoints: ["Contrast between city school education and village grandmother's spiritual lifestyle"],
            summaryNote: "Literature builds critical reasoning, empathy, and appreciation for artistic expression across prose and verse.",
            bookReference: "NCERT Hornbill & Snapshots",
          },
        ],
      },
      {
        id: "ch-c11-eng-2",
        chapterNumber: 2,
        title: "Advanced Reading and Writing Skills",
        priority: "Important",
        notesSummary: "Note-Making & Summarising (Heading, Sub-headings, Abbreviations key), Notice Writing (50 words), Poster Designing, Letter to the Editor, Job Application with Bio-data, Speech and Debate writing.",
        bookChapterTitle: "CBSE Class 11 English Core Writing Skills",
        resourceLinks: [
          { title: "Note-Making & Notice Format Template", type: "Formula Sheet", description: "CBSE official format rules and indentation standards." },
        ],
        topics: [
          {
            id: "top-c11-e-2-1",
            name: "Note Making and Professional Writing Formats",
            keyConcepts: ["Indentation and numbering (1.1, 1.2)", "Minimum 4-5 recognized abbreviations with key", "Notice format within 50-word limit"],
            vviPoints: ["Note-making format: Title, Indented notes, Key to abbreviations, Summary in 50 words"],
            summaryNote: "Effective writing combines brevity, formal tone, logical organization, and accurate adherence to prescribed layouts.",
            bookReference: "CBSE Writing Skills Guidelines",
          },
        ],
      },
    ],
  },
];

// -----------------------------------------------------------------------
// 3. CLASS 11 COMMERCE CURRICULUM
// -----------------------------------------------------------------------

export const CLASS11_COMMERCE_CURRICULUM: CurriculumSubject[] = [
  {
    id: "sub-c11-comm-acc",
    name: "Accountancy",
    code: "ACC-055",
    stream: "Commerce",
    classLevel: "Class 11",
    color: "emerald",
    iconName: "Briefcase",
    chapters: [
      {
        id: "ch-c11-acc-1",
        chapterNumber: 1,
        title: "Introduction to Accounting & Accounting Principles",
        priority: "VVI",
        notesSummary: "Objectives, advantages, limitations of accounting. Users of financial info. Accounting Concepts: Business Entity, Money Measurement, Going Concern, Accounting Period, Cost Concept, Dual Aspect (Assets = Liabilities + Capital), Revenue Recognition, Matching Principle, Conservatism (Prudence), Materiality, Full Disclosure.",
        bookChapterTitle: "NCERT Class 11 Accountancy Chapter 1 & 2",
        resourceLinks: [
          { title: "Accounting Principles Master Cheat Sheet", type: "Quick CheatSheet", description: "12 GAAP principles with practical business examples." },
        ],
        topics: [
          {
            id: "top-c11-acc-1-1",
            name: "GAAP Concepts and Accounting Equation",
            keyConcepts: ["Dual Aspect Concept: Assets = Liabilities + Capital", "Prudence Principle (Anticipate no profit, provide for all losses)", "Going Concern Assumption"],
            vviPoints: ["Effect of transactions on Accounting Equation (Assets = Liabilities + Equity)"],
            summaryNote: "Accounting is the art of recording, classifying, and summarizing in a significant manner and in terms of money, transactions and events which are financial in character.",
            bookReference: "NCERT Chapter 1 & 2",
            formulasOrRules: ["Assets = Liabilities + Capital", "Capital = Assets - Liabilities"],
          },
        ],
      },
      {
        id: "ch-c11-acc-2",
        chapterNumber: 2,
        title: "Recording of Transactions: Journal, Ledger & Trial Balance",
        priority: "VVI",
        notesSummary: "Rules of Debit and Credit: Traditional approach (Personal, Real, Nominal accounts) vs Modern approach (Assets, Liabilities, Capital, Revenue, Expenses). Source documents, Voucher preparation, Journal entries, Cash Book (Single, Double, Petty column), Special Purpose Subsidiary Books, Ledger posting, Balancing of accounts, Preparation of Trial Balance.",
        bookChapterTitle: "NCERT Class 11 Accountancy Chapter 3",
        resourceLinks: [
          { title: "Rules of Debit & Credit Golden Rules", type: "Formula Sheet", description: "Debit what comes in, credit what goes out; Debit receiver, credit giver; Debit expenses, credit gains." },
        ],
        topics: [
          {
            id: "top-c11-acc-2-1",
            name: "Double Entry Journal Entries & Subsidiary Books",
            keyConcepts: ["Golden Rules of Accounting", "Modern Classification (Increase in Assets/Expenses = Debit)", "Trade Discount vs Cash Discount treatment", "Compound Journal Entries"],
            vviPoints: ["Trade discount is not recorded in books of account; only cash discount is recorded"],
            summaryNote: "Every transaction has two equal and opposite effects: Total Debits must equal Total Credits in every entry.",
            bookReference: "NCERT Chapter 3",
          },
        ],
      },
      {
        id: "ch-c11-acc-3",
        chapterNumber: 3,
        title: "Bank Reconciliation Statement (BRS) & Depreciation",
        priority: "VVI",
        notesSummary: "Need for BRS, reasons for differences between Cash Book balance and Pass Book balance (Timing differences, transactions recorded by bank only, errors). Depreciation: Straight Line Method (SLM) vs Written Down Value Method (WDV). Provision for Depreciation Account, Asset Disposal Account, Provisions vs Reserves.",
        bookChapterTitle: "NCERT Class 11 Accountancy Chapter 4 & 5",
        resourceLinks: [
          { title: "BRS Adjustment Rules & SLM/WDV Table", type: "Formula Sheet", description: "Step-by-step additions and deductions starting from Cash Book vs Pass Book balance." },
        ],
        topics: [
          {
            id: "top-c11-acc-3-1",
            name: "BRS Reconciliation & SLM vs WDV Depreciation",
            keyConcepts: ["Cheques issued but not presented", "Cheques deposited but not cleared", "Direct deposit by customer", "SLM annual depreciation = (Cost - Scrap) / Life", "WDV declining balance"],
            vviPoints: ["Preparation of BRS with Amended Cash Book balance"],
            summaryNote: "BRS reconciles the bank balance shown in business cash book with bank passbook balance on a given date to detect errors and fraud.",
            bookReference: "NCERT Chapter 4 & 5",
            formulasOrRules: ["Annual Dep (SLM) = (Cost of Asset - Estimated Scrap Value) / Useful Life", "Rate of Dep (SLM) = (Annual Dep / Cost) × 100"],
          },
        ],
      },
      {
        id: "ch-c11-acc-4",
        chapterNumber: 4,
        title: "Financial Statements of Sole Proprietorship",
        priority: "VVI",
        notesSummary: "Trading Account (Gross Profit / Gross Loss), Profit & Loss Account (Net Profit / Net Loss), Balance Sheet (Financial position). Adjustments: Closing stock, Outstanding expenses, Prepaid expenses, Accrued income, Income received in advance, Depreciation, Bad debts & Provision for Doubtful debts, Provision for discount on debtors, Interest on capital & drawings.",
        bookChapterTitle: "NCERT Class 11 Accountancy Chapter 8 & 9",
        resourceLinks: [
          { title: "12 Balance Sheet Adjustments Master Table", type: "Mindmap", description: "Dual accounting effect of all 12 year-end adjustments." },
        ],
        topics: [
          {
            id: "top-c11-acc-4-1",
            name: "Trading, P&L Account and Balance Sheet with Adjustments",
            keyConcepts: ["Cost of Goods Sold (COGS) = Opening Stock + Net Purchases + Direct Expenses - Closing Stock", "Calculation of New Provision for Doubtful Debts on Good Debtors", "Marshalling of Balance Sheet (Liquidity vs Permanence order)"],
            vviPoints: ["Adjustment items given outside trial balance appear at two places: in Trading/P&L and in Balance Sheet"],
            summaryNote: "Financial statements present the true and fair view of operating profitability and financial standing at the close of accounting period.",
            bookReference: "NCERT Chapter 8 & 9",
            formulasOrRules: ["COGS = Opening Stock + Net Purchases + Direct Expenses - Closing Stock", "Gross Profit = Net Sales - COGS"],
          },
        ],
      },
    ],
  },
  {
    id: "sub-c11-comm-bst",
    name: "Business Studies",
    code: "BST-054",
    stream: "Commerce",
    classLevel: "Class 11",
    color: "cyan",
    iconName: "Building2",
    chapters: [
      {
        id: "ch-c11-bst-1",
        chapterNumber: 1,
        title: "Nature & Purpose of Business and Forms of Organisation",
        priority: "VVI",
        notesSummary: "Economic vs non-economic activities, Characteristics of business, Industry (Primary, Secondary, Tertiary), Commerce (Trade and Auxiliaries to Trade). Forms of business: Sole Proprietorship, Joint Hindu Family, Partnership (Partnership Deed, Registration, Types of partners), Cooperative Societies, Joint Stock Company (Formation stages: Promotion, Incorporation, Capital Subscription, Commencement of business).",
        bookChapterTitle: "NCERT Class 11 BST Chapter 1 & 2",
        resourceLinks: [
          { title: "Business Forms Comparison Matrix", type: "Quick CheatSheet", description: "Liability, continuity, control, and capital comparison across 5 forms." },
        ],
        topics: [
          {
            id: "top-c11-bst-1-1",
            name: "Forms of Business Organisations & Company Formation",
            keyConcepts: ["Unlimited liability of sole proprietor & partners vs limited liability in company", "Memorandum of Association (MoA) clauses", "Articles of Association (AoA)", "Cooperative Society principles (One man one vote)"],
            vviPoints: ["MoA is the charter of company defining scope and limitations; ultra vires doctrine"],
            summaryNote: "Choice of business form depends on capital requirement, liability risk, managerial competence, degree of control, and legal formalities.",
            bookReference: "NCERT Chapter 1 & 2",
          },
        ],
      },
      {
        id: "ch-c11-bst-2",
        chapterNumber: 2,
        title: "Sources of Business Finance & Emerging Modes",
        priority: "VVI",
        notesSummary: "Owner's funds (Equity shares, Preference shares, Retained earnings, GDR/ADR/IDR) vs Borrowed funds (Debentures, Commercial banks, Financial institutions, Trade credit, Public deposits, Inter-Corporate Deposits). Emerging modes: E-Business (B2B, B2C, C2C), Outsourcing (BPO, KPO), Social responsibility of business & Corporate Social Responsibility (CSR).",
        bookChapterTitle: "NCERT Class 11 BST Chapter 5, 6 & 7",
        resourceLinks: [
          { title: "Equity vs Debentures Financing Chart", type: "Mindmap", description: "Risk, return, control, and cost comparison of funding sources." },
        ],
        topics: [
          {
            id: "top-c11-bst-2-1",
            name: "Equity vs Preference Shares, Debentures and CSR",
            keyConcepts: ["Equity voting rights and dividend risk", "Preference dividend priority", "Debentures fixed charge and tax deductibility", "Four responsibilities: Economic, Legal, Ethical, Philanthropic"],
            vviPoints: ["Debentures interest is a tax-deductible expense, reducing taxable corporate profits"],
            summaryNote: "Financing strategy balances cost of capital and financial risk to maximize shareholders' wealth.",
            bookReference: "NCERT Chapter 7 & 6",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c11-comm-eco",
    name: "Economics",
    code: "ECO-030",
    stream: "Commerce",
    classLevel: "Class 11",
    color: "purple",
    iconName: "TrendingUp",
    chapters: [
      {
        id: "ch-c11-eco-1",
        chapterNumber: 1,
        title: "Microeconomics: Consumer's Equilibrium & Demand",
        priority: "VVI",
        notesSummary: "Central problems of an economy (What, How, For Whom to produce), Production Possibility Curve (PPC) and Opportunity Cost. Marginal Utility analysis, Law of Diminishing Marginal Utility, Indifference Curve analysis (Properties: downward sloping, convex to origin due to diminishing MRS, higher IC gives higher utility), Budget Line, Consumer's Equilibrium (MRS_xy = Px/Py). Law of Demand, Elasticity of Demand (Price elasticity Ed = %ΔQ / %ΔP).",
        bookChapterTitle: "NCERT Class 11 Introductory Microeconomics Chapter 1 & 2",
        resourceLinks: [
          { title: "Indifference Curve & Demand Elasticity Guide", type: "Formula Sheet", description: "Formulas for Ed, MRS, and Consumer Equilibrium conditions." },
        ],
        topics: [
          {
            id: "top-c11-eco-1-1",
            name: "Consumer Equilibrium (Utility & IC Approach) & Demand Elasticity",
            keyConcepts: ["Law of Diminishing Marginal Utility", "Indifference Curve & Marginal Rate of Substitution (MRS)", "Budget Line Px·Qx + Py·Qy = M", "Degrees of Price Elasticity (Ed = 0, Ed < 1, Ed = 1, Ed > 1, Ed = ∞)"],
            vviPoints: ["Conditions for Consumer's Equilibrium using IC: (i) MRS_xy = Px/Py, (ii) IC must be convex to origin at equilibrium point"],
            summaryNote: "Consumer reaches equilibrium when the rate at which they are willing to substitute goods matches the market price ratio.",
            bookReference: "NCERT Microeconomics Chapter 2",
            formulasOrRules: ["Ed = - (%ΔQ / %ΔP) = - (ΔQ/ΔP) × (P/Q)", "MRS_xy = - Δy / Δx = MUx / MUy"],
          },
        ],
      },
      {
        id: "ch-c11-eco-2",
        chapterNumber: 2,
        title: "Statistics for Economics: Measures of Central Tendency & Dispersion",
        priority: "Important",
        notesSummary: "Collection of data (Primary vs Secondary), Census vs Sample method, Tabular & graphical presentation. Arithmetic Mean (Direct, Short-cut, Step-deviation), Median, Mode. Measures of Dispersion: Range, Quartile Deviation, Mean Deviation, Standard Deviation (σ = √[Σ(x - x̄)² / N]), Coefficient of Variation (CV = (σ/x̄) × 100 for consistency). Correlation (Karl Pearson's r) & Index Numbers (Laspeyres, Paasche, Fisher's Ideal Index).",
        bookChapterTitle: "NCERT Class 11 Statistics for Economics",
        resourceLinks: [
          { title: "Statistical Formulas Master Summary", type: "Formula Sheet", description: "Standard deviation, Karl Pearson's r, and Fisher's Ideal Index." },
        ],
        topics: [
          {
            id: "top-c11-eco-2-1",
            name: "Standard Deviation, Correlation and Fisher's Index",
            keyConcepts: ["Standard Deviation formula for grouped data", "Karl Pearson's coefficient of correlation (-1 ≤ r ≤ +1)", "Fisher's Ideal Index = √(L × P)", "Time Reversal & Factor Reversal Tests"],
            vviPoints: ["Fisher's Index is called 'Ideal' because it satisfies both Time Reversal and Factor Reversal tests"],
            summaryNote: "Statistics provides quantitative tools to measure trends, variability, and causal economic relationships for evidence-based policy.",
            bookReference: "NCERT Statistics Chapter 5, 6, 7 & 8",
            formulasOrRules: [
              "σ = √[(Σfd² / N) - (Σfd / N)²] × c",
              "r = Σxy / √(Σx² · Σy²)",
              "Fisher P01 = √[ (Σp1q0/Σp0q0) × (Σp1q1/Σp0q1) ] × 100"
            ],
          },
        ],
      },
    ],
  },
  {
    id: "sub-c11-comm-eng",
    name: "English Core",
    code: "ENG-301",
    stream: "Commerce",
    classLevel: "Class 11",
    color: "amber",
    iconName: "BookOpen",
    chapters: [
      {
        id: "ch-c11-comm-eng-1",
        chapterNumber: 1,
        title: "Hornbill Prose & Snapshots Core",
        priority: "VVI",
        notesSummary: "The Portrait of a Lady (Khushwant Singh), We're Not Afraid to Die... if We Can All Be Together, Discovering Tut, The Laburnum Top, The Voice of the Rain, Childhood, The Summer of the Beautiful White Horse, The Address, Mother's Day.",
        bookChapterTitle: "NCERT Class 11 English Hornbill & Snapshots",
        resourceLinks: [
          { title: "Key Characters and Thematic Quotes", type: "Quick CheatSheet", description: "Comprehensive study notes on prescribed prose and poetry." },
        ],
        topics: [
          {
            id: "top-c11-ce-1-1",
            name: "Literature Themes, Context and Poetic Devices",
            keyConcepts: ["Character sketches of Khushwant Singh's grandmother", "Aram and Mourad's code of honesty", "Mrs. Pearson's emancipation in Mother's Day"],
            vviPoints: ["Thematic conflict between spiritual tradition and western material education"],
            summaryNote: "Comprehensive appreciation of prose and poetry for board examination and competitive language tests.",
            bookReference: "NCERT Hornbill & Snapshots",
          },
        ],
      },
      {
        id: "ch-c11-comm-eng-2",
        chapterNumber: 2,
        title: "Commercial Correspondence & Writing Skills",
        priority: "Important",
        notesSummary: "Business Letters (Inquiry, Order Placement, Complaint, Cancellation), Letter to Editor, Job Application with Resume, Notice Writing, Advertisements (Classified: For Sale, Situation Vacant/Wanted, Lost & Found), Speech Writing.",
        bookChapterTitle: "CBSE English Core Commercial Writing Section",
        resourceLinks: [
          { title: "Business Letter Formats & Classified Formats", type: "Formula Sheet", description: "Standard business correspondence layouts and templates." },
        ],
        topics: [
          {
            id: "top-c11-ce-2-1",
            name: "Business Letter Layouts and Job Application Resume",
            keyConcepts: ["Formal business letter formatting", "Classified advertisement word economy", "Resume/Bio-data layout for job applications"],
            vviPoints: ["Marks distribution: Format (1), Content (2), Expression/Accuracy (2)"],
            summaryNote: "Commercial writing prioritizes clarity, conciseness, professional courtesy, and accurate functional details.",
            bookReference: "CBSE English Writing Standards",
          },
        ],
      },
    ],
  },
];

// -----------------------------------------------------------------------
// 4. CLASS 11 ARTS / HUMANITIES CURRICULUM
// -----------------------------------------------------------------------

export const CLASS11_ARTS_CURRICULUM: CurriculumSubject[] = [
  {
    id: "sub-c11-arts-hist",
    name: "History",
    code: "HIST-027",
    stream: "Arts / Humanities",
    classLevel: "Class 11",
    color: "amber",
    iconName: "Landmark",
    chapters: [
      {
        id: "ch-c11-h-1",
        chapterNumber: 1,
        title: "Writing and City Life & An Empire Across Three Continents",
        priority: "VVI",
        notesSummary: "Mesopotamian civilisation (Tigris and Euphrates), Urbanisation in Uruk and Ur, Cuneiform writing system on clay tablets, Temple economy. Roman Empire: Mediterranean basin, Augustus (Pax Romana), Principate, Senate, Army, Slavery, Gender and family, Late Antiquity and Constantine (Christianity adoption).",
        bookChapterTitle: "NCERT Class 11 Themes in World History Theme 1 & 2",
        resourceLinks: [
          { title: "Mesopotamia & Roman Empire Timeline", type: "Mindmap", description: "Chronology of world empires and urban transformations." },
        ],
        topics: [
          {
            id: "top-c11-h-1-1",
            name: "Mesopotamian Urbanism and Roman Imperial Structure",
            keyConcepts: ["Cuneiform script & seal inscriptions", "Three players in Roman politics: Emperor, Senate, Army", "Pax Romana under Augustus", "Late Antiquity transition"],
            vviPoints: ["Significance of writing in Mesopotamian record keeping and trade expansion"],
            summaryNote: "Mesopotamia pioneered urban living and cuneiform records. The Roman Empire created a vast transcontinental administrative and legal apparatus.",
            bookReference: "NCERT Themes in World History Theme 1 & 2",
          },
        ],
      },
      {
        id: "ch-c11-h-2",
        chapterNumber: 2,
        title: "The Three Orders & Changing Cultural Traditions",
        priority: "VVI",
        notesSummary: "Feudal Western Europe: First Order (Clergy - Catholic Church, tithe), Second Order (Nobility - Vassalage, Manor system, Knights), Third Order (Peasants - Free vs Serfs). 14th century crises (Black Death, climatic cooling, peasant revolts). European Renaissance (14th-17th century): Humanism in Italy, Universities, Vernacular literature, Gutenberg press, Scientific revolution (Copernicus, Galileo).",
        bookChapterTitle: "NCERT Class 11 Themes in World History Theme 4 & 5",
        resourceLinks: [
          { title: "Feudal Manorialism & Renaissance Humanism Sheet", type: "Quick CheatSheet", description: "Feudal hierarchy vs Renaissance humanistic inquiry." },
        ],
        topics: [
          {
            id: "top-c11-h-2-1",
            name: "Feudal Society and the Renaissance Humanist Revolution",
            keyConcepts: ["Manor estate self-sufficiency and serfdom", "Impact of Bubonic Plague (Black Death)", "Humanism emphasizing individual dignity and secular learning", "Gutenberg printing press impact"],
            vviPoints: ["Comparison between medieval Christian scholasticism and Renaissance humanist study of Greek/Roman classics"],
            summaryNote: "Feudalism structured medieval European agrarian society. The Renaissance marked the transition from theological dominance to empirical rationalism.",
            bookReference: "NCERT Themes in World History Theme 4 & 5",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c11-arts-pol",
    name: "Political Science",
    code: "POL-028",
    stream: "Arts / Humanities",
    classLevel: "Class 11",
    color: "purple",
    iconName: "Scale",
    chapters: [
      {
        id: "ch-c11-pol-1",
        chapterNumber: 1,
        title: "Constitution: Why and How? & Rights in Indian Constitution",
        priority: "VVI",
        notesSummary: "Making of the Indian Constitution, Constituent Assembly, Objective Resolution, Borrowed features. Fundamental Rights (Articles 12-35: Right to Equality, Freedom, Against Exploitation, Religious Freedom, Cultural & Educational Rights, Constitutional Remedies - Article 32 Writs: Habeas Corpus, Mandamus, Prohibition, Quo Warranto, Certiorari). Directive Principles of State Policy (DPSP) vs Fundamental Rights.",
        bookChapterTitle: "NCERT Class 11 Indian Constitution at Work Chapter 1 & 2",
        resourceLinks: [
          { title: "Fundamental Rights & Article 32 Writs Guide", type: "Quick CheatSheet", description: "Explanation and legal remedies of 5 constitutional writs." },
        ],
        topics: [
          {
            id: "top-c11-pol-1-1",
            name: "Constitutional Philosophy, Fundamental Rights & Writs",
            keyConcepts: ["Constituent Assembly debates", "Article 32 as 'Heart and Soul of Constitution' (Dr. B.R. Ambedkar)", "5 Writs of Supreme Court/High Court", "DPSP non-justiciable character"],
            vviPoints: ["Differences between Fundamental Rights (enforceable in courts) and Directive Principles (moral/policy guidelines)"],
            summaryNote: "The Indian Constitution establishes a sovereign, socialist, secular, democratic republic, providing justiciable fundamental rights protected by the judiciary.",
            bookReference: "NCERT Indian Constitution at Work Chapter 1 & 2",
          },
        ],
      },
      {
        id: "ch-c11-pol-2",
        chapterNumber: 2,
        title: "Organs of Government & Political Theory Core",
        priority: "VVI",
        notesSummary: "Legislature: Bicameralism (Lok Sabha vs Rajya Sabha powers, Parliamentary procedures). Executive: President (Constitutional head, discretionary powers), Prime Minister and Council of Ministers. Judiciary: Independence of judiciary, Single integrated judicial system, Judicial Review and Public Interest Litigation (PIL). Political Theory: Freedom (Negative vs Positive liberty), Equality, Social Justice (John Rawls's Veil of Ignorance), Rights, Citizenship.",
        bookChapterTitle: "NCERT Class 11 Political Science: Constitution at Work & Political Theory",
        resourceLinks: [
          { title: "Organs of Govt & Rawls's Theory Mindmap", type: "Mindmap", description: "Powers of Parliament, Judicial Review, and Theory of Justice." },
        ],
        topics: [
          {
            id: "top-c11-pol-2-1",
            name: "Judicial Review, PIL and Rawls's Theory of Justice",
            keyConcepts: ["Judicial Activism through Public Interest Litigation (PIL)", "Negative Liberty (absence of obstacles) vs Positive Liberty (capacity to act)", "John Rawls's Difference Principle and Veil of Ignorance"],
            vviPoints: ["Basic Structure Doctrine established in Kesavananda Bharati case (1973)"],
            summaryNote: "Separation of powers and checks and balances ensure no single organ of government becomes autocratic, while political theory clarifies the normative values underpinning law.",
            bookReference: "NCERT Political Theory Chapter 2 & 4",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c11-arts-geo",
    name: "Geography",
    code: "GEO-029",
    stream: "Arts / Humanities",
    classLevel: "Class 11",
    color: "emerald",
    iconName: "Globe",
    chapters: [
      {
        id: "ch-c11-geo-1",
        chapterNumber: 1,
        title: "Fundamentals of Physical Geography",
        priority: "VVI",
        notesSummary: "Origin and evolution of Earth (Nebular hypothesis, Big Bang), Interior of Earth (Crust, Mantle, Core; P and S seismic waves), Continental Drift (Wegener) and Plate Tectonics (Divergent, Convergent, Transform boundaries). Landforms: Weathering, Fluvial (V-shaped valleys, oxbow lakes), Glacial (Cirques, Moraines), Aeolian (Barchans, Mushroom rocks). Atmosphere: Insolation, Heat budget, Pressure belts, Coriolis force, Planetary winds, Cyclones. Hydrosphere: Ocean floor configuration, Waves, Tides, Ocean currents.",
        bookChapterTitle: "NCERT Class 11 Fundamentals of Physical Geography",
        resourceLinks: [
          { title: "Earth Interior & Atmospheric Circulation Diagram", type: "Mindmap", description: "Tri-cellular circulation (Hadley, Ferrel, Polar cells) & Ocean currents." },
        ],
        topics: [
          {
            id: "top-c11-geo-1-1",
            name: "Plate Tectonics, Geomorphic Processes & Climatology",
            keyConcepts: ["Continental Drift evidence (Jigsaw fit, fossils, rocks)", "Plate boundaries and earthquake zones", "Heat budget of Earth", "Mechanism of Indian Monsoon (ITCZ shift, Jet streams)"],
            vviPoints: ["Role of Coriolis force in deflecting winds right in Northern Hemisphere and left in Southern Hemisphere (Ferrel's Law)"],
            summaryNote: "Physical geography examines the dynamic lithosphere, atmosphere, and hydrosphere interactions creating planetary landforms and climates.",
            bookReference: "NCERT Fundamentals of Physical Geography",
          },
        ],
      },
      {
        id: "ch-c11-geo-2",
        chapterNumber: 2,
        title: "India: Physical Environment",
        priority: "Important",
        notesSummary: "Location, space relations, Physiography: Northern Mountains (Himalayas), Northern Plains (Bhabar, Terai, Bhangar, Khadar), Peninsular Plateau (Deccan, Central Highlands), Coastal Plains, Islands (Andaman & Nicobar, Lakshadweep). Drainage Systems: Himalayan (Indus, Ganga, Brahmaputra) vs Peninsular rivers (Narmada, Tapi, Godavari, Krishna, Mahanadi, Kaveri). Soils and Natural Vegetation.",
        bookChapterTitle: "NCERT Class 11 India: Physical Environment",
        resourceLinks: [
          { title: "Indian River Basins & Physiography Map", type: "Quick CheatSheet", description: "Himalayan vs Peninsular drainage differences and tributaries." },
        ],
        topics: [
          {
            id: "top-c11-geo-2-1",
            name: "Physiographic Divisions & Indian River Systems",
            keyConcepts: ["Three Himalayan ranges: Himadri, Himachal, Shiwaliks", "Antecedent drainage in Himalayas", "East-flowing vs West-flowing Peninsular rivers", "Delta vs Estuary formation"],
            vviPoints: ["Comparison between Himalayan perennial rivers (snow-fed + rain-fed) and Peninsular seasonal rivers (rain-fed)"],
            summaryNote: "India's varied relief produces distinct climatic regimes, soil belts, biodiversity zones, and agricultural systems.",
            bookReference: "NCERT India: Physical Environment Chapter 2 & 3",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c11-arts-eco",
    name: "Economics",
    code: "ECO-030",
    stream: "Arts / Humanities",
    classLevel: "Class 11",
    color: "cyan",
    iconName: "TrendingUp",
    chapters: [
      {
        id: "ch-c11-arts-eco-1",
        chapterNumber: 1,
        title: "Indian Economic Development (1947-1990) & LPG Reforms",
        priority: "VVI",
        notesSummary: "State of Indian economy on eve of independence (Agricultural stagnation, Zamindari system, De-industrialisation). Five Year Plans (Growth, Modernisation, Self-reliance, Equity), Green Revolution, Land reforms, Industrial Policy Resolution 1956 (IPR 1956). Economic Crisis of 1991 (BOP crisis, inflation) and New Economic Policy: Liberalisation (deregulation, financial reforms), Privatisation (disinvestment), Globalisation (outsourcing, WTO).",
        bookChapterTitle: "NCERT Class 11 Indian Economic Development Chapter 1, 2 & 3",
        resourceLinks: [
          { title: "1991 LPG Reforms & Pre-1990 Planning Summary", type: "Mindmap", description: "Causes of 1991 crisis and key policy interventions." },
        ],
        topics: [
          {
            id: "top-c11-ae-1-1",
            name: "Green Revolution, 1991 Crisis & LPG Policy Reforms",
            keyConcepts: ["HYV seeds, fertilizers and Green Revolution impact", "Mahalanobis Heavy Industry Strategy", "BOP Crisis and IMF/World Bank conditionalities", "LPG Policy pillars: Deregulation, Disinvestment, Tariffs reduction"],
            vviPoints: ["Positive and negative appraisal of 1991 reforms on agriculture, industry, and service sectors"],
            summaryNote: "India transitioned in 1991 from an inward-looking, state-controlled mixed economy to a market-driven, globally integrated growth model.",
            bookReference: "NCERT Indian Economic Development Chapter 2 & 3",
          },
        ],
      },
      {
        id: "ch-c11-arts-eco-2",
        chapterNumber: 2,
        title: "Current Challenges: Poverty, Human Capital & Rural Development",
        priority: "Important",
        notesSummary: "Poverty lines (Tendulkar, Rangarajan), Government poverty alleviation programmes (MGNREGA). Human Capital Formation (Education, Healthcare, On-the-job training, Migration, Information). Rural Development (Rural credit: NABARD, Micro-credit SHGs, Agricultural marketing, Organic farming). Employment: Formal vs Informal sector, Worker-population ratio, Jobless growth.",
        bookChapterTitle: "NCERT Class 11 Indian Economic Development Chapter 4, 5, 6 & 7",
        resourceLinks: [
          { title: "Human Capital & Rural Credit Cheat Sheet", type: "Quick CheatSheet", description: "Sources of human capital and rural finance ecosystem." },
        ],
        topics: [
          {
            id: "top-c11-ae-2-1",
            name: "Human Capital Formation, Informalisation of Workforce & MGNREGA",
            keyConcepts: ["Physical Capital vs Human Capital", "Role of NABARD in rural credit refinance", "Informalisation of Indian workforce (unorganized sector lack of social security)", "MGNREGA 100-day guaranteed wage employment"],
            vviPoints: ["Human capital enhances labor productivity, innovation, and technological absorption capacity"],
            summaryNote: "Sustainable national development requires inclusive investments in health, education, skill-building, and social safety nets for informal workers.",
            bookReference: "NCERT Indian Economic Development Chapter 5, 6 & 7",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c11-arts-eng",
    name: "English Core",
    code: "ENG-301",
    stream: "Arts / Humanities",
    classLevel: "Class 11",
    color: "blue",
    iconName: "BookOpen",
    chapters: [
      {
        id: "ch-c11-arts-eng-1",
        chapterNumber: 1,
        title: "Hornbill & Snapshots Core Literature",
        priority: "VVI",
        notesSummary: "The Portrait of a Lady (Khushwant Singh), We're Not Afraid to Die... if We Can All Be Together, Discovering Tut: the Saga Continues, The Laburnum Top, The Voice of the Rain, Childhood, The Summer of the Beautiful White Horse, The Address, Mother's Day.",
        bookChapterTitle: "NCERT Class 11 English Hornbill & Snapshots",
        resourceLinks: [
          { title: "Literature Summaries & Poetic Devices", type: "Quick CheatSheet", description: "Theme analysis and literary devices across all texts." },
        ],
        topics: [
          {
            id: "top-c11-ae-lit-1",
            name: "Character Sketches, Critical Commentary and Poetic Themes",
            keyConcepts: ["Khushwant Singh's grandmother's spiritual legacy", "Mourad and Aram's tribal honor", "Loss of innocence in Markus Natten's Childhood"],
            vviPoints: ["Critical appreciation questions on human values, family bonds, and resilience"],
            summaryNote: "Literary study cultivates contextual analysis, critical discernment, and emotional intelligence.",
            bookReference: "NCERT Hornbill & Snapshots",
          },
        ],
      },
      {
        id: "ch-c11-arts-eng-2",
        chapterNumber: 2,
        title: "Discursive Reading, Note Making & Creative Writing",
        priority: "Important",
        notesSummary: "Unseen Passages (Comprehension, Vocabulary in context), Note Making & Summarising, Notice Writing, Poster Making, Speech Writing, Debate Writing, Letters to the Editor.",
        bookChapterTitle: "CBSE English Core Writing & Comprehension",
        resourceLinks: [
          { title: "Debate & Speech Format Framework", type: "Formula Sheet", description: "Persuasive techniques, opening salutations, and rebuttal structures." },
        ],
        topics: [
          {
            id: "top-c11-ae-lit-2",
            name: "Speech, Debate and Discursive Analysis",
            keyConcepts: ["Speech layout with formal address and rhetorical devices", "Debate structure with arguments for/against motion", "Note making indentation with summary"],
            vviPoints: ["Debate writing must take a clear stance (either strictly FOR or strictly AGAINST the motion)"],
            summaryNote: "Clear persuasive communication relies on structured argumentation, evidence citation, and crisp stylistic delivery.",
            bookReference: "CBSE Writing Guidelines",
          },
        ],
      },
    ],
  },
];

// -----------------------------------------------------------------------
// 5. CLASS 12 SCIENCE CURRICULUM
// -----------------------------------------------------------------------

export const CLASS12_SCIENCE_CURRICULUM: CurriculumSubject[] = [
  {
    id: "sub-c12-sci-phy",
    name: "Physics",
    code: "PHY-042",
    stream: "Science",
    classLevel: "Class 12",
    color: "cyan",
    iconName: "Zap",
    chapters: [
      {
        id: "ch-c12-phy-1",
        chapterNumber: 1,
        title: "Electrostatics & Current Electricity",
        priority: "VVI",
        notesSummary: "Coulomb's Law, Electric field due to dipole (axial & equatorial), Gauss's Law applications (infinite line, plane sheet, spherical shell). Electric potential V = 1/(4πε0) q/r, Capacitors in series/parallel, Energy stored in capacitor U = ½CV². Ohm's Law, Drift velocity vd = -eEτ/m, Kirchhoff's Laws, Wheatstone Bridge, Meter Bridge.",
        bookChapterTitle: "NCERT Class 12 Physics Chapter 1, 2 & 3",
        resourceLinks: [
          { title: "Gauss's Law Proofs & Circuit Rules", type: "Formula Sheet", description: "Derivations for axial/equatorial dipole and Kirchhoff's loop rule." },
        ],
        topics: [
          {
            id: "top-c12-p-1-1",
            name: "Gauss's Law Applications and Drift Velocity",
            keyConcepts: ["Flux Φ = ∮E·dA = q_enclosed / ε0", "Field due to infinite charged wire E = λ / (2πε0 r)", "Field due to thin plane sheet E = σ / (2ε0)", "I = n A e vd relation"],
            vviPoints: ["Derivation of field at axial and equatorial points of an electric dipole"],
            summaryNote: "Gauss's Law allows calculating electric fields for symmetric charge distributions easily. Current density j = σE = n e vd.",
            bookReference: "NCERT Physics Chapter 1 & 3",
            formulasOrRules: ["E_axial = 2kp / r³", "E_equatorial = kp / r³", "vd = (eE / m) τ", "I = n e A vd"],
          },
        ],
      },
      {
        id: "ch-c12-phy-2",
        chapterNumber: 2,
        title: "Magnetism, EMI and Alternating Current",
        priority: "VVI",
        notesSummary: "Biot-Savart Law, Ampere's Circuital Law, Force on current wire F = I(L×B), Moving Coil Galvanometer and conversion to Ammeter/Voltmeter. Faraday's Laws of EMI, Lenz's Law, Self & Mutual Inductance. AC: RMS values (I_rms = I0/√2), LCR series circuit impedance Z = √[R² + (XL - XC)²], Resonance frequency f0 = 1/(2π√LC), Power factor cos Φ, Transformers.",
        bookChapterTitle: "NCERT Class 12 Physics Chapter 4, 5, 6 & 7",
        resourceLinks: [
          { title: "LCR Circuit Phasor & Transformer Guide", type: "Mindmap", description: "Phasor diagrams, impedance triangle, and transformer turns ratio." },
        ],
        topics: [
          {
            id: "top-c12-p-2-1",
            name: "LCR Series Resonance, Lenz's Law & Transformers",
            keyConcepts: ["Lenz's law conservation of energy", "Resonance in series LCR when XL = XC (Z = R)", "Quality factor Q = ω0 L / R", "Transformer equation Vs/Vp = Ns/Np = Ip/Is"],
            vviPoints: ["Resonance condition in series LCR produces maximum current amplitude and unity power factor (cos Φ = 1)"],
            summaryNote: "AC circuits require phasor analysis because inductor current lags voltage by 90° while capacitor current leads voltage by 90°.",
            bookReference: "NCERT Physics Chapter 6 & 7",
            formulasOrRules: [
              "Z = √[R² + (ωL - 1/ωC)²]",
              "f_res = 1 / (2π√(LC))",
              "P_avg = V_rms I_rms cos Φ",
              "Vs / Vp = Ns / Np = Ip / Is"
            ],
          },
        ],
      },
      {
        id: "ch-c12-phy-3",
        chapterNumber: 3,
        title: "Optics: Ray and Wave Optics",
        priority: "VVI",
        notesSummary: "Refraction at spherical surfaces, Lens Maker's Formula 1/f = (μ-1)(1/R1 - 1/R2), Prism formula μ = sin((A+δm)/2) / sin(A/2), Astronomical telescope and compound microscope. Wave optics: Huygens' Principle (reflection & refraction proof), Young's Double Slit Experiment (YDSE) fringe width β = λD/d, Single slit diffraction condition.",
        bookChapterTitle: "NCERT Class 12 Physics Chapter 9 & 10",
        resourceLinks: [
          { title: "Lens Maker & YDSE Interference Derivations", type: "Formula Sheet", description: "Step-by-step proofs of Lens Maker formula and YDSE fringe width." },
        ],
        topics: [
          {
            id: "top-c12-p-3-1",
            name: "Lens Maker's Formula and YDSE Interference",
            keyConcepts: ["Lens Maker's formula derivation", "Telescope magnifying power in normal adjustment m = fo/fe", "Huygens wavelets wavefront propagation", "YDSE Fringe width β = λD/d"],
            vviPoints: ["Proving laws of reflection and refraction using Huygens wave theory"],
            summaryNote: "Interference results from superposition of coherent waves. In YDSE, all dark and bright fringes have equal width β.",
            bookReference: "NCERT Physics Chapter 9 & 10",
            formulasOrRules: [
              "1/f = (μ - 1)[(1/R1) - (1/R2)]",
              "β = (λ D) / d",
              "Diffraction central maximum width = 2λD / a",
              "μ_prism = sin((A + δm)/2) / sin(A/2)"
            ],
          },
        ],
      },
      {
        id: "ch-c12-phy-4",
        chapterNumber: 4,
        title: "Modern Physics & Semiconductor Electronics",
        priority: "VVI",
        notesSummary: "Photoelectric effect, Einstein's equation hν = Φ0 + K_max = hν0 + eV0, de Broglie wavelength λ = h/p = h/√(2mqV). Bohr's hydrogen atom model (rn ∝ n², En = -13.6/n² eV), Rydberg formula for spectral series (Lyman, Balmer, Paschen), Nuclear binding energy curve, Fission & Fusion. Semiconductors: p-n junction diode, Forward & reverse bias, Full-wave rectifier efficiency.",
        bookChapterTitle: "NCERT Class 12 Physics Chapter 11, 12, 13 & 14",
        resourceLinks: [
          { title: "Photoelectric Effect & Semiconductor Rectifiers", type: "Mindmap", description: "Stopping potential graphs, hydrogen spectra, and full wave rectifier circuit." },
        ],
        topics: [
          {
            id: "top-c12-p-4-1",
            name: "Einstein's Photoelectric Equation and p-n Junction Rectifier",
            keyConcepts: ["Einstein's equation hν = Φ + eV0", "de Broglie wavelength for electron λ = 1.227 / √V nm", "Bohr radius & energy levels", "Full Wave Rectifier with centre-tapped transformer"],
            vviPoints: ["Photoelectric effect proves particulate nature of light; wave theory fails to explain instantaneous emission and threshold frequency"],
            summaryNote: "Energy of emitted photoelectrons depends solely on radiation frequency, while photocurrent is proportional to light intensity.",
            bookReference: "NCERT Physics Chapter 11 & 14",
            formulasOrRules: [
              "hν = Φ0 + ½ m v_max² = hν0 + e V0",
              "λ = h / p = 1.227 / √V nm (for electrons)",
              "En = -13.6 / n² eV",
              "1/λ = R_H (1/n1² - 1/n2²)"
            ],
          },
        ],
      },
    ],
  },
  {
    id: "sub-c12-sci-chem",
    name: "Chemistry",
    code: "CHEM-043",
    stream: "Science",
    classLevel: "Class 12",
    color: "emerald",
    iconName: "Atom",
    chapters: [
      {
        id: "ch-c12-ch-1",
        chapterNumber: 1,
        title: "Solutions and Electrochemistry",
        priority: "VVI",
        notesSummary: "Raoult's Law for volatile solutes (P_total = P1°x1 + P2°x2), Ideal vs non-ideal solutions (Positive & negative deviations, azeotropes). Colligative properties: ΔTb = i Kb m, ΔTf = i Kf m, π = i CRT. Van't Hoff factor (i). Electrochemistry: Nernst Equation E_cell = E°_cell - (0.0591/n) log Q, Kohlrausch's Law (Λ°m = ν+ λ°+ + ν- λ°-), Faraday's Laws of electrolysis, Lead storage battery, Fuel cell (H2-O2).",
        bookChapterTitle: "NCERT Class 12 Chemistry Chapter 1 & 2",
        resourceLinks: [
          { title: "Colligative & Nernst Equation Formula Table", type: "Formula Sheet", description: "Formulas for boiling elevation, freezing depression, and cell EMF." },
        ],
        topics: [
          {
            id: "top-c12-ch-1-1",
            name: "Nernst Equation, Kohlrausch Law & Van't Hoff Factor",
            keyConcepts: ["Nernst equation for galvanic cells", "Molar conductivity Λm at infinite dilution", "Van't Hoff factor i = Normal Molar Mass / Observed Molar Mass", "Degree of dissociation α = (i - 1) / (n - 1)"],
            vviPoints: ["Calculate EMF of cell and equilibrium constant Kc using log Kc = nE°_cell / 0.0591"],
            summaryNote: "Colligative properties depend only on the number of solute particles. Van't Hoff factor adjusts formulas for association (i < 1) and dissociation (i > 1).",
            bookReference: "NCERT Chemistry Chapter 1 & 2",
            formulasOrRules: [
              "E_cell = E°_cell - (0.0591/n) log([Anode]/[Cathode])",
              "ΔG° = -n F E°_cell",
              "π = i C R T",
              "ΔTb = i Kb m, ΔTf = i Kf m"
            ],
          },
        ],
      },
      {
        id: "ch-c12-ch-2",
        chapterNumber: 2,
        title: "Chemical Kinetics & d- and f-Block Elements",
        priority: "VVI",
        notesSummary: "Rate of reaction, Rate law & Order vs Molecularity, Integrated rate equations for Zero Order (k = (R0 - R)/t) and First Order (k = (2.303/t) log(R0/R), t½ = 0.693/k). Arrhenius equation k = A e^(-Ea/RT). d-Block: Transition metals variable oxidation states, catalytic properties, colored ions (d-d transitions), magnetic properties (spin-only formula μ = √[n(n+2)] BM), Lanthanoid contraction and consequences. Potassium permanganate (KMnO4) and Potassium dichromate (K2Cr2O7) oxidizing actions.",
        bookChapterTitle: "NCERT Class 12 Chemistry Chapter 3 & 4",
        resourceLinks: [
          { title: "First Order Kinetics & Lanthanoid Contraction Sheet", type: "Mindmap", description: "Integrated rate plots, half-life formulas, and oxidation state trends." },
        ],
        topics: [
          {
            id: "top-c12-ch-2-1",
            name: "First Order Integrated Kinetics and Transition Metal Chemistry",
            keyConcepts: ["First order half-life is independent of initial concentration", "Arrhenius activation energy slope -Ea/2.303R", "Lanthanoid Contraction due to poor shielding of 4f electrons", "Spin-only magnetic moment μ = √[n(n+2)] BM"],
            vviPoints: ["Lanthanoid contraction causes almost identical atomic radii for 4d and 5d elements (e.g., Zr and Hf)"],
            summaryNote: "Transition metals exhibit high enthalpy of atomization and catalytic activity due to variable oxidation states and vacant d-orbitals.",
            bookReference: "NCERT Chemistry Chapter 3 & 4",
            formulasOrRules: [
              "k = (2.303 / t) log([R0] / [R])",
              "t½ = 0.693 / k",
              "log(k2/k1) = (Ea / 2.303R) [(T2 - T1) / (T1 T2)]",
              "μ = √[n(n + 2)] Bohr Magnetons (BM)"
            ],
          },
        ],
      },
      {
        id: "ch-c12-ch-3",
        chapterNumber: 3,
        title: "Coordination Compounds & Organic Chemistry Core",
        priority: "VVI",
        notesSummary: "Werner's Theory, IUPAC nomenclature of coordination complexes, Valence Bond Theory (inner vs outer orbital complexes), Crystal Field Theory (CFT: octahedral Δ0 and tetrahedral Δt splitting, strong field vs weak field ligands, Spectrochemical Series). Organic Named Reactions: Aldol Condensation, Cannizzaro Reaction, Reimer-Tiemann, Kolbe's Reaction, Rosenmund Reduction, Gabriel Phthalimide Synthesis, Sandmeyer Reaction. Biomolecules: Glucose structure, Peptide bond, DNA double helix.",
        bookChapterTitle: "NCERT Class 12 Chemistry Chapter 5, 6, 7, 8, 9 & 10",
        resourceLinks: [
          { title: "Organic Named Reactions Master Reference", type: "Quick CheatSheet", description: "All 25 CBSE board named reactions with mechanisms." },
          { title: "CFT Crystal Field Splitting Diagram", type: "Mindmap", description: "Octahedral t2g and eg orbital energy levels." },
        ],
        topics: [
          {
            id: "top-c12-ch-3-1",
            name: "Crystal Field Theory (CFT) and Named Organic Reactions",
            keyConcepts: ["Octahedral splitting (t2g lower, eg higher by Δ0)", "Pairing energy vs crystal field splitting parameter", "Aldol Condensation (requires α-hydrogen) vs Cannizzaro Reaction (no α-hydrogen)", "Carbylamine Test for 1° amines"],
            vviPoints: ["Distinction tests: Lucas test (1°, 2°, 3° alcohols), Iodoform test (CH3-C=O or CH3-CH(OH) group), Tollens and Fehling tests for aldehydes"],
            summaryNote: "Crystal Field Theory treats metal-ligand bonds as purely electrostatic, explaining spectral and magnetic behaviors of coordination complexes.",
            bookReference: "NCERT Chemistry Chapter 5 & 8",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c12-sci-math",
    name: "Mathematics",
    code: "MATH-041",
    stream: "Science",
    classLevel: "Class 12",
    color: "blue",
    iconName: "Calculator",
    chapters: [
      {
        id: "ch-c12-m-1",
        chapterNumber: 1,
        title: "Matrices, Determinants & Relations and Functions",
        priority: "VVI",
        notesSummary: "Types of relations (Equivalence: Reflexive, Symmetric, Transitive), Injective (One-one), Surjective (Onto), Bijective functions. Matrices: Multiplication, Transpose, Symmetric & Skew-symmetric (A = ½(A+A') + ½(A-A')). Determinants: Minors & Cofactors, Adjoint and Inverse A⁻¹ = (1/|A|) adj(A). Solving system of linear equations using Matrix Inversion method X = A⁻¹ B.",
        bookChapterTitle: "NCERT Class 12 Maths Chapter 1, 3 & 4",
        resourceLinks: [
          { title: "Matrix Inversion & Equivalence Relation Guide", type: "Formula Sheet", description: "System of linear equations matrix method steps." },
        ],
        topics: [
          {
            id: "top-c12-m-1-1",
            name: "Matrix Inversion Method and Equivalence Relations",
            keyConcepts: ["Proving equivalence relation", "Bijective function condition", "Adjoint properties: A(adj A) = |A| I", "Solving AX = B using X = A⁻¹B"],
            vviPoints: ["Guaranteed 5-mark question on solving 3x3 system of linear equations using matrix method"],
            summaryNote: "A system of linear equations is consistent with unique solution if |A| ≠ 0; inconsistent if |A| = 0 and (adj A)B ≠ 0.",
            bookReference: "NCERT Maths Chapter 3 & 4",
            formulasOrRules: ["A⁻¹ = (1 / |A|) adj(A)", "A · adj(A) = |A| · I", "|adj(A)| = |A|^(n-1)", "X = A⁻¹ · B"],
          },
        ],
      },
      {
        id: "ch-c12-m-2",
        chapterNumber: 2,
        title: "Calculus: Continuity, Differentiability & Integrals",
        priority: "VVI",
        notesSummary: "Continuity at a point, Chain rule, Logarithmic differentiation (for y = [f(x)]^g(x)), Parametric differentiation, Second order derivatives. Maxima and Minima (First & Second derivative tests, Applied word problems on box, cylinder, sphere). Integrals: Indefinite integrals, Integration by substitution, Partial fractions, Integration by parts ∫u v dx = u ∫v dx - ∫(u' ∫v dx) dx (ILATE rule). Definite integrals properties: ∫[0 to a] f(x)dx = ∫[0 to a] f(a-x)dx.",
        bookChapterTitle: "NCERT Class 12 Maths Chapter 5, 6 & 7",
        resourceLinks: [
          { title: "Definite Integral Properties & Maxima Word Problems", type: "Formula Sheet", description: "7 definite integral properties and ILATE integration by parts rule." },
        ],
        topics: [
          {
            id: "top-c12-m-2-1",
            name: "Definite Integral Properties and Maxima/Minima Word Problems",
            keyConcepts: ["King's property: ∫[0 to a] f(x)dx = ∫[0 to a] f(a-x)dx", "Integration by parts with ILATE order", "Second derivative test d²y/dx² < 0 for local maximum", "Optimization problems on volume and surface area"],
            vviPoints: ["Evaluation of ∫[0 to π/2] log(sin x) dx = - (π/2) log 2 using King's property"],
            summaryNote: "Calculus enables optimization in geometric shapes, physical systems, and mathematical modelling through differentiation and integration.",
            bookReference: "NCERT Maths Chapter 6 & 7",
            formulasOrRules: [
              "∫ u v dx = u ∫ v dx - ∫ [u' (∫ v dx)] dx",
              "∫[0 to a] f(x) dx = ∫[0 to a] f(a - x) dx",
              "∫[-a to a] f(x) dx = 2 ∫[0 to a] f(x) dx (if even), 0 (if odd)"
            ],
          },
        ],
      },
      {
        id: "ch-c12-m-3",
        chapterNumber: 3,
        title: "Vectors, 3D Geometry and Probability",
        priority: "VVI",
        notesSummary: "Dot product a·b = |a||b| cos θ, Cross product a×b = |a||b| sin θ n̂. 3D: Direction cosines and direction ratios, Vector & Cartesian equation of line r = a + λb, Shortest distance between two skew lines d = |(a2-a1)·(b1×b2)| / |b1×b2|. Probability: Conditional probability P(A|B) = P(A∩B)/P(B), Multiplication theorem, Independent events, Bayes' Theorem P(E1|A) = P(E1)P(A|E1) / Σ P(Ei)P(A|Ei).",
        bookChapterTitle: "NCERT Class 12 Maths Chapter 10, 11 & 13",
        resourceLinks: [
          { title: "Shortest Distance & Bayes' Theorem Master Sheet", type: "Formula Sheet", description: "Skew lines distance and Bayes theorem decision tree." },
        ],
        topics: [
          {
            id: "top-c12-m-3-1",
            name: "Shortest Distance Between Skew Lines and Bayes' Theorem",
            keyConcepts: ["Shortest distance formula for skew lines", "Coplanarity of two lines", "Bayes' Theorem for posterior probability", "Probability distribution of random variable"],
            vviPoints: ["Guaranteed 5-mark case study question on Bayes' Theorem in CBSE Class 12 board exam"],
            summaryNote: "Bayes' Theorem calculates the conditional probability of an underlying cause given observed event evidence.",
            bookReference: "NCERT Maths Chapter 11 & 13",
            formulasOrRules: [
              "d = |(a2 - a1) · (b1 × b2)| / |b1 × b2|",
              "P(Ei|A) = [P(Ei) · P(A|Ei)] / [Σ P(Ej) · P(A|Ej)]",
              "P(A ∩ B) = P(A) · P(B) (for independent events)"
            ],
          },
        ],
      },
    ],
  },
  {
    id: "sub-c12-sci-bio",
    name: "Biology",
    code: "BIO-044",
    stream: "Science",
    classLevel: "Class 12",
    color: "rose",
    iconName: "Dna",
    chapters: [
      {
        id: "ch-c12-b-1",
        chapterNumber: 1,
        title: "Genetics and Molecular Biology",
        priority: "VVI",
        notesSummary: "Mendelian inheritance, Incomplete dominance, Codominance (ABO blood groups), Pleiotropy, Chromosomal theory, Sex determination, Genetic disorders (Sickle cell anemia, Hemophilia, Thalassemia, Down syndrome). Molecular Basis: DNA structure (Watson-Crick model), Packaging of DNA (Nucleosome), Meselson-Stahl experiment (semiconservative replication), Transcription, Genetic code, Translation (tRNA adaptor), Lac Operon model, Human Genome Project (HGP), DNA Fingerprinting.",
        bookChapterTitle: "NCERT Class 12 Biology Chapter 4 & 5",
        resourceLinks: [
          { title: "Lac Operon & DNA Replication Fork Mindmap", type: "Mindmap", description: "Operon on/off states and leading vs lagging strand replication." },
        ],
        topics: [
          {
            id: "top-c12-b-1-1",
            name: "Molecular Basis of Inheritance & Lac Operon",
            keyConcepts: ["Nucleosome structure (histone octamer + 200 bp DNA)", "Meselson and Stahl ¹⁵N experiment", "Lac Operon regulation by repressor and lactose inducer", "Salient features of genetic code (universal, degenerate, unambiguous)"],
            vviPoints: ["Lac operon functioning in presence vs absence of inducer (Allolactose)"],
            summaryNote: "DNA replicates semiconservatively, transcribes information into mRNA, which is translated into functional proteins via the genetic code.",
            bookReference: "NCERT Biology Chapter 5",
          },
        ],
      },
      {
        id: "ch-c12-b-2",
        chapterNumber: 2,
        title: "Biotechnology & Human Reproduction",
        priority: "VVI",
        notesSummary: "Reproduction: Male and female reproductive systems, Spermatogenesis & Oogenesis, Menstrual cycle hormones (FSH, LH, Estrogen, Progesterone), Fertilization, Blastocyst implantation, Parturition. Contraception & Assisted Reproductive Technologies (IVF, ICSI, ZIFT). Biotechnology: Recombinant DNA Technology, Restriction enzymes (molecular scissors), pBR322 cloning vector, PCR (Denaturation, Annealing, Extension using Taq polymerase), Bioreactors, Bt Cotton, Gene therapy for ADA deficiency.",
        bookChapterTitle: "NCERT Class 12 Biology Chapter 2, 3, 9 & 10",
        resourceLinks: [
          { title: "PCR Steps & pBR322 Vector Diagram", type: "Quick CheatSheet", description: "Thermal cycling steps and selectable markers (ampR, tetR)." },
        ],
        topics: [
          {
            id: "top-c12-b-2-1",
            name: "Recombinant DNA, PCR and Menstrual Hormone Cycles",
            keyConcepts: ["Restriction endonuclease palindromic sequence cleavage", "pBR322 selectable markers and insertional inactivation", "PCR amplification with Taq polymerase", "LH surge causing ovulation on Day 14"],
            vviPoints: ["Insertional inactivation of β-galactosidase gene for recombinant colony screening (blue-white selection)"],
            summaryNote: "Biotechnology harnesses cellular and biomolecular processes to develop therapies, transgenic crops, and industrial enzymes.",
            bookReference: "NCERT Biology Chapter 2 & 9",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c12-sci-eng",
    name: "English Core",
    code: "ENG-301",
    stream: "Science",
    classLevel: "Class 12",
    color: "amber",
    iconName: "BookOpen",
    chapters: [
      {
        id: "ch-c12-sci-eng-1",
        chapterNumber: 1,
        title: "Flamingo & Vistas: Literature Master",
        priority: "VVI",
        notesSummary: "Flamingo Prose: The Last Lesson (Alphonse Daudet), Lost Spring (Anees Jung), Deep Water (William Douglas), The Rattrap (Selma Lagerlöf), Indigo (Louis Fischer), Poets and Pancakes, The Interview, Going Places. Flamingo Poetry: My Mother at Sixty-Six (Kamala Das), Keeping Quiet (Pablo Neruda), A Thing of Beauty (John Keats), A Roadside Stand (Robert Frost), Aunt Jennifer's Tigers (Adrienne Rich). Vistas: The Third Level (Jack Finney), The Tiger King, Journey to the End of the Earth, The Enemy (Pearl S. Buck), On the Face of It, Memories of Childhood.",
        bookChapterTitle: "NCERT Class 12 English Flamingo & Vistas",
        resourceLinks: [
          { title: "Complete Flamingo Poetic Devices & Vistas Themes", type: "Quick CheatSheet", description: "Comprehensive analysis of all 14 prescribed prose and poetry texts." },
        ],
        topics: [
          {
            id: "top-c12-se-1-1",
            name: "Core Themes, Poetic Symbolism and Value-Based Analysis",
            keyConcepts: ["Language chauvinism and loss of freedom in The Last Lesson", "Metaphor of the rattrap and human redemption through kindness", "Symbolism in Aunt Jennifer's Tigers (patriarchal oppression)", "Dr. Sadao's moral dilemma in The Enemy"],
            vviPoints: ["Value-based character analysis of Edla Willmansson and Mahatma Gandhi in Champaran"],
            summaryNote: "Literature fosters deep ethical awareness, empathy, critical interrogation of social structures, and aesthetic appreciation.",
            bookReference: "NCERT Flamingo & Vistas",
          },
        ],
      },
      {
        id: "ch-c12-sci-eng-2",
        chapterNumber: 2,
        title: "Advanced Composition: Notice, Invitations, Letters & Articles",
        priority: "Important",
        notesSummary: "Notice Writing (50 words), Formal and Informal Invitations & Replies (Card and letter formats), Letter to the Editor, Job Application with Bio-data / Resume, Article Writing, Report Writing for school magazine and newspapers.",
        bookChapterTitle: "CBSE Class 12 English Core Writing Standards",
        resourceLinks: [
          { title: "Invitations & Job Application Official Formats", type: "Formula Sheet", description: "CBSE marking scheme guidelines for all composition questions." },
        ],
        topics: [
          {
            id: "top-c12-se-2-1",
            name: "Formal Invitations, Job Applications and Article Layouts",
            keyConcepts: ["Formal card invitation printed layout rules (3rd person, no signatures)", "Job Application covering letter and structured curriculum vitae", "Article writing format with title, byline, introductory paragraph, analytical body, constructive conclusion"],
            vviPoints: ["Formal card invitations must be written in third person without salutations or date at the top"],
            summaryNote: "Mastery of advanced composition guarantees maximum marks through precise formatting, rich vocabulary, and coherent progression of thought.",
            bookReference: "CBSE Writing Guidelines",
          },
        ],
      },
    ],
  },
];

// -----------------------------------------------------------------------
// 6. CLASS 12 COMMERCE CURRICULUM
// -----------------------------------------------------------------------

export const CLASS12_COMMERCE_CURRICULUM: CurriculumSubject[] = [
  {
    id: "sub-c12-comm-acc",
    name: "Accountancy",
    code: "ACC-055",
    stream: "Commerce",
    classLevel: "Class 12",
    color: "emerald",
    iconName: "Briefcase",
    chapters: [
      {
        id: "ch-c12-acc-1",
        chapterNumber: 1,
        title: "Accounting for Partnership: Fundamentals to Dissolution",
        priority: "VVI",
        notesSummary: "Partnership deed, P&L Appropriation Account, Capital accounts (Fixed vs Fluctuating), Interest on drawings (Product & Average period method), Past adjustments, Guarantee of profit. Goodwill valuation (Average, Super profit, Capitalization). Admission of partner (Sacrificing ratio, Revaluation Account, Hidden goodwill, Capital adjustment). Retirement & Death (Gaining ratio, Deceased partner's share of profit, Executor's Account). Dissolution (Realization Account, Treatment of unrecorded assets/liabilities).",
        bookChapterTitle: "NCERT Class 12 Accountancy: Partnership Accounts",
        resourceLinks: [
          { title: "Partnership Capital Adjustments & Realization Master Sheet", type: "Formula Sheet", description: "Step-by-step procedures for admission, retirement, and dissolution." },
        ],
        topics: [
          {
            id: "top-c12-acc-1-1",
            name: "Admission, Retirement and Realization Account",
            keyConcepts: ["Sacrificing Ratio = Old Ratio - New Ratio", "Gaining Ratio = New Ratio - Old Ratio", "Revaluation profit/loss distribution in Old Ratio", "Realization Account entries on firm dissolution"],
            vviPoints: ["Guaranteed 6-mark comprehensive question on Partner Admission / Retirement with Capital Adjustments"],
            summaryNote: "Partnership reconstitution requires revaluing assets and liabilities so that incoming/outgoing partners do not receive unearned gains or unfair burdens.",
            bookReference: "NCERT Accountancy Volume 1",
            formulasOrRules: [
              "Super Profit = Average Profit - Normal Profit",
              "Normal Profit = Capital Employed × (Normal Rate of Return / 100)",
              "Goodwill = Super Profit × Number of Years' Purchase"
            ],
          },
        ],
      },
      {
        id: "ch-c12-acc-2",
        chapterNumber: 2,
        title: "Company Accounts: Share Capital & Debentures",
        priority: "VVI",
        notesSummary: "Types of share capital (Authorized, Issued, Subscribed, Paid-up), Issue of shares at par and premium, Calls in arrears & in advance, Over-subscription and Pro-rata allotment table, Forfeiture of shares (forfeited amount transferred to Share Forfeiture Account), Reissue of forfeited shares and transfer of profit to Capital Reserve. Issue of Debentures for cash, for consideration other than cash, and as collateral security. Writing off discount/loss on issue of debentures.",
        bookChapterTitle: "NCERT Class 12 Accountancy: Company Accounts",
        resourceLinks: [
          { title: "Pro-Rata Allotment Table & Forfeiture Entries Guide", type: "Mindmap", description: "Calculation of excess application money adjusted on allotment and calls." },
        ],
        topics: [
          {
            id: "top-c12-acc-2-1",
            name: "Pro-Rata Allotment, Forfeiture and Capital Reserve",
            keyConcepts: ["Pro-rata allotment category calculation", "Amount unpaid on allotment after adjusting excess application", "Forfeiture entry: Debit Share Capital with called-up amount", "Transfer to Capital Reserve on reissue of shares"],
            vviPoints: ["Capital Reserve Transfer = (Forfeited amount on reissued shares) - (Discount on reissue)"],
            summaryNote: "Pro-rata accounting ensures fair allocation of shares when public subscription exceeds issued capital, accurately tracking investor dues.",
            bookReference: "NCERT Accountancy Volume 2 Chapter 1 & 2",
          },
        ],
      },
      {
        id: "ch-c12-acc-3",
        chapterNumber: 3,
        title: "Financial Statement Analysis & Cash Flow Statement",
        priority: "VVI",
        notesSummary: "Financial statements of a company (Schedule III of Companies Act 2013: Balance Sheet & P&L format), Tools of analysis (Comparative, Common size statements), Accounting Ratios: Liquidity (Current, Quick), Solvency (Debt-Equity, Total Assets to Debt, Proprietary, Interest Coverage), Activity/Turnover (Inventory, Debtors, Creditors, Working Capital), Profitability (Gross Profit, Operating, Net Profit, Return on Investment). Cash Flow Statement (AS-3 Revised): Operating, Investing, and Financing activities.",
        bookChapterTitle: "NCERT Class 12 Analysis of Financial Statements",
        resourceLinks: [
          { title: "Accounting Ratios & Cash Flow Statement (AS-3) Master Table", type: "Formula Sheet", description: "All 16 accounting ratios and full direct/indirect cash flow classification." },
        ],
        topics: [
          {
            id: "top-c12-acc-3-1",
            name: "Accounting Ratios and Cash Flow from Operating Activities",
            keyConcepts: ["Current Ratio = Current Assets / Current Liabilities (Ideal 2:1)", "Debt-Equity Ratio = Long Term Debt / Shareholders' Funds (Ideal 2:1)", "Cash Flow Operating Activities: Net Profit before tax adjustments for non-cash/non-operating items and working capital changes"],
            vviPoints: ["Guaranteed 6-mark question on preparing Cash Flow Statement with asset purchase/sale and provision for tax adjustments"],
            summaryNote: "Cash Flow Statement shows inflows and outflows of cash and cash equivalents, evaluating liquidity, financial flexibility, and operating health.",
            bookReference: "NCERT Analysis of Financial Statements Chapter 4 & 5",
            formulasOrRules: [
              "Current Ratio = Current Assets / Current Liabilities",
              "Debt-Equity = Total Debt / Net Worth",
              "Inventory Turnover = Cost of Revenue from Operations / Average Inventory",
              "ROI = (Net Profit before Interest and Tax / Capital Employed) × 100"
            ],
          },
        ],
      },
    ],
  },
  {
    id: "sub-c12-comm-bst",
    name: "Business Studies",
    code: "BST-054",
    stream: "Commerce",
    classLevel: "Class 12",
    color: "cyan",
    iconName: "Building2",
    chapters: [
      {
        id: "ch-c12-bst-1",
        chapterNumber: 1,
        title: "Principles & Functions of Management",
        priority: "VVI",
        notesSummary: "Nature of Management (Science, Art, Profession), Levels, Coordination. Principles: Fayol's 14 Principles (Division of work, Unity of Command, Unity of Direction, Scalar Chain - Gang Plank, Espirit de Corps) vs Taylor's Scientific Management (Techniques: Functional Foremanship, Time/Motion study, Differential Piece Wage). Business Environment: Dimensions (Economic, Social, Tech, Political, Legal), Demonetization. Functions: Planning (Process, Types of plans), Organising (Functional vs Divisional structure, Delegation, Decentralisation), Staffing (Recruitment, Selection, Training), Directing (Motivation - Maslow hierarchy, Leadership styles, Communication barriers), Controlling (Process, Relationship with planning).",
        bookChapterTitle: "NCERT Class 12 BST: Principles and Functions of Management",
        resourceLinks: [
          { title: "Fayol vs Taylor Principles & Management Functions Mindmap", type: "Mindmap", description: "Detailed comparative matrix and 5 managerial functions." },
        ],
        topics: [
          {
            id: "top-c12-bst-1-1",
            name: "Fayol Principles, Delegation & Organisational Structures",
            keyConcepts: ["Unity of Command vs Unity of Direction", "Scalar Chain & Gang Plank emergency bypass", "Functional structure (based on functions) vs Divisional structure (based on product lines)", "Three elements of delegation: Authority, Responsibility, Accountability"],
            vviPoints: ["Accountability is absolute and cannot be delegated to subordinates"],
            summaryNote: "Effective management integrates planning, organising, staffing, directing, and controlling to achieve organizational goals efficiently and effectively.",
            bookReference: "NCERT BST Volume 1",
          },
        ],
      },
      {
        id: "ch-c12-bst-2",
        chapterNumber: 2,
        title: "Financial Management, Marketing & Consumer Protection",
        priority: "VVI",
        notesSummary: "Financial Management: Financial Decisions (Investment/Capital Budgeting, Financing, Dividend), Factors affecting Capital Structure (Trading on Equity, Cost of Debt, ICR, DSCR), Fixed vs Working Capital. Financial Markets: Money Market (Treasury Bills, Commercial Paper, Call Money, Certificate of Deposit) vs Capital Market (Primary vs Secondary), NSE, BSE, SEBI (Regulatory, Developmental, Protective functions). Marketing: Marketing Mix 4Ps (Product, Price, Place, Promotion), Advertising vs Personal Selling. Consumer Protection Act 2019: Consumer rights, Three-tier redressal machinery (District Commission, State Commission, National Commission).",
        bookChapterTitle: "NCERT Class 12 BST: Business Finance and Marketing",
        resourceLinks: [
          { title: "Trading on Equity & 4Ps Marketing Mix Guide", type: "Quick CheatSheet", description: "Financial leverage calculations, money market instruments, and SEBI functions." },
        ],
        topics: [
          {
            id: "top-c12-bst-2-1",
            name: "Trading on Equity, SEBI Functions & Consumer Rights",
            keyConcepts: ["Trading on Equity to maximize EPS when ROI > Cost of Debt", "Money market instruments (Treasury Bills issued by RBI)", "SEBI Regulatory vs Protective functions (checking price rigging/insider trading)", "Consumer Rights: Right to Safety, Information, Choice, Heard, Redressal, Consumer Education"],
            vviPoints: ["Trading on equity benefits equity shareholders only when Return on Investment (ROI) exceeds interest rate on debt"],
            summaryNote: "Financial management aims to maximize shareholders' wealth while marketing creates, communicates, and delivers superior customer value.",
            bookReference: "NCERT BST Volume 2",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c12-comm-eco",
    name: "Economics",
    code: "ECO-030",
    stream: "Commerce",
    classLevel: "Class 12",
    color: "purple",
    iconName: "TrendingUp",
    chapters: [
      {
        id: "ch-c12-eco-1",
        chapterNumber: 1,
        title: "Macroeconomics: National Income, Money & Banking",
        priority: "VVI",
        notesSummary: "Circular flow of income (Two-sector model), Aggregates: GDP, GNP, NDP, NNP at Market Price and Factor Cost, Nominal vs Real GDP, GDP Deflator. Three methods of measuring National Income: Value Added Method, Income Method, Expenditure Method. Money & Banking: Money supply (M1 = Currency with public + Demand deposits + Other deposits with RBI), Credit Creation by commercial banks (Money Multiplier = 1/LRR), Central Bank (RBI) monetary policy tools (Repo Rate, Reverse Repo Rate, CRR, SLR, Open Market Operations, Margin requirements).",
        bookChapterTitle: "NCERT Class 12 Introductory Macroeconomics Chapter 1, 2 & 3",
        resourceLinks: [
          { title: "National Income Aggregates & Credit Creation Sheet", type: "Formula Sheet", description: "Formulas for GDP, NNP at FC, and RBI monetary policy transmission." },
        ],
        topics: [
          {
            id: "top-c12-eco-1-1",
            name: "National Income Measurement and Credit Creation",
            keyConcepts: ["National Income = NNP at Factor Cost", "Net Indirect Taxes (NIT) = Indirect Taxes - Subsidies", "Net Factor Income from Abroad (NFIA)", "Credit Multiplier k = 1 / LRR"],
            vviPoints: ["Precautions in calculating National Income: exclude transfer payments, second-hand goods, and illegal income"],
            summaryNote: "National Income measures the net value of goods and services produced by normal residents of a country during an accounting year.",
            bookReference: "NCERT Macroeconomics Chapter 2 & 3",
            formulasOrRules: [
              "NNP_FC (National Income) = GDP_MP - Depreciation + NFIA - NIT",
              "Money Multiplier = 1 / LRR",
              "Total Credit Created = Initial Deposits × (1 / LRR)",
              "Real GDP = (Nominal GDP / Price Index) × 100"
            ],
          },
        ],
      },
      {
        id: "ch-c12-eco-2",
        chapterNumber: 2,
        title: "Income Determination, Govt Budget & Balance of Payments",
        priority: "VVI",
        notesSummary: "Aggregate Demand (AD = C + I) and Aggregate Supply (AS = C + S). Propensity to Consume (APC = C/Y, MPC = ΔC/ΔY) and Save (APS = S/Y, MPS = ΔS/ΔY). MPC + MPS = 1. Investment Multiplier k = 1/(1-MPC) = 1/MPS. Deficient Demand (Deflationary gap) & Excess Demand (Inflationary gap) and remedies. Government Budget: Objectives, Revenue & Capital receipts, Revenue & Capital expenditure, Measures of Deficit (Fiscal, Revenue, Primary). Balance of Payments: Current Account vs Capital Account, Autonomous vs Accommodating items, Foreign Exchange Rate determination (Fixed, Flexible, Managed Floating).",
        bookChapterTitle: "NCERT Class 12 Introductory Macroeconomics Chapter 4, 5 & 6",
        resourceLinks: [
          { title: "Investment Multiplier & BOP Structure Diagram", type: "Mindmap", description: "Derivation of multiplier k and Current vs Capital Account components." },
        ],
        topics: [
          {
            id: "top-c12-eco-2-1",
            name: "Investment Multiplier, Fiscal Deficit and BOP Equilibrium",
            keyConcepts: ["Multiplier working mechanism with numerical schedule", "Deflationary Gap (Equilibrium output < Full employment output)", "Fiscal Deficit = Total Expenditure - Total Receipts excluding borrowings = Borrowings", "Primary Deficit = Fiscal Deficit - Interest Payments"],
            vviPoints: ["Autonomous items take place for economic profit motive; accommodating items are compensating capital transfers to restore BOP balance"],
            summaryNote: "Macroeconomic policy coordinates monetary and fiscal levers to achieve full employment, price stability, and external balance.",
            bookReference: "NCERT Macroeconomics Chapter 4, 5 & 6",
            formulasOrRules: [
              "k = ΔY / ΔI = 1 / (1 - MPC) = 1 / MPS",
              "Fiscal Deficit = Total Budget Expenditure - (Revenue Receipts + Non-debt Capital Receipts)",
              "Primary Deficit = Fiscal Deficit - Interest Payments"
            ],
          },
        ],
      },
    ],
  },
  {
    id: "sub-c12-comm-eng",
    name: "English Core",
    code: "ENG-301",
    stream: "Commerce",
    classLevel: "Class 12",
    color: "blue",
    iconName: "BookOpen",
    chapters: [
      {
        id: "ch-c12-comm-eng-1",
        chapterNumber: 1,
        title: "Flamingo & Vistas Core Literature",
        priority: "VVI",
        notesSummary: "The Last Lesson, Lost Spring, Deep Water, The Rattrap, Indigo, Poets and Pancakes. Poems: My Mother at Sixty-Six, Keeping Quiet, A Thing of Beauty, A Roadside Stand, Aunt Jennifer's Tigers. Vistas: The Third Level, The Tiger King, Journey to the End of the Earth, The Enemy, On the Face of It, Memories of Childhood.",
        bookChapterTitle: "NCERT Class 12 English Flamingo & Vistas",
        resourceLinks: [
          { title: "Key Character Sketches & Moral Themes", type: "Quick CheatSheet", description: "Comprehensive notes for board examination reference." },
        ],
        topics: [
          {
            id: "top-c12-ce-1-1",
            name: "Literary Analysis, Thematic Resonance and Character Motivation",
            keyConcepts: ["M. Hamel's final French lesson and linguistic identity", "Douglas conquering fear of water with mental grit", "Quiet introspection in Pablo Neruda's poem"],
            vviPoints: ["Critical analysis questions comparing character choices and socio-economic struggles"],
            summaryNote: "Comprehensive appreciation of prose and poetry for board examination and competitive language tests.",
            bookReference: "NCERT Flamingo & Vistas",
          },
        ],
      },
      {
        id: "ch-c12-comm-eng-2",
        chapterNumber: 2,
        title: "Advanced Composition: Notices, Invitations, Reports & Articles",
        priority: "Important",
        notesSummary: "Notice Writing (50 words), Formal and Informal Invitations & Replies, Letter to Editor, Job Application with Resume, Article Writing, Report Writing for school magazine and newspapers.",
        bookChapterTitle: "CBSE Class 12 English Core Writing Standards",
        resourceLinks: [
          { title: "Standard Writing Layouts & Marking Scheme", type: "Formula Sheet", description: "CBSE guidelines for all advanced composition questions." },
        ],
        topics: [
          {
            id: "top-c12-ce-2-1",
            name: "Formal Invitations, Job Applications and Article Layouts",
            keyConcepts: ["Card vs Letter format for invitations", "Job Application layout with cover letter and resume", "Article writing format with heading and byline"],
            vviPoints: ["Adherence to prescribed word counts and standard layouts"],
            summaryNote: "Clear written communication demonstrates professional polish, clarity, and precision.",
            bookReference: "CBSE Writing Guidelines",
          },
        ],
      },
    ],
  },
];

// -----------------------------------------------------------------------
// 7. CLASS 12 ARTS / HUMANITIES CURRICULUM
// -----------------------------------------------------------------------

export const CLASS12_ARTS_CURRICULUM: CurriculumSubject[] = [
  {
    id: "sub-c12-arts-hist",
    name: "History",
    code: "HIST-027",
    stream: "Arts / Humanities",
    classLevel: "Class 12",
    color: "amber",
    iconName: "Landmark",
    chapters: [
      {
        id: "ch-c12-hist-1",
        chapterNumber: 1,
        title: "Themes in Indian History I: Ancient India",
        priority: "VVI",
        notesSummary: "Bricks, Beads and Bones: Harappan Civilisation (Urban planning, Citadel, Great Bath, Craft production at Chanhudaro, Trade relations with Oman/Mesopotamia, Seals and script, Theories of decline). Kings, Farmers and Towns: Early States and Economies (600 BCE - 600 CE: 16 Mahajanapadas, Mauryan Empire, Ashoka's Inscriptions, James Prinsep decipherment of Brahmi/Kharosthi, Land grants). Kinship, Caste and Class: Early Societies (Mahabharata critical edition by V.S. Sukthankar, Varna system, Patriliny, Gotra rules). Thinkers, Beliefs and Buildings: Cultural Developments (Jainism principles, Buddhism: Four Noble Truths, Eightfold Path, Stupas: Sanchi Stupa preservation by Begums of Bhopal).",
        bookChapterTitle: "NCERT Class 12 Themes in Indian History Part I",
        resourceLinks: [
          { title: "Ancient India Timeline & Harappan Sites Map", type: "Mindmap", description: "Chronology of early states, Ashokan edicts, and Sanchi architecture." },
        ],
        topics: [
          {
            id: "top-c12-h-1-1",
            name: "Harappan Urbanism, Mauryan Inscriptions and Sanchi Stupa",
            keyConcepts: ["Harappan drainage system & Great Bath", "Ashoka's Dhamma principles on rock edicts", "Critical edition of Mahabharata compilation", "Structure of Stupa: Anda, Harmika, Yashti, Chhatri"],
            vviPoints: ["Role of Shahjehan Begum and Sultan Jehan Begum in preserving the Sanchi Stupa complex"],
            summaryNote: "Ancient Indian history reveals sophisticated urban planning, script decipherment, philosophical revolts against orthodoxy, and monumental religious architecture.",
            bookReference: "NCERT Themes in Indian History Part I",
          },
        ],
      },
      {
        id: "ch-c12-hist-2",
        chapterNumber: 2,
        title: "Themes in Indian History II: Medieval India & Vijayanagara",
        priority: "VVI",
        notesSummary: "Through the Eyes of Travellers (Al-Biruni's Kitab-ul-Hind on caste, Ibn Battuta's Rihla on Indian postal system and coconut/paan, Francois Bernier on Crown ownership of land). Bhakti-Sufi Traditions (Alvars & Nayanars, Virashaiva movement of Basavanna, Saguna vs Nirguna Bhakti: Kabir, Mirabai, Guru Nanak, Sufi Khanqahs & Dargah of Ajmer Sharif). An Imperial Capital: Vijayanagara (Hampi discovery by Colin Mackenzie, Sangama, Saluva, Tuluva dynasties - Krishnadeva Raya, Mahanavami Dibba, Lotus Mahal, Hazara Rama Temple, Water management via Kamalapuram tank). Peasants, Zamindars and State (Mughal agrarian society, Ain-i-Akbari by Abu'l Fazl).",
        bookChapterTitle: "NCERT Class 12 Themes in Indian History Part II",
        resourceLinks: [
          { title: "Medieval Travellers & Vijayanagara Architecture Sheet", type: "Quick CheatSheet", description: "Ibn Battuta, Bernier, Hampi sacred/royal centres, and Bhakti poets." },
        ],
        topics: [
          {
            id: "top-c12-h-2-1",
            name: "Travellers' Accounts, Bhakti-Sufi Movements and Vijayanagara",
            keyConcepts: ["Bernier's flawed theory of private property in India", "Nirguna Bhakti of Kabir and Guru Nanak", "Vijayanagara fortified architecture and Mahanavami Dibba platform", "Ain-i-Akbari statistical survey"],
            vviPoints: ["Mahanavami Dibba rituals and celebration of royal authority in Vijayanagara"],
            summaryNote: "Medieval India synthesized diverse devotional traditions, flourishing imperial architectural styles, and complex revenue administrations.",
            bookReference: "NCERT Themes in Indian History Part II",
          },
        ],
      },
      {
        id: "ch-c12-hist-3",
        chapterNumber: 3,
        title: "Themes in Indian History III: Modern India & Constitution",
        priority: "VVI",
        notesSummary: "Colonialism and the Countryside (Permanent Settlement of Bengal 1793, Fifth Report, Santhal Rebellion 1855-56, Deccan Riots 1875). Rebels and the Raj (1857 Revolt: Causes, Sepoy mutiny at Meerut, Leaders: Nana Sahib, Rani Lakshmibai, Kunwar Singh, British repression). Mahatma Gandhi and Nationalist Movement (Champaran, Kheda, Ahmedabad, Non-Cooperation 1920-22, Salt Satyagraha 1930, Quit India 1942). Framing the Constitution (Constituent Assembly debates, Language debate, Federalism, B.R. Ambedkar & Jawaharlal Nehru vision).",
        bookChapterTitle: "NCERT Class 12 Themes in Indian History Part III",
        resourceLinks: [
          { title: "1857 Revolt & Nationalist Movement Timeline", type: "Mindmap", description: "Key phases of freedom struggle from Satyagraha to Constitution framing." },
        ],
        topics: [
          {
            id: "top-c12-h-3-1",
            name: "1857 Revolt, Gandhian Satyagrahas and Constitution Framing",
            keyConcepts: ["Permanent Settlement sunset law", "1857 rumors of greased cartridges and rebel proclamations", "Dandi Salt March mass mobilization", "Constituent Assembly debates on Fundamental Rights and language"],
            vviPoints: ["Why salt was chosen by Gandhi as a symbol of universal protest against colonial rule"],
            summaryNote: "Modern Indian history traces the anti-colonial mass struggle leading to independence and the democratic framing of the Indian Constitution.",
            bookReference: "NCERT Themes in Indian History Part III",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c12-arts-pol",
    name: "Political Science",
    code: "POL-028",
    stream: "Arts / Humanities",
    classLevel: "Class 12",
    color: "purple",
    iconName: "Scale",
    chapters: [
      {
        id: "ch-c12-pol-1",
        chapterNumber: 1,
        title: "Contemporary World Politics",
        priority: "VVI",
        notesSummary: "The End of Bipolarity (Soviet Union collapse 1991, Mikhail Gorbachev's Glasnost & Perestroika, Fall of Berlin Wall, Shock Therapy consequences, India-Russia relations). Contemporary Centres of Power (European Union, ASEAN, Rise of China, India's relations with Japan and South Korea). Contemporary South Asia (Democracy in Pakistan & Bangladesh, Sri Lanka ethnic conflict, Nepal transition to republic, SAARC). International Organisations (United Nations & Security Council reform, WHO, WTO, IMF, World Bank). Security in Contemporary World (Traditional vs Non-traditional security, Terrorism, Global health). Environment & Global Commons (Kyoto Protocol, Paris Agreement).",
        bookChapterTitle: "NCERT Class 12 Contemporary World Politics",
        resourceLinks: [
          { title: "Cold War Disintegration & World Power Blocs", type: "Mindmap", description: "Soviet collapse, EU integration, ASEAN, and UN Security Council." },
        ],
        topics: [
          {
            id: "top-c12-pol-1-1",
            name: "End of Bipolarity, Centres of Power and UN Restructuring",
            keyConcepts: ["Shock therapy economic collapse in post-Soviet states", "ASEAN Way and economic community", "Arguments for adding permanent members to UN Security Council", "Traditional (military) vs Non-traditional (human/environmental) security"],
            vviPoints: ["Criteria proposed for a new permanent member of the UN Security Council"],
            summaryNote: "Post-Cold War international relations shifted from a bipolar rivalry into a multipolar architecture with evolving global governance institutions.",
            bookReference: "NCERT Contemporary World Politics",
          },
        ],
      },
      {
        id: "ch-c12-pol-2",
        chapterNumber: 2,
        title: "Politics in India Since Independence",
        priority: "VVI",
        notesSummary: "Challenges of Nation Building (Partition consequences, Integration of Princely States - Kashmir, Hyderabad Operation Polo, Junagadh, Reorganisation of States - SRC 1953). Era of One-Party Dominance (Congress dominance in first three general elections, Coalition nature of Congress). Politics of Planned Development (Planning Commission, First vs Second Five Year Plan - Agriculture vs Heavy Industry, Green Revolution). India's External Relations (Non-Aligned Movement, Sino-Indian War 1962, Indo-Pak Wars 1965 & 1971, Nuclear Policy). Crisis of Democratic Order (National Emergency 1975-77, Allahabad HC verdict, JP Movement, 44th Constitutional Amendment). Recent Developments (Coalition politics, Mandal Commission, Economic reforms, Rise of BJP).",
        bookChapterTitle: "NCERT Class 12 Politics in India Since Independence",
        resourceLinks: [
          { title: "Nation Building & Emergency 1975 Master Summary", type: "Quick CheatSheet", description: "Princely states accession, 1975 emergency timeline, and coalition era." },
        ],
        topics: [
          {
            id: "top-c12-pol-2-1",
            name: "Integration of Princely States, 1975 Emergency & Coalition Politics",
            keyConcepts: ["Sardar Patel's diplomatic integration of 565 princely states", "Instrument of Accession", "1975 Emergency declared under Article 352 (Internal Disturbance)", "Mandal Commission reservation for OBCs and coalition era"],
            vviPoints: ["Consequences and lessons of the 1975 National Emergency for Indian democracy"],
            summaryNote: "Indian democracy proved remarkably resilient in accommodating linguistic identities, managing electoral alternation, and sustaining pluralism.",
            bookReference: "NCERT Politics in India Since Independence",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c12-arts-geo",
    name: "Geography",
    code: "GEO-029",
    stream: "Arts / Humanities",
    classLevel: "Class 12",
    color: "emerald",
    iconName: "Globe",
    chapters: [
      {
        id: "ch-c12-geo-1",
        chapterNumber: 1,
        title: "Fundamentals of Human Geography",
        priority: "VVI",
        notesSummary: "Nature and Scope of Human Geography (Environmental Determinism, Possibilism, Neo-Determinism / Stop and Go by Griffith Taylor). World Population: Distribution, Density, Growth, Demographic Transition Theory (Stage 1 high birth/death, Stage 2 population explosion, Stage 3 low birth/death). Human Development (Mahbub ul Haq and Amartya Sen capability approach, HDI four pillars: Equity, Sustainability, Productivity, Empowerment). Primary Activities (Hunting, Pastoralism, Agriculture: Primitive subsistence, Intensive subsistence, Plantation, Dairy farming). Secondary, Tertiary and Quaternary Activities. Transport, Communication & International Trade (Panama & Suez Canals, Trans-Siberian railway).",
        bookChapterTitle: "NCERT Class 12 Fundamentals of Human Geography",
        resourceLinks: [
          { title: "Demographic Transition & Trade Routes Map", type: "Mindmap", description: "Stages of DTT, plantation crops distribution, and major shipping canals." },
        ],
        topics: [
          {
            id: "top-c12-geo-1-1",
            name: "Demographic Transition, Human Development and Global Trade Routes",
            keyConcepts: ["Griffith Taylor's Neo-Determinism", "Three stages of Demographic Transition Theory", "Four pillars of Human Development", "Suez Canal (links Mediterranean and Red Sea) vs Panama Canal (links Atlantic and Pacific)"],
            vviPoints: ["Differences between Environmental Determinism (nature rules man) and Possibilism (man modifies nature)"],
            summaryNote: "Human geography studies the spatial relationships between human societies and the physical environment across population, economic, and trade systems.",
            bookReference: "NCERT Fundamentals of Human Geography",
          },
        ],
      },
      {
        id: "ch-c12-geo-2",
        chapterNumber: 2,
        title: "India: People and Economy",
        priority: "Important",
        notesSummary: "Population: Distribution, Density, Growth and Composition (Linguistic, Religious, Occupational composition). Migration: Types (Internal, International), Causes (Push vs Pull factors), Consequences. Human Settlements: Rural (Clustered, Semi-clustered, Hamleted, Dispersed) vs Urban settlements (Functional classification: Administrative, Industrial, Commercial, Mining, Garrison towns). Land and Water Resources: Land-use changes, Watershed management (Haryali, Neeru-Meeru), Rainwater harvesting. Mineral and Energy Resources: Metallic vs Non-metallic, Conventional vs Non-conventional (Solar, Wind, Bio-energy). Planning and Sustainable Development: Target area planning (ITDP, Drought prone areas).",
        bookChapterTitle: "NCERT Class 12 India: People and Economy",
        resourceLinks: [
          { title: "Indian Mineral Belts & Watershed Management Sheet", type: "Quick CheatSheet", description: "Iron ore, Bauxite, Coal belts, and Rainwater harvesting techniques." },
        ],
        topics: [
          {
            id: "top-c12-geo-2-1",
            name: "Migration Patterns, Water Resources and Sustainable Development",
            keyConcepts: ["Push factors (unemployment, poverty) vs Pull factors (jobs, better wages)", "National Water Policy priorities", "Watershed management in rainfed agriculture", "Target area planning in tribal/backward regions"],
            vviPoints: ["Case study of Indira Gandhi Canal (Nahar) Project in Rajasthan and ecological sustainability"],
            summaryNote: "Sustainable development in India requires balanced regional planning, water conservation, and renewable energy adoption.",
            bookReference: "NCERT India: People and Economy",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c12-arts-soc",
    name: "Sociology",
    code: "SOC-039",
    stream: "Arts / Humanities",
    classLevel: "Class 12",
    color: "cyan",
    iconName: "Users",
    chapters: [
      {
        id: "ch-c12-soc-1",
        chapterNumber: 1,
        title: "Indian Society: Structure and Social Institutions",
        priority: "VVI",
        notesSummary: "Demographic Structure: Malthusian theory, Demographic dividend, Age structure of India, Sex ratio decline. Social Institutions: Caste system (Varna vs Jati, Features of caste, Sanskritisation, Dominant caste concept of M.N. Srinivas), Tribal Communities (Isolation vs Integration debate, Permanent vs Acquired traits), Family and Kinship (Nuclear vs Joint family). Social Inequality and Exclusion: Caste discrimination (Untouchability - Article 17, Dalit movements), Tribal struggles, Gender inequality, Differently abled persons rights. Cultural Diversity: Nation-State, Minorities protection, Communalism, Regionalism, Secularism.",
        bookChapterTitle: "NCERT Class 12 Indian Society",
        resourceLinks: [
          { title: "Caste System & Social Exclusion Master Summary", type: "Mindmap", description: "M.N. Srinivas concepts, demographic dividend, and minority rights." },
        ],
        topics: [
          {
            id: "top-c12-soc-1-1",
            name: "Demographic Dividend, Caste Dynamics and Cultural Pluralism",
            keyConcepts: ["India's demographic dividend in working age group (15-64 years)", "Sanskritisation and Dominant Caste (M.N. Srinivas)", "Social exclusion as structural and institutional", "Secularism in Indian context (Sarva Dharma Sambhava)"],
            vviPoints: ["Distinction between Western secularism (strict wall of separation) and Indian secularism (equal respect for all religions)"],
            summaryNote: "Sociology examines social stratification, institutional changes, and state interventions aimed at redressing historic structural exclusions.",
            bookReference: "NCERT Indian Society",
          },
        ],
      },
      {
        id: "ch-c12-soc-2",
        chapterNumber: 2,
        title: "Social Change and Development in India",
        priority: "VVI",
        notesSummary: "Structural and Cultural Change: Colonial impact, Industrialisation, Urbanisation, Modernisation, Westernisation, Secularisation. Rural and Agrarian Change: Land reforms (Zamindari abolition, Tenancy regulation, Land ceiling), Green Revolution social consequences (Regional disparities, Commercialisation of agriculture, Farmer suicides). Industrial Society: Taylorism in modern factories, Outsourcing and home-based work, Strikes and trade unions. Social Movements: Peasant movements (Telangana, Tebhaga), Workers' movements, Environmental movements (Chipko, Narmada Bachao Andolan), Dalit and Women's movements.",
        bookChapterTitle: "NCERT Class 12 Social Change and Development in India",
        resourceLinks: [
          { title: "Agrarian Transformation & Social Movements Sheet", type: "Quick CheatSheet", description: "Green Revolution social impact and environmental/Dalit movements." },
        ],
        topics: [
          {
            id: "top-c12-soc-2-1",
            name: "Green Revolution Social Impact and Contemporary Movements",
            keyConcepts: ["Differentiated impact of Green Revolution benefiting rich peasants", "Feminisation of agricultural labor", "Old social movements (class-based) vs New social movements (identity, ecology)", "Chipko Movement ecological and livelihood focus"],
            vviPoints: ["Sociological consequences of contract farming and displacement due to large dam projects"],
            summaryNote: "Social movements in India mobilize marginalized communities to contest inequalities, protect ecologies, and claim constitutional entitlements.",
            bookReference: "NCERT Social Change and Development in India",
          },
        ],
      },
    ],
  },
  {
    id: "sub-c12-arts-eng",
    name: "English Core",
    code: "ENG-301",
    stream: "Arts / Humanities",
    classLevel: "Class 12",
    color: "blue",
    iconName: "BookOpen",
    chapters: [
      {
        id: "ch-c12-arts-eng-1",
        chapterNumber: 1,
        title: "Flamingo & Vistas Core Literature",
        priority: "VVI",
        notesSummary: "Flamingo Prose: The Last Lesson (Alphonse Daudet), Lost Spring (Anees Jung), Deep Water (William Douglas), The Rattrap (Selma Lagerlöf), Indigo (Louis Fischer), Poets and Pancakes. Flamingo Poetry: My Mother at Sixty-Six (Kamala Das), Keeping Quiet (Pablo Neruda), A Thing of Beauty (John Keats), A Roadside Stand (Robert Frost), Aunt Jennifer's Tigers (Adrienne Rich). Vistas: The Third Level, The Tiger King, Journey to the End of the Earth, The Enemy, On the Face of It, Memories of Childhood.",
        bookChapterTitle: "NCERT Class 12 English Flamingo & Vistas",
        resourceLinks: [
          { title: "Literature Summaries & Poetic Themes", type: "Quick CheatSheet", description: "Comprehensive study notes on prescribed prose and poetry." },
        ],
        topics: [
          {
            id: "top-c12-ae-1-1",
            name: "Literary Analysis, Critical Commentary and Poetic Themes",
            keyConcepts: ["Linguistic chauvinism in The Last Lesson", "Mukesh and Saheb's child labor plight in Lost Spring", "Symbolism of tiger in Aunt Jennifer's poem"],
            vviPoints: ["Value-based character analysis of Edla Willmansson and Dr. Sadao"],
            summaryNote: "Literary study deepens critical analysis, empathy, and artistic awareness.",
            bookReference: "NCERT Flamingo & Vistas",
          },
        ],
      },
      {
        id: "ch-c12-arts-eng-2",
        chapterNumber: 2,
        title: "Advanced Composition: Notices, Invitations, Articles & Reports",
        priority: "Important",
        notesSummary: "Notice Writing (50 words), Formal and Informal Invitations & Replies, Letter to Editor, Job Application with Resume, Article Writing, Report Writing for school magazine and newspapers.",
        bookChapterTitle: "CBSE Class 12 English Core Writing Standards",
        resourceLinks: [
          { title: "Advanced Composition Layouts & Rubrics", type: "Formula Sheet", description: "Official format rules and marking breakdown." },
        ],
        topics: [
          {
            id: "top-c12-ae-2-1",
            name: "Formal Invitations, Job Applications and Article Layouts",
            keyConcepts: ["Formal card vs letter invitations", "Cover letter with bio-data layout", "Article writing format with title and byline"],
            vviPoints: ["Strict adherence to prescribed word limits"],
            summaryNote: "Advanced composition requires clarity, structure, and formal precision.",
            bookReference: "CBSE Writing Guidelines",
          },
        ],
      },
    ],
  },
];

// =======================================================================
// MASTER CURRICULUM LOOKUP FUNCTIONS
// =======================================================================

export function getCurriculumSubjects(
  classLevel: string = "Class 10",
  stream: StreamType = "General"
): CurriculumSubject[] {
  if (classLevel === "Class 10" || stream === "General") {
    return CLASS10_CURRICULUM;
  }

  if (classLevel === "Class 11") {
    if (stream === "Science") return CLASS11_SCIENCE_CURRICULUM;
    if (stream === "Commerce") return CLASS11_COMMERCE_CURRICULUM;
    if (stream === "Arts" || stream === "Arts / Humanities") return CLASS11_ARTS_CURRICULUM;
    return CLASS11_SCIENCE_CURRICULUM;
  }

  // Class 12
  if (stream === "Science") return CLASS12_SCIENCE_CURRICULUM;
  if (stream === "Commerce") return CLASS12_COMMERCE_CURRICULUM;
  if (stream === "Arts" || stream === "Arts / Humanities") return CLASS12_ARTS_CURRICULUM;
  return CLASS12_SCIENCE_CURRICULUM;
}

export function getAllCurriculumSubjects(): CurriculumSubject[] {
  return [
    ...CLASS10_CURRICULUM,
    ...CLASS11_SCIENCE_CURRICULUM,
    ...CLASS11_COMMERCE_CURRICULUM,
    ...CLASS11_ARTS_CURRICULUM,
    ...CLASS12_SCIENCE_CURRICULUM,
    ...CLASS12_COMMERCE_CURRICULUM,
    ...CLASS12_ARTS_CURRICULUM,
  ];
}

export function findCurriculumSubjectById(id: string): CurriculumSubject | undefined {
  return getAllCurriculumSubjects().find((s) => s.id === id);
}

export function findCurriculumChapterById(chapterId: string): CurriculumChapter | undefined {
  for (const sub of getAllCurriculumSubjects()) {
    const found = sub.chapters.find((c) => c.id === chapterId);
    if (found) return found;
  }
  return undefined;
}

export function findCurriculumTopicById(topicId: string): { topic: CurriculumTopic; chapter: CurriculumChapter; subject: CurriculumSubject } | undefined {
  for (const sub of getAllCurriculumSubjects()) {
    for (const chap of sub.chapters) {
      const found = chap.topics.find((t) => t.id === topicId);
      if (found) return { topic: found, chapter: chap, subject: sub };
    }
  }
  return undefined;
}

export function searchCurriculum(
  query: string,
  classLevel?: string,
  stream?: StreamType
): { subject: CurriculumSubject; chapter: CurriculumChapter; topic?: CurriculumTopic }[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const subjects = classLevel || stream ? getCurriculumSubjects(classLevel, stream) : getAllCurriculumSubjects();
  const results: { subject: CurriculumSubject; chapter: CurriculumChapter; topic?: CurriculumTopic }[] = [];

  for (const sub of subjects) {
    for (const chap of sub.chapters) {
      if (chap.title.toLowerCase().includes(q)) {
        results.push({ subject: sub, chapter: chap });
      }
      for (const top of chap.topics) {
        if (
          top.name.toLowerCase().includes(q) ||
          top.keyConcepts.some((k) => k.toLowerCase().includes(q)) ||
          top.vviPoints.some((v) => v.toLowerCase().includes(q))
        ) {
          results.push({ subject: sub, chapter: chap, topic: top });
        }
      }
    }
  }
  return results.slice(0, 15);
}
