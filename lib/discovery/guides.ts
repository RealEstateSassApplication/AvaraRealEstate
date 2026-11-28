export type Guide = {slug:string;title:string;description:string;category:string;question:string;answer:string;sections:string[][];checks:string[];links:string[][];sources:string[][];note:string};
export const guides:Guide[]=[
  {
    "slug": "buying-land-sri-lanka",
    "title": "Buying land in Sri Lanka",
    "description": "A practical checklist for reviewing land documents, boundaries, access and purchase costs before buying land in Sri Lanka.",
    "category": "Land & ownership",
    "question": "What should I check before buying land in Sri Lanka?",
    "answer": "Before committing to land, establish what is being sold, have a qualified independent notary or lawyer review the title and relevant records, and arrange a survey if boundaries or access are unclear. Confirm permitted use, utilities, road access and total costs separately. A listing or a deed copy alone is not proof of clear title.",
    "sections": [
      [
        "Review the documents",
        "Ask for the deed or title documents and survey plan. Confirm that the land description, extent and boundaries refer to the same parcel. The Registrar General’s Department provides services for certified deed and land record copies; discuss what records are required with your independent adviser."
      ],
      [
        "Visit and compare",
        "Walk the boundaries with the appropriate professional. Ask about access rights, drainage, water and electricity availability, surrounding uses and any approvals needed for your intended development. Do not rely on a seller’s description alone."
      ],
      [
        "Work out the complete cost",
        "Compare the quoted price per perch only after confirming the surveyed extent. Budget separately for professional fees, applicable taxes and registration charges, and site preparation. Confirm current amounts with your adviser rather than using an assumed percentage."
      ]
    ],
    "checks": [
      "Independent title review",
      "Surveyed extent and boundaries",
      "Legal road access",
      "Development restrictions",
      "Total acquisition and site preparation costs"
    ],
    "links": [
      [
        "Land area converter",
        "/tools/land-converter"
      ],
      [
        "Land for sale",
        "/listings?purpose=sale&type=land"
      ]
    ],
    "sources": [
      [
        "Registrar General’s Department — certified deed copies",
        "https://rgd.gov.lk/web/index.php/en/services/document-land-registration/movable-and-immovable-properties/obtaining-a-certified-copy-of-a-deed1"
      ],
      [
        "Registrar General’s Department — online land portal",
        "https://online.land.rgd.gov.lk/"
      ]
    ],
    "note": "General planning guidance, not legal advice. Obtain independent legal and surveying advice for the particular property."
  },
  {
    "slug": "renting-home-sri-lanka",
    "title": "Renting a home in Sri Lanka",
    "description": "A practical rental viewing checklist covering deposits, utilities, commuting and written rental terms.",
    "category": "Renting",
    "question": "What should I check before renting a home in Sri Lanka?",
    "answer": "Compare the total monthly cost and the written rental terms, not just advertised rent. Inspect the actual home, confirm who is authorized to rent it, ask about deposits, utility bills, repairs, parking and notice terms, and test your commute. Obtain a written record of the agreed condition and payments before moving in.",
    "sections": [
      [
        "Calculate the actual monthly cost",
        "Separate the rent from electricity, water, internet, building charges, transport and recurring maintenance. Ask whether each charge is included, billed separately or subject to change."
      ],
      [
        "Prepare for the viewing",
        "Check water pressure, ventilation, signs of damp, noise, access and security. Inspect the exact unit and make a written list of existing damage with the owner’s agreement."
      ],
      [
        "Agree terms before paying",
        "Ask how the deposit is handled, who pays for repairs, how rent changes are agreed, and what happens when either party ends the agreement. Keep records and seek independent legal advice when terms are unclear."
      ]
    ],
    "checks": [
      "Written rent and deposit terms",
      "Utility and service charges",
      "Actual property condition",
      "Commute and access",
      "Payment receipts"
    ],
    "links": [
      [
        "Living cost calculator",
        "/tools/living-cost"
      ],
      [
        "Browse rentals",
        "/listings?purpose=rent"
      ],
      [
        "Explore neighbourhoods",
        "/explore"
      ]
    ],
    "sources": [],
    "note": "Practical editorial checklist, not a statement of tenancy law or standard deposit amounts."
  },
  {
    "slug": "mortgage-planning-sri-lanka",
    "title": "Mortgage planning in Sri Lanka",
    "description": "Understand down payments, fixed-rate monthly repayments, total interest and the assumptions behind a mortgage estimate in LKR.",
    "category": "Finance",
    "question": "How do I estimate a monthly mortgage payment?",
    "answer": "Subtract your down payment from the property price to estimate the loan principal. For a fixed-rate amortizing loan, monthly payments depend on that principal, the nominal annual interest rate and the number of monthly payments. Compare the total interest and upfront fees as well as monthly repayment, and verify actual terms with the lender.",
    "sections": [
      [
        "Start with the loan amount",
        "A property priced at LKR 15 million with an illustrative LKR 3 million down payment requires LKR 12 million in financing before fees. This is an example, not a lender’s required deposit."
      ],
      [
        "Understand rate and term",
        "The fixed-rate model assumes the nominal annual interest rate divided by 12 and equal monthly payments. A longer term usually reduces the payment at a given positive rate but increases total interest. Variable rates and fees may change the outcome."
      ],
      [
        "Stress-test affordability",
        "Include recurring owner costs, living expenses and an emergency reserve. Compare scenarios with higher interest rates or lower income. Obtain the lender’s actual offer, fee schedule and repayment terms before committing."
      ]
    ],
    "checks": [
      "Loan amount and down payment",
      "Interest rate and rate changes",
      "Term and fees",
      "Total interest",
      "Budget under adverse scenarios"
    ],
    "links": [
      [
        "Mortgage calculator",
        "/tools/mortgage"
      ],
      [
        "Rent versus buy calculator",
        "/tools/rent-vs-buy"
      ]
    ],
    "sources": [],
    "note": "Illustrative fixed-rate planning only. Not a lender quote, rate forecast or financial advice."
  },
  {
    "slug": "perch-acre-square-feet",
    "title": "Perches, acres and square feet",
    "description": "Convert Sri Lankan land area measurements: one perch equals 272.25 square feet, and one acre equals 160 perches.",
    "category": "Land measurements",
    "question": "How many square feet are in one perch?",
    "answer": "One standard land-area perch equals 272.25 square feet, or about 25.2929 square metres. An acre contains 160 perches and 43,560 square feet. Multiply the number of perches by 272.25 to convert to square feet; divide square feet by 272.25 to convert back.",
    "sections": [
      [
        "Compare the standard units",
        "One square foot equals 0.09290304 square metres. One hectare equals 10,000 square metres. The calculator uses these area definitions, not length measurements."
      ],
      [
        "Worked example",
        "A 10-perch plot is 2,722.5 square feet, approximately 252.93 square metres, or 0.0625 acres. A quoted LKR 20 million for 10 perches implies LKR 2 million per perch before fees."
      ],
      [
        "When to use a survey",
        "A conversion cannot establish boundaries, usable area or legal title. Check the actual plan and independently verify the extent before comparing property values or preparing a building design."
      ]
    ],
    "checks": [
      "Use the same area unit",
      "Confirm surveyed land extent",
      "Separate total price and price per perch"
    ],
    "links": [
      [
        "Land area converter",
        "/tools/land-converter"
      ],
      [
        "Buying land checklist",
        "/guides/buying-land-sri-lanka"
      ]
    ],
    "sources": [],
    "note": "Standard mathematical conversions; displayed metric values are rounded."
  },
  {
    "slug": "understanding-property-prices-sri-lanka",
    "title": "Understanding Sri Lanka property prices",
    "description": "Learn the difference between asking prices, completed sales and official land valuation indicators when researching Sri Lanka property.",
    "category": "Market intelligence",
    "question": "How should I compare property prices in Sri Lanka?",
    "answer": "Compare similar properties in the same area and distinguish advertised asking prices from completed transaction prices. Normalize by relevant size, condition and property type. Official indicators describe market trends across their stated coverage; they are not individual valuations. Use a qualified valuer where a property-specific assessment is necessary.",
    "sections": [
      [
        "Asking price versus sale price",
        "A listing reflects what a seller asks, not necessarily the amount a buyer eventually pays. Duplicate listings and unusual properties can distort simple averages."
      ],
      [
        "Read official indicators in context",
        "The Central Bank of Sri Lanka publishes a Land Valuation Indicator for Colombo District. Its first-half 2026 release reported a 5.9% year-on-year increase for that indicator, not a nationwide estimate or price per perch. This is a dated example; consult the source for subsequent releases."
      ],
      [
        "Compare like for like",
        "Separate houses, apartments, vacant land and commercial property. Record sample date, geography, property size and source. Do not infer a precise value for an individual home from a broad index."
      ]
    ],
    "checks": [
      "Date and source",
      "Geographic coverage",
      "Asking versus completed sale",
      "Comparable property types",
      "Sample size and outliers"
    ],
    "links": [
      [
        "Explore neighbourhoods",
        "/explore"
      ],
      [
        "Land area converter",
        "/tools/land-converter"
      ],
      [
        "Browse properties",
        "/listings"
      ]
    ],
    "sources": [
      [
        "Central Bank of Sri Lanka — Land Valuation Indicator",
        "https://www.cbsl.gov.lk/en/statistics/economic-indicators/land-valuation-indicator"
      ],
      [
        "Central Bank of Sri Lanka — first half of 2026 release",
        "https://www.cbsl.gov.lk/en/news/land-valuation-indicator-first-half-of-2026"
      ]
    ],
    "note": "Educational interpretation, not a current market quotation, price forecast or valuation."
  },
{
  "slug": "tropical-home-design",
  "title": "Tropical home design in Sri Lanka",
  "description": "A practical architecture guide to daylight, shade, cross-ventilation, rain protection and low-maintenance materials.",
  "category": "Architecture & design",
  "question": "How can I design a comfortable tropical home?",
  "answer": "Start with the site, sun, wind and rain before choosing a floor plan. Use shade, protected openings and ventilation paths where site conditions permit; balance these with privacy, security and maintenance needs.",
  "sections": [
    [
      "Design around the site",
      "Observe the changing sunlight, prevailing winds, neighbouring buildings, road noise and water flow. Discuss orientation and room placement with an architect before finalising a plan."
    ],
    [
      "Plan for shade and air movement",
      "Consider roof overhangs, verandas and external shading. Arrange openings to allow airflow where practical, while addressing insects, rain and security. Keep bedrooms comfortable without assuming natural ventilation is sufficient in every season."
    ],
    [
      "Choose materials for upkeep",
      "Compare material samples for heat exposure, moisture, cleaning and replacement cost. Plan gutters, drainage and accessible maintenance points with your design team."
    ],
    [
      "Make spaces work harder",
      "Use furniture dimensions and actual daily routines to test layouts. A compact plan with useful storage and adaptable rooms may suit a family better than an oversized plan."
    ]
  ],
  "checks": [
    "Site and climate assessment",
    "Daylight and shading plan",
    "Ventilation and privacy",
    "Rainwater and drainage design",
    "Maintenance and materials review"
  ],
  "links": [
    [
      "Build planning checklist",
      "/guides/home-building-checklist"
    ],
    [
      "Land for sale",
      "/properties/land-for-sale"
    ]
  ],
  "sources": [],
  "note": "Editorial planning guidance, not a building specification. Consult a qualified architect and engineer for your site."
},
{
  "slug": "home-building-checklist",
  "title": "Building a house in Sri Lanka: planning checklist",
  "description": "Plan a home build from site feasibility and design to contractor scope, budget and handover.",
  "category": "Build & renovate",
  "question": "Where should I start when planning to build a house?",
  "answer": "Confirm land suitability and access, establish a realistic project budget, and appoint qualified professionals to develop a scope and design. Obtain the applicable approvals before construction and compare written contractor quotations against the same scope.",
  "sections": [
    [
      "Before designing",
      "Gather the land documents, survey and site information. Ask your design team about ground conditions, drainage, services, access and applicable local approval requirements."
    ],
    [
      "Set a complete budget",
      "Separate design and approval costs, site work, structure, finishes, services, landscaping and contingencies. Ask for itemised estimates and clarify inclusions, taxes and exclusions."
    ],
    [
      "Compare contractor proposals",
      "Give bidders the same drawings and scope. Ask about experience, supervision, programme, payment milestones, changes, quality checks and warranties. Record agreed changes in writing."
    ],
    [
      "Prepare for handover",
      "Arrange inspections at appropriate stages. Record incomplete work and defects, and collect drawings, maintenance instructions and applicable completion documentation."
    ]
  ],
  "checks": [
    "Independent land and site review",
    "Qualified design team",
    "Written scope and itemised budget",
    "Applicable approvals",
    "Inspections and handover records"
  ],
  "links": [
    [
      "Buying land",
      "/guides/buying-land-sri-lanka"
    ],
    [
      "Land measurement converter",
      "/tools/land-converter"
    ],
    [
      "Tropical home design",
      "/guides/tropical-home-design"
    ]
  ],
  "sources": [],
  "note": "General project planning, not engineering, regulatory or cost advice. Confirm current requirements with the relevant authority and qualified professionals."
},
{
  "slug": "property-listing-checklist",
  "title": "How to prepare a property listing in Sri Lanka",
  "description": "A clear checklist for owners to prepare accurate property details, photographs, pricing and enquiries.",
  "category": "Property owners",
  "question": "What should I include in a good property listing?",
  "answer": "Describe the property accurately, include current photographs and the asking price and currency, state the rental period if relevant, and provide the general location and important conditions. Keep private documents and sensitive addresses out of public images.",
  "sections": [
    [
      "Prepare the facts",
      "Confirm property type, intended use, floor or land area, room counts, amenities and availability. Distinguish included fixtures from optional items and describe any limitations honestly."
    ],
    [
      "Photograph the actual property",
      "Use daylight and clear, representative photos of rooms, outdoor spaces and access. Avoid misleading filters, stock images or photographs that reveal identity documents, personal belongings or security details."
    ],
    [
      "Set a transparent asking price",
      "Compare like-for-like advertised properties and distinguish asking prices from completed transaction prices. State the currency, period, deposit and any additional charges."
    ],
    [
      "Handle enquiries safely",
      "Keep a record of enquiries and arrange viewings safely. Confirm identities and agreement details independently before accepting payments. Remove or update listings when availability changes."
    ]
  ],
  "checks": [
    "Accurate property type and dimensions",
    "Current photos",
    "Transparent asking price and period",
    "General location without private details",
    "Current availability"
  ],
  "links": [
    [
      "List a property",
      "/host/apply"
    ],
    [
      "Compare properties",
      "/compare"
    ],
    [
      "Rental guide",
      "/guides/renting-home-sri-lanka"
    ]
  ],
  "sources": [],
  "note": "Editorial guidance; publishing does not imply title verification or a guarantee of availability."
}
];
export const guideReviewed='2026-11-27';
