import {
  CareerOption,
  CareerAssessment,
  CareerProfile,
  CareerMatchResult,
  CareerRoadmap,
  Milestone,
} from "../types";

export const CAREER_CATALOG: CareerOption[] = [
  // Commerce Careers
  {
    id: "ca",
    title: "Chartered Accountant (CA)",
    stream: "Commerce",
    category: "Accounting & Financial Audit",
    description: "Expert in auditing financial statements, taxation laws, corporate accounting, and financial advisories.",
    duration: "4.5 - 5 Years (Post Class 12)",
    studyPathway: "Class 12 Commerce -> CA Foundation -> CA Intermediate + 2 Yrs Articleship -> CA Final.",
    requiredSubjects: ["Accountancy", "Economics", "Business Studies", "Mathematics"],
    keySkills: ["Numerical Ability", "Analytical Thinking", "Taxation & Legal Knowledge", "Attention to Detail"],
    workAreas: ["Corporate/Office", "Audit Firms", "Financial Consulting", "Independent Practice"],
    courseStages: [
      "CA Foundation Examination",
      "CA Intermediate (Group 1 & 2)",
      "2-Year Practical Articleship",
      "CA Final Examination & ICAI Registration",
    ],
    whyMatchTags: ["Finance/Markets", "Problem Solving", "High Earning Potential", "Job Security"],
  },
  {
    id: "cs",
    title: "Company Secretary (CS)",
    stream: "Commerce",
    category: "Corporate Governance & Law",
    description: "Chief advisor to corporate boards on company law, secretarial audits, regulatory compliance, and governance.",
    duration: "3 - 4 Years",
    studyPathway: "Class 12 Commerce -> CSEET Entrance -> CS Executive -> Practical Training -> CS Professional.",
    requiredSubjects: ["Business Studies", "English", "Economics", "Accountancy"],
    keySkills: ["Corporate Law", "Communication", "Compliance Management", "Logical Reasoning"],
    workAreas: ["Corporate/Office", "Listed Companies", "Legal Advisory", "Regulatory Bodies"],
    courseStages: [
      "CSEET Entrance Exam",
      "CS Executive Modules 1 & 2",
      "Management Practical Training",
      "CS Professional Qualification",
    ],
    whyMatchTags: ["Management/Leadership", "Communication", "Corporate/Office", "Job Security"],
  },
  {
    id: "cma",
    title: "Cost & Management Accountant (CMA)",
    stream: "Commerce",
    category: "Costing & Managerial Finance",
    description: "Focuses on strategic cost reduction, operational budgeting, performance analysis, and decision-making.",
    duration: "3 - 4 Years",
    studyPathway: "Class 12 -> CMA Foundation -> CMA Intermediate -> Practical Training -> CMA Final.",
    requiredSubjects: ["Accountancy", "Economics", "Mathematics", "Business Studies"],
    keySkills: ["Cost Accounting", "Analytical Thinking", "Budgeting & Forecasting", "Numerical Ability"],
    workAreas: ["Manufacturing Sector", "Corporate/Office", "PSUs (Public Sector)", "Consulting"],
    courseStages: [
      "CMA Foundation Exam",
      "CMA Intermediate Coursework",
      "15-Month Practical Training",
      "CMA Final Certification",
    ],
    whyMatchTags: ["Finance/Markets", "Problem Solving", "Analytical Thinking", "Job Security"],
  },
  {
    id: "bcom",
    title: "Bachelor of Commerce & Honors (B.Com / B.Com Hons)",
    stream: "Commerce",
    category: "Business & Commerce Foundation",
    description: "Versatile undergraduate degree covering business economics, banking, commercial laws, marketing, and accounting.",
    duration: "3 - 4 Years",
    studyPathway: "Class 12 Commerce -> CUET / University Entrance -> B.Com Degree -> Corporate Career / MBA.",
    requiredSubjects: ["Accountancy", "Economics", "Business Studies", "English"],
    keySkills: ["Business Acumen", "Financial Literacy", "Organization", "Communication"],
    workAreas: ["Corporate/Office", "Banking", "Retail & Trade", "Educational Institutions"],
    courseStages: [
      "Semester 1-2 General Commerce Core",
      "Semester 3-4 Specialization (Finance/Tax/Marketing)",
      "Semester 5-6 Internships & Capstone",
    ],
    whyMatchTags: ["Corporate/Office", "Communication", "Management/Leadership", "Project-Based"],
  },
  {
    id: "fin_analyst",
    title: "Financial Analyst & Investment Banking",
    stream: "Commerce",
    category: "High Finance & Capital Markets",
    description: "Specializes in company valuation, equity research, financial modeling, mergers & acquisitions, and portfolio strategy.",
    duration: "3 - 5 Years (Degree + CFA)",
    studyPathway: "Class 12 Commerce/Math -> B.Com / BBA / Economics -> CFA Level 1, 2, 3 -> Investment Bank.",
    requiredSubjects: ["Mathematics", "Economics", "Accountancy", "English"],
    keySkills: ["Financial Modeling", "Analytical Thinking", "Valuation Techniques", "Numerical Ability"],
    workAreas: ["Investment Banks", "Hedge Funds", "Corporate/Office", "Remote/Freelance"],
    courseStages: [
      "Undergraduate Degree in Commerce/Finance",
      "CFA Level 1 Examination",
      "CFA Level 2 & Investment Analyst Role",
      "CFA Level 3 Charterholder",
    ],
    whyMatchTags: ["Finance/Markets", "Analytical Thinking", "High Earning Potential", "Global Opportunities"],
  },
  {
    id: "banking",
    title: "Commercial & Retail Banking Specialist",
    stream: "Commerce",
    category: "Banking & Financial Services",
    description: "Manages retail & commercial credit, bank branch operations, risk compliance, and client wealth portfolios.",
    duration: "3 Years Degree + Banking Examinations",
    studyPathway: "Class 12 Commerce -> B.Com / BBA -> IBPS/SBI PO Exam / Diploma in Banking -> Bank Officer.",
    requiredSubjects: ["Accountancy", "Economics", "Mathematics", "English"],
    keySkills: ["Risk Assessment", "Customer Relations", "Numerical Ability", "Teamwork"],
    workAreas: ["Public/Private Banks", "Corporate/Office", "Financial Institutions"],
    courseStages: [
      "Undergraduate Degree",
      "Banking PO / Officer Entrance Examinations",
      "Probationary Officer Training",
      "Branch / Credit Portfolio Management",
    ],
    whyMatchTags: ["Finance/Markets", "Job Security", "Teamwork", "Corporate/Office"],
  },
  {
    id: "economics",
    title: "Economics & Public Policy Analyst",
    stream: "Commerce",
    category: "Economic Strategy & Policy",
    description: "Analyzes macroeconomic trends, monetary policy, market data, and economic forecasts for government think tanks or corporates.",
    duration: "3 - 5 Years (B.A./B.Sc + Master's)",
    studyPathway: "Class 12 -> B.A. Economics (Hons) -> M.A. Economics -> Civil Services / Economic Consultancies.",
    requiredSubjects: ["Economics", "Mathematics", "English"],
    keySkills: ["Statistical Analysis", "Econometrics", "Logical Reasoning", "Policy Research"],
    workAreas: ["Government Think Tanks", "International Bodies (IMF/World Bank)", "Corporate/Office", "Research"],
    courseStages: [
      "B.A. Economics Honors Degree",
      "Master's in Applied Economics / Econometrics",
      "Policy Research Internship",
      "Economic Consultant / Officer Appointment",
    ],
    whyMatchTags: ["Problem Solving", "Theoretical & Analytical", "Social Impact", "Global Opportunities"],
  },
  {
    id: "bba_entrepreneur",
    title: "Business Administration & Entrepreneurship (BBA/MBA)",
    stream: "Commerce",
    category: "Leadership & Venture Management",
    description: "Prepares leaders to build scalable businesses, manage cross-functional teams, execute growth marketing, and drive innovation.",
    duration: "3 Years (BBA) + 2 Years (MBA)",
    studyPathway: "Class 12 -> BBA / Bachelor's Degree -> CAT/GMAT Entrance -> MBA -> Venture Founder / Product Manager.",
    requiredSubjects: ["Business Studies", "English", "Economics", "Mathematics"],
    keySkills: ["Leadership", "Strategic Planning", "Communication", "Problem Solving"],
    workAreas: ["Startups & Ventures", "Multinational Corporations", "Corporate/Office", "Field Work"],
    courseStages: [
      "BBA / Undergraduate Program",
      "CAT / GMAT Competitive Exam",
      "MBA Core Management Curriculum",
      "Venture Launch or Executive Management Role",
    ],
    whyMatchTags: ["Management/Leadership", "Creative Freedom", "High Earning Potential", "Project-Based"],
  },

  // Science Careers
  {
    id: "cs_engineer",
    title: "Computer Science & Software Engineering",
    stream: "Science",
    category: "Technology & Software Development",
    description: "Designs, builds, and deploys cloud applications, system architectures, web platforms, and mobile algorithms.",
    duration: "4 Years (B.Tech / B.E. / B.S.)",
    studyPathway: "Class 12 Science (PCM) -> JEE / University Entrance -> B.Tech Computer Science -> Software Engineer.",
    requiredSubjects: ["Mathematics", "Physics", "Computer Science", "English"],
    keySkills: ["Programming & Coding", "Problem Solving", "Data Structures", "Logical Reasoning"],
    workAreas: ["Tech Companies", "Remote/Freelance", "Startups", "Corporate/Office"],
    courseStages: [
      "Class 12 Board & Engineering Entrance (JEE)",
      "B.Tech CS Core Computer Systems & Algorithms",
      "Software Engineering Internships",
      "Full-Stack / Backend Engineer Placement",
    ],
    whyMatchTags: ["Coding/Tech", "Problem Solving", "Practical & Hands-on", "High Earning Potential"],
  },
  {
    id: "ai_data",
    title: "Artificial Intelligence & Data Engineering",
    stream: "Science",
    category: "Advanced Computing & Machine Learning",
    description: "Builds machine learning algorithms, deep learning models, big data processing systems, and generative AI systems.",
    duration: "4 Years Degree",
    studyPathway: "Class 12 Science (PCM) -> B.Tech CS/AI/Data Science -> Machine Learning Certifications -> AI Specialist.",
    requiredSubjects: ["Mathematics", "Computer Science", "Physics"],
    keySkills: ["Machine Learning", "Linear Algebra & Statistics", "Python & SQL", "Analytical Thinking"],
    workAreas: ["AI Labs & Tech Firms", "Tech/Lab", "Remote/Freelance", "Corporate/Office"],
    courseStages: [
      "Mathematics & Programming Fundamentals",
      "Machine Learning & Data Structures Coursework",
      "AI Project Portfolio & Capstone",
      "AI Engineer / Data Scientist Placement",
    ],
    whyMatchTags: ["Coding/Tech", "Analytical Thinking", "Practical & Hands-on", "Global Opportunities"],
  },
  {
    id: "mbbs",
    title: "Medical Science & Clinical Healthcare (MBBS)",
    stream: "Science",
    category: "Medicine & Clinical Practice",
    description: "Diagnoses illnesses, performs medical procedures, prescribes treatments, and leads patient healthcare teams.",
    duration: "5.5 Years (MBBS + Rotatory Internship)",
    studyPathway: "Class 12 Science (PCB) -> NEET Entrance Exam -> MBBS Medical College -> 1-Year Internship -> Medical Doctor.",
    requiredSubjects: ["Biology", "Chemistry", "Physics", "English"],
    keySkills: ["Clinical Knowledge", "Empathy & Patient Care", "Diagnostic Reasoning", "Precision under Pressure"],
    workAreas: ["Hospitals & Clinics", "Healthcare/Clinic", "Research Institutes"],
    courseStages: [
      "NEET-UG Medical Entrance Exam",
      "Pre-Clinical & Para-Clinical MBBS Phases",
      "Clinical Hospital Rotations",
      "Compulsory Rotatory Internship & Medical Council Registration",
    ],
    whyMatchTags: ["Healthcare/Clinic", "Medicine/Healthcare", "Job Security", "Social Impact"],
  },
  {
    id: "pure_research",
    title: "Pure Science & Scientific Research",
    stream: "Science",
    category: "Fundamental Research & Discovery",
    description: "Conducts experimental and theoretical scientific research in physics, chemistry, mathematics, or space science.",
    duration: "5 Years (BS-MS Dual Degree at IISER/IISc)",
    studyPathway: "Class 12 Science -> IAT / NEST Entrance -> BS-MS Dual Degree -> Ph.D. Research -> Scientist / Professor.",
    requiredSubjects: ["Physics", "Chemistry", "Mathematics", "Biology"],
    keySkills: ["Scientific Method", "Analytical Thinking", "Research Methodology", "Logical Reasoning"],
    workAreas: ["Research Institutes (ISRO/DRDO/BARC)", "Tech/Lab", "Universities"],
    courseStages: [
      "BS-MS Science Foundation Coursework",
      "Advanced Research Lab Thesis",
      "Ph.D. Fellowship / Doctoral Defense",
      "Research Scientist Appointment",
    ],
    whyMatchTags: ["Scientific Research", "Theoretical & Analytical", "Creative Freedom", "Global Opportunities"],
  },
  {
    id: "core_eng",
    title: "Core Engineering (Mechanical / Electrical / Civil)",
    stream: "Science",
    category: "Physical Systems & Infrastructure",
    description: "Engineers physical machinery, electrical grids, robotics, bridge infrastructure, and smart energy systems.",
    duration: "4 Years (B.Tech / B.E.)",
    studyPathway: "Class 12 Science (PCM) -> JEE Main/Advanced -> B.Tech Core Engineering -> GATE / Industry Consultant.",
    requiredSubjects: ["Physics", "Mathematics", "Chemistry"],
    keySkills: ["Spatial Reasoning", "CAD Modeling & Systems Design", "Problem Solving", "Technical/Coding"],
    workAreas: ["Industrial Manufacturing", "Field Work", "Tech/Lab", "PSUs"],
    courseStages: [
      "Class 12 Board & JEE Main Preparation",
      "B.Tech Engineering Mechanics & Systems Lab",
      "Industrial Internship & Senior Design Project",
      "Design Engineer / Project Manager Appointment",
    ],
    whyMatchTags: ["Problem Solving", "Field Work", "Practical & Hands-on", "Job Security"],
  },
  {
    id: "biotech",
    title: "Biotechnology & Bio-Pharma Research",
    stream: "Science",
    category: "Bio-Engineering & Life Sciences",
    description: "Applies biological principles and engineering techniques to develop novel pharmaceuticals, therapies, and bio-products.",
    duration: "4 Years (B.Tech Biotech) / 3 Years (B.Sc)",
    studyPathway: "Class 12 Science (PCB/PCM) -> B.Tech / B.Sc Biotechnology -> Master's -> Bio-Pharma R&D Scientist.",
    requiredSubjects: ["Biology", "Chemistry", "Physics", "Mathematics"],
    keySkills: ["Molecular Biology", "Lab Operations", "Analytical Thinking", "Data Analysis"],
    workAreas: ["Pharmaceutical Companies", "Tech/Lab", "Biotech Startups"],
    courseStages: [
      "B.Tech / B.Sc Biotechnology Degree",
      "Genomics & Molecular Lab Practical Training",
      "Master's Thesis Research Project",
      "Biotech R&D Specialist Placement",
    ],
    whyMatchTags: ["Scientific Research", "Medicine/Healthcare", "Project-Based", "Global Opportunities"],
  },
];

export function calculateCareerMatches(
  assessment: CareerAssessment,
  profile: CareerProfile
): CareerMatchResult[] {
  const filterStream = profile.stream;

  return CAREER_CATALOG.map((career) => {
    let score = 50; // baseline score
    const whyMatches: string[] = [];
    const relevantStrengths: string[] = [];
    const areasToExplore: string[] = [];

    // Stream match boost
    if (career.stream === filterStream) {
      score += 15;
    } else {
      score -= 10;
    }

    // Strong subject matches (+10 per subject)
    const matchingSubjects = assessment.strongSubjects.filter((subj) =>
      career.requiredSubjects.some(
        (req) => req.toLowerCase() === subj.toLowerCase()
      )
    );
    score += matchingSubjects.length * 10;
    if (matchingSubjects.length > 0) {
      whyMatches.push(
        `Strong match with your top subject(s): ${matchingSubjects.join(", ")}.`
      );
    }

    // Interest matches (+8 per tag)
    const matchingInterests = assessment.interests.filter((interest) =>
      career.whyMatchTags.some(
        (tag) => tag.toLowerCase() === interest.toLowerCase()
      )
    );
    score += matchingInterests.length * 8;
    if (matchingInterests.length > 0) {
      whyMatches.push(
        `Aligns with your key interest area(s): ${matchingInterests.join(", ")}.`
      );
    }

    // Skill matches (+8 per skill)
    const matchingSkills = assessment.skills.filter((skill) =>
      career.keySkills.some(
        (ks) => ks.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(ks.toLowerCase())
      )
    );
    score += matchingSkills.length * 8;
    if (matchingSkills.length > 0) {
      relevantStrengths.push(...matchingSkills);
      whyMatches.push(
        `Utilizes your core skill(s): ${matchingSkills.join(", ")}.`
      );
    }

    // Work area match (+6)
    const matchingWorkArea = assessment.workAreas.filter((wa) =>
      career.workAreas.some(
        (cwa) => cwa.toLowerCase().includes(wa.toLowerCase()) || wa.toLowerCase().includes(cwa.toLowerCase())
      )
    );
    score += matchingWorkArea.length * 6;
    if (matchingWorkArea.length > 0) {
      whyMatches.push(
        `Fits your preferred work environment: ${matchingWorkArea.join(", ")}.`
      );
    }

    // Career goals match (+6)
    const matchingGoals = assessment.careerGoals.filter((cg) =>
      career.whyMatchTags.some((tag) => tag.toLowerCase() === cg.toLowerCase())
    );
    score += matchingGoals.length * 6;

    // Study preference match (+8)
    if (
      assessment.studyPreference === "Professional Certifications" &&
      ["ca", "cs", "cma", "fin_analyst"].includes(career.id)
    ) {
      score += 10;
      whyMatches.push("Perfect match for professional certification study style.");
    } else if (
      assessment.studyPreference === "Practical & Hands-on" &&
      ["cs_engineer", "ai_data", "core_eng", "bba_entrepreneur"].includes(career.id)
    ) {
      score += 10;
      whyMatches.push("Matches your practical hands-on project learning style.");
    } else if (
      assessment.studyPreference === "Theoretical & Analytical" &&
      ["pure_research", "economics", "mbbs", "biotech"].includes(career.id)
    ) {
      score += 10;
      whyMatches.push("Complements your theoretical & analytical depth.");
    }

    // Clamp score between 40% and 98%
    const finalScore = Math.min(98, Math.max(40, score));

    // Fallbacks if empty
    if (whyMatches.length === 0) {
      whyMatches.push(
        `Structured pathway for ${career.stream} students seeking ${career.category}.`
      );
    }
    if (relevantStrengths.length === 0) {
      relevantStrengths.push(
        career.keySkills[0] || "Foundational Aptitude",
        career.keySkills[1] || "Problem Solving"
      );
    }

    // Areas to explore
    areasToExplore.push(
      `Course Stages: ${career.courseStages.slice(0, 2).join(" → ")}`,
      `Key Exam / Entry: ${career.studyPathway.split("->")[1] || "University Entrance"}`
    );

    return {
      career,
      matchScore: finalScore,
      whyMatches,
      relevantStrengths: Array.from(new Set(relevantStrengths)),
      areasToExplore,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export function generateDefaultRoadmap(
  career: CareerOption,
  profile: CareerProfile
): CareerRoadmap {
  const currentClass = profile.currentClass || "Class 12";

  const milestones: Milestone[] = career.courseStages.map((stageTitle, idx) => {
    let timeframe = "Upcoming Stage";
    if (idx === 0) timeframe = `${currentClass} Foundation & Entrance Prep`;
    else if (idx === 1) timeframe = "Year 1 - Year 2 Core Modules";
    else if (idx === 2) timeframe = "Year 3 Advanced Training / Articleship";
    else timeframe = "Final Qualification & Placement";

    return {
      id: `m-${career.id}-${idx}`,
      title: stageTitle,
      stage: idx === 0 ? "Foundation" : idx === career.courseStages.length - 1 ? "Final" : "Intermediate",
      description: `Complete the ${stageTitle} curriculum, assessments, and required practical certifications.`,
      completed: idx === 0, // mark first milestone completed by default for demo guidance
      targetTimeframe: timeframe,
    };
  });

  return {
    careerId: career.id,
    careerTitle: career.title,
    stream: career.stream,
    currentClass,
    milestones,
    lastUpdated: Date.now(),
  };
}
