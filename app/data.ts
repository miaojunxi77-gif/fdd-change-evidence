export type ItemResult = {
  item: number;
  title: string;
  share: number;
  major?: number;
  routine?: number;
  ci?: [number, number];
  rank?: number;
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

export const consecutiveItems: ItemResult[] = [
  { rank: 1, item: 6, title: "Other Fees", share: 66.5, major: 32.3, routine: 10.5 },
  { rank: 2, item: 7, title: "Estimated Initial Investment", share: 60.2, major: 14.1, routine: 29.2 },
  { rank: 3, item: 11, title: "Assistance, Systems & Training", share: 55.3, major: 21.6, routine: 27.9 },
  { rank: 4, item: 5, title: "Initial Fees", share: 54.1, major: 22.4, routine: 17.0 },
  { rank: 5, item: 19, title: "Financial Performance Representations", share: 51.3, major: 0.4, routine: 38.3 },
  { rank: 6, item: 17, title: "Renewal, Termination & Disputes", share: 43.2, major: 20.3, routine: 6.9 },
  { rank: 7, item: 8, title: "Sources of Products & Services", share: 42.8, major: 17.8, routine: 40.8 },
  { rank: 8, item: 12, title: "Territory", share: 38.7, major: 20.4, routine: 4.8 },
  { rank: 9, item: 1, title: "Franchisor, Parents & Affiliates", share: 35.4, major: 14.2, routine: 38.7 },
  { rank: 10, item: 13, title: "Trademarks", share: 32.9, major: 8.4, routine: 10.5 },
  { rank: 11, item: 2, title: "Business Experience", share: 26.7, major: 0, routine: 29.2 },
  { rank: 12, item: 20, title: "Outlets & Franchisee Information", share: 25.9, major: 1.5, routine: 87.3 },
  { rank: 13, item: 3, title: "Litigation", share: 22.1, major: 0, routine: 2.2 },
  { rank: 14, item: 15, title: "Operation of the Franchise Business", share: 20.0, major: 8.1, routine: 0.4 },
  { rank: 15, item: 10, title: "Financing", share: 12.8, major: 9.5, routine: 2.5 },
  { rank: 16, item: 16, title: "Restrictions on Sales", share: 11.9, major: 5.1, routine: 0 },
  { rank: 17, item: 14, title: "Patents, Copyrights & Proprietary Information", share: 11.1, major: 2.2, routine: 1.0 },
  { rank: 18, item: 22, title: "Contracts", share: 10.0, major: 7.5, routine: 0.4 },
  { rank: 19, item: 4, title: "Bankruptcy", share: 9.0, major: 2.8, routine: 2.8 },
  { rank: 20, item: 21, title: "Financial Statements", share: 7.4, major: 1.1, routine: 89.6 },
  { rank: 21, item: 9, title: "Franchisee Obligations", share: 6.1, major: 3.5, routine: 7.9 },
  { rank: 22, item: 23, title: "Receipts", share: 4.2, major: 0.4, routine: 2.0 },
  { rank: 23, item: 18, title: "Public Figures", share: 1.3, major: 0.5, routine: 0 },
];

export const crossPeriodItems: ItemResult[] = [
  { item: 6, title: "Other Fees", share: 84.8, major: 50.8, routine: 4.7, ci: [74.3, 91.5] },
  { item: 7, title: "Estimated Initial Investment", share: 79.0, major: 32.3, routine: 21.6, ci: [67.9, 87.0] },
  { item: 5, title: "Initial Fees", share: 78.0, major: 41.8, routine: 7.9, ci: [66.8, 86.3] },
  { item: 11, title: "Assistance, Systems & Training", share: 74.8, major: 41.7, routine: 13.0, ci: [63.3, 83.7] },
  { item: 19, title: "Financial Performance Representations", share: 67.2, major: 0.3, routine: 23.1, ci: [55.3, 77.2] },
  { item: 17, title: "Renewal, Termination & Disputes", share: 55.3, major: 34.7, routine: 2.3, ci: [43.5, 66.6] },
  { item: 3, title: "Litigation", share: 31.1, major: 1.0, routine: 2.8, ci: [21.3, 42.9] },
  { item: 21, title: "Financial Statements", share: 14.8, major: 2.8, routine: 80.4, ci: [8.2, 25.2] },
  { item: 10, title: "Financing", share: 13.4, major: 11.0, routine: 1.3, ci: [7.2, 23.6] },
];

export const cases: CaseStudy[] = [
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

export const itemLabels = Object.fromEntries(
  consecutiveItems.map((row) => [row.item, row.title]),
);

