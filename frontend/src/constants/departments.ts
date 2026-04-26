type DepartmentMapping = {
  keywords: readonly string[];
  department: string;
};

export const DEPARTMENT_MAPPINGS: readonly DepartmentMapping[] = [
  {
    keywords: ["ulo", "headache", "migraine", "sakit ng ulo"],
    department: "General Medicine / Internal Medicine",
  },
  {
    keywords: ["mata", "eye", "blurred", "malabo paningin", "paningin"],
    department: "Ophthalmology",
  },
  {
    keywords: ["ngipin", "tooth", "dental", "gilagid", "bagang"],
    department: "Dental",
  },
  {
    keywords: ["buntis", "pregnant", "prenatal", "pagbubuntis", "ob"],
    department: "OB-GYN",
  },
  {
    keywords: ["balat", "skin", "rash", "pantal", "galis", "allergy"],
    department: "Dermatology",
  },
  {
    keywords: ["bata", "child", "pediatric", "baby", "sanggol"],
    department: "Pediatrics",
  },
  {
    keywords: ["ubo", "cough", "sipon", "lagnat", "fever", "flu"],
    department: "General Medicine / Family Medicine",
  },
  {
    keywords: ["dibdib", "chest", "palpitation", "puso", "heart"],
    department: "Internal Medicine / Cardiology",
  },
  {
    keywords: ["tiyan", "stomach", "abdomen", "diarrhea", "pagtatae", "suka"],
    department: "General Medicine / Gastroenterology",
  },
  {
    keywords: ["ihi", "urine", "kidney", "bato", "masakit umihi"],
    department: "Urology / General Medicine",
  },
  {
    keywords: ["tenga", "ear", "ilong", "nose", "lalamunan", "throat"],
    department: "ENT",
  },
  {
    keywords: ["bali", "fracture", "sprain", "pilay", "butas buto", "joint"],
    department: "Orthopedics",
  },
  {
    keywords: ["sugat", "wound", "hiwa", "paso", "burn"],
    department: "Surgery / Wound Care",
  },
  {
    keywords: ["diabetes", "sugar", "insulin", "thyroid"],
    department: "Internal Medicine / Endocrinology",
  },
  {
    keywords: ["pressure", "hypertension", "high blood", "altapresyon"],
    department: "Internal Medicine",
  },
  {
    keywords: ["mental", "anxiety", "depression", "stress", "panic"],
    department: "Psychiatry / Mental Health",
  },
  {
    keywords: ["rehab", "therapy", "stroke", "paralysis", "panghihina"],
    department: "Rehabilitation Medicine",
  },
  {
    keywords: ["bakuna", "vaccine", "immunization", "rabies"],
    department: "Public Health / Animal Bite Center",
  },
];

export function getDepartmentHint(concern: string): string | null {
  const normalized = concern.toLowerCase();
  const match = DEPARTMENT_MAPPINGS.find((mapping) =>
    mapping.keywords.some((keyword) => normalized.includes(keyword))
  );

  return match?.department ?? null;
}
