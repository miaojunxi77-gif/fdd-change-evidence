import {
  consecutiveItemsGenerated,
  crossPeriodItemsGenerated,
  routeSummariesGenerated,
} from "./generated-results";

export type ChangeTypeCounts = {
  introduced: number;
  modified: number;
  removed: number;
  reclassified: number;
};

export type ItemResult = {
  item: number;
  title: string;
  share: number;
  major?: number;
  routine?: number;
  n?: number;
  incomplete?: number;
  ci?: [number, number];
  rank?: number;
  atomicChanges?: number;
  outcomeReadyAtomicChanges?: number;
  reviewRequiredAtomicChanges?: number;
  detectedShare?: number | null;
  changeTypes?: ChangeTypeCounts;
};

export type Evidence = {
  quote: string;
  page: number;
  verified: boolean;
};

export type CaseItem = {
  item: number;
  title: string;
  score: number;
  direction: string;
  substantive: boolean;
  contractual: boolean;
  summary: string;
  interpretation: string;
  oldEvidence: Evidence[];
  newEvidence: Evidence[];
  status: "verified" | "manual" | "review";
  note?: string;
};

export type CaseStudy = {
  slug: string;
  company: string;
  route: "consecutive" | "cross-period";
  oldYear: number;
  newYear: number;
  source: string;
  analysisId: string;
  oldDocument: string;
  newDocument: string;
  featured: string;
  items: CaseItem[];
};

export const consecutiveItems: ItemResult[] = consecutiveItemsGenerated;
export const crossPeriodItems: ItemResult[] = crossPeriodItemsGenerated;
export const consecutiveChangeSummary = routeSummariesGenerated.consecutive;
export const crossPeriodChangeSummary = routeSummariesGenerated["cross-period"];

const legacyCases: CaseStudy[] = [
  {
    slug: "element-hotels-2022-2023",
    company: "Element Hotels / Element Residences",
    route: "consecutive",
    oldYear: 2022,
    newYear: 2023,
    source: "NASAA",
    analysisId: "S2524__2022_2023",
    oldDocument: "2022 Element FDD 3-31-22.pdf",
    newDocument: "2023 Element FDD 3-31-2023.pdf",
    featured: "The Red Zone trigger moved from 33% of operated hotels to any single operated hotel.",
    items: [
      {
        item: 11,
        title: "Franchisor Assistance, Systems & Training",
        score: 3,
        direction: "strengthened",
        substantive: true,
        contractual: false,
        status: "verified",
        summary: "The threshold for mandatory Audit Program/GSS Improvement participation was materially lowered.",
        interpretation: "The 2022 clause required at least 33% of the relevant hotels to enter the Red Zone. The 2023 clause can be triggered when any one hotel enters the Red Zone, expanding exposure to mandatory training and related fees.",
        oldEvidence: [
          {
            quote: "If 33% or more of the Company Brand Hotels operated by you, your affiliates, or your management company are placed in the Red Zone in any quality assurance performance tracking period, we may require you to participate in an Audit Program/GSS Improvement program",
            page: 100,
            verified: true,
          },
        ],
        newEvidence: [
          {
            quote: "If any hotel operated by you, your affiliate(s), or your management company is placed in the Red Zone in any quality assurance tracking period, we may require you to participate in an Audit Program/GSS Improvement program",
            page: 95,
            verified: true,
          },
        ],
      },
    ],
  },
  {
    slug: "bumble-bee-blinds-2024-2025",
    company: "Bumble Bee Blinds",
    route: "consecutive",
    oldYear: 2024,
    newYear: 2025,
    source: "Minnesota",
    analysisId: "S7807__2024_2025",
    oldDocument: "2024__Bumble Bee Blinds__32865…FDD.pdf",
    newDocument: "2025__Bumble Bee Blinds__35193…FDD.pdf",
    featured: "Systems, data access, investment costs and one dispute-resolution obligation changed.",
    items: [
      {
        item: 6,
        title: "Other Fees",
        score: 4,
        direction: "mixed",
        substantive: true,
        contractual: true,
        status: "manual",
        summary: "Royalty timing and fee structure changed, but liquidated damages was not newly introduced.",
        interpretation: "Manual review confirmed the royalty schedule and several fees changed. It also corrected the model output: the liquidated-damages provision was already present in the 2024 FDD and must not be coded as newly introduced.",
        oldEvidence: [
          { quote: "The greater of (i) 8.5% of Gross Revenues Collected; or (ii) the Minimum Royalty Fee.", page: 22, verified: true },
          { quote: "Weekly via Electronic Funds Transfer from your bank account.", page: 22, verified: false },
        ],
        newEvidence: [
          { quote: "The greater of (i) Royalty Percentage of Gross Revenues; or (ii) the Minimum Royalty Fee.", page: 19, verified: false },
          { quote: "Monthly via Electronic Funds Transfer from your bank account.", page: 19, verified: false },
        ],
        note: "Human correction: remove ‘liquidated damages introduced’ from the change code.",
      },
      {
        item: 7,
        title: "Estimated Initial Investment",
        score: 3,
        direction: "strengthened",
        substantive: true,
        contractual: false,
        status: "manual",
        summary: "The 2025 initial-investment table added a Special Software Fee and revised multiple cost ranges.",
        interpretation: "The new Special Software Fee is a genuine line-item addition. Other changes include the Opening Package, Brand Marketing Fee, ZeePartnerships Fee and the total estimated investment range.",
        oldEvidence: [
          { quote: "Opening Package (5) $15,000 $20,000 Lump Sum Before Opening Us", page: 32, verified: true },
          { quote: "ZeePartnerships Fee (17) $3,000 $3,000 As Incurred After Opening Us", page: 33, verified: true },
        ],
        newEvidence: [
          { quote: "Opening Package (5) $13,100 $17,030 Lump Sum Before opening.", page: 29, verified: false },
          { quote: "ZeePartnerships Fee (18) $5,000 $5,000 As Incurred", page: 33, verified: false },
        ],
        note: "Human-validated conclusion; some OCR-normalized quotations still require page-level re-verification.",
      },
      {
        item: 11,
        title: "Franchisor Assistance, Systems & Training",
        score: 4,
        direction: "strengthened",
        substantive: true,
        contractual: true,
        status: "manual",
        summary: "The 2025 FDD specifies a seven-week hybrid training program, mandates Microsoft 365 packages and expands data-access language.",
        interpretation: "Training already existed in 2024, so the evidence supports ‘duration newly specified’ rather than ‘training became longer.’ The clearest new obligations are the Microsoft 365 system and fee requirements, plus express access to customer PII and broader operational data.",
        oldEvidence: [
          { quote: "Provide you and two (2) additional individuals … with our Initial Training Program, that you must attend and complete to our satisfaction", page: 47, verified: true },
          { quote: "We have the right to independently access, monitor, and retrieve any data you input or collect electronically", page: 55, verified: true },
        ],
        newEvidence: [
          { quote: "You must attend and successfully complete our Initial Training Program, consisting of Phase I, Phase II, and Phase III Training", page: 44, verified: true },
          { quote: "Data collected by your Computer System includes … customer names, addresses, phone numbers, emails, and type (residential or commercial).", page: 57, verified: true },
          { quote: "Package 1: RIVNT Basic - Microsoft Office E1 Package Total Cost: $45/month per user", page: 56, verified: true },
        ],
        note: "Human correction: do not infer that training duration increased; code it as newly specified.",
      },
      {
        item: 17,
        title: "Renewal, Termination, Transfer & Dispute Resolution",
        score: 4,
        direction: "strengthened",
        substantive: true,
        contractual: true,
        status: "manual",
        summary: "The clearest new term is mandatory travel to Omaha for internal dispute resolution.",
        interpretation: "The 2024 FDD already contained mediation, arbitration and Bucks County forum provisions. Manual review therefore narrows the confirmed change to the new in-person internal-resolution requirement at headquarters in Omaha.",
        oldEvidence: [
          { quote: "All claims not subject to mediation or arbitration must only be brought in a competent court of general jurisdiction located in Bucks County, Pennsylvania", page: 78, verified: true },
        ],
        newEvidence: [
          { quote: "You must first exhaust our internal dispute resolution procedures … including … the requirement to travel to our headquarters in Omaha, NE for a meeting with the Chief Executive Officer", page: 79, verified: true },
        ],
        note: "Human correction: mediation, arbitration and Bucks County were not new in 2025.",
      },
    ],
  },
  {
    slug: "granite-garage-floors-2022-2026",
    company: "Granite Garage Floors",
    route: "cross-period",
    oldYear: 2022,
    newYear: 2026,
    source: "NASAA",
    analysisId: "S5537__2022_2026",
    oldDocument: "2022 GGF FDD (CLEAN).pdf",
    newDocument: "Granite Garage Floors - 2026 FDD.pdf",
    featured: "Direct franchisor financing was adopted at 12% annual interest.",
    items: [
      {
        item: 10,
        title: "Financing",
        score: 5,
        direction: "introduced",
        substantive: true,
        contractual: true,
        status: "verified",
        summary: "A direct franchisor financing offer replaced an explicit no-financing statement.",
        interpretation: "This case passes the financing guardrail because the new FDD expressly identifies the franchisor as the financing provider. The promissory note and guarantee language are supporting terms, not the basis for classifying the case as franchisor financing.",
        oldEvidence: [
          { quote: "We do not offer direct or indirect financing. We do not guarantee your note, lease, or obligation.", page: 32, verified: true },
        ],
        newEvidence: [
          { quote: "We may offer financing of up to the full amount of the Initial Franchise Fee … to prospects who meet our qualifications, including creditworthiness.", page: 35, verified: true },
          { quote: "If you qualify and accept financing from us, you must sign the Promissory Note attached as Exhibit F", page: 35, verified: true },
          { quote: "We will charge interest at an annual rate of 12%.", page: 35, verified: true },
        ],
        note: "Financing guardrail passed: explicit provider-offer language verified.",
      },
    ],
  },
];

const deepseekCases: CaseStudy[] = [
  {
    slug: "deepseek-100-chiropractic-2021-2022",
    company: "100% Chiropractic",
    route: "consecutive",
    oldYear: 2021,
    newYear: 2022,
    source: "DeepSeek cleaned export",
    analysisId: "S3099__2021_2022",
    oldDocument: "Source filename not included in the cleaned workbook",
    newDocument: "Source filename not included in the cleaned workbook",
    featured: "The royalty formula, technology charges, training fees and system-cost estimates were materially restructured.",
    items: [
      {
        item: 6,
        title: "Other Fees",
        score: 5,
        direction: "mixed",
        substantive: true,
        contractual: true,
        status: "review",
        summary: "The royalty changed from a fixed monthly amount to a percentage formula with a floor and cap, while technology and advertising charges were revised.",
        interpretation: "The cleaned DeepSeek output contains 17 included conservative atomic changes for this comparison. The row-level explorer preserves the full set; this featured card shows only representative evidence.",
        oldEvidence: [
          { quote: "Royalty Fee $2,500 beginning with the first month of operations.", page: 17, verified: false },
          { quote: "Currently $260 per month for software support and $189 per month for computer equipment technical support and a one-time fee of $599 for the software license.", page: 19, verified: false },
        ],
        newEvidence: [
          { quote: "Royalty Fee (1-A) 6.5% of Gross Revenue from all sources as defined in footnote 3 below.", page: 23, verified: false },
          { quote: "The amount will not exceed $7,500 per month nor be less than $2,500 per month with $1,500 minimum for the first 3 months.", page: 23, verified: false },
          { quote: "Technology Fee (4) Currently $1,250 for an assortment of technology processes and services.", page: 24, verified: false },
        ],
        note: "DeepSeek analysis-ready result; quotations retain exported page locators but have not been independently page-reverified in this workbook.",
      },
      {
        item: 11,
        title: "Franchisor Assistance, Advertising, Systems & Training",
        score: 5,
        direction: "increase",
        substantive: true,
        contractual: true,
        status: "review",
        summary: "New technology and placement-program fees were introduced, while training charges, advertising costs and estimated system costs increased.",
        interpretation: "The cleaned DeepSeek output contains 10 included conservative atomic changes. No inference is made about actual payment, participation or enforcement.",
        oldEvidence: [
          { quote: "at the rate of $1,000 per week payable to the hosting office", page: 38, verified: false },
          { quote: "We estimate the cost of purchasing the Computer System and related software and associated equipment will range from $9,371 to $14,290.", page: 44, verified: false },
        ],
        newEvidence: [
          { quote: "at the rate of $1,500 per week payable by you to the hosting office", page: 42, verified: false },
          { quote: "cost of purchasing the Computer System and related software and associated equipment will range from $19,000 to $25,000.", page: 49, verified: false },
          { quote: "You must pay a monthly Technology Fee of $1,250", page: 49, verified: false },
        ],
        note: "DeepSeek analysis-ready result; representative quotations shown here are a subset of the row-level evidence.",
      },
    ],
  },
  {
    slug: "deepseek-realty-executives-2016-2017",
    company: "Realty Executives",
    route: "consecutive",
    oldYear: 2016,
    newYear: 2017,
    source: "DeepSeek cleaned export",
    analysisId: "S1408__2016_2017",
    oldDocument: "Source filename not included in the cleaned workbook",
    newDocument: "Source filename not included in the cleaned workbook",
    featured: "An explicit no-financing statement was replaced by an optional franchisor financing program.",
    items: [
      {
        item: 10,
        title: "Financing",
        score: 5,
        direction: "mixed",
        substantive: true,
        contractual: true,
        status: "review",
        summary: "The new FDD introduces discretionary financing, a 6%–7% APR range, repayment terms, guarantees, collateral and default remedies.",
        interpretation: "The cleaned DeepSeek output contains 16 included conservative atomic changes. It supports a change in disclosed financing terms, not an inference that any franchisee actually received financing.",
        oldEvidence: [
          { quote: "We do not offer direct or indirect financing We do not guaranty any of your notes, leases or other obligations", page: 14, verified: false },
        ],
        newEvidence: [
          { quote: "From time to time, we may finance the initial franchise fee as well as certain startup costs", page: 19, verified: false },
          { quote: "Interest Rate – ranges from 6% to 7%", page: 19, verified: false },
          { quote: "You must also sign a Security Agreement granting us a security interest in all of your assets", page: 20, verified: false },
        ],
        note: "DeepSeek analysis-ready result; page locators are retained from the cleaned export and remain available for source-PDF checking.",
      },
    ],
  },
];

export const cases: CaseStudy[] = legacyCases;

export const itemLabels = Object.fromEntries(
  consecutiveItems.map((row) => [row.item, row.title]),
);
