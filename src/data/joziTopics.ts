export type CommunityCategory =
  | 'all'
  | 'utilities'
  | 'civic'
  | 'transit'
  | 'budgeting';

export type DirectoryFilterCategory =
  | 'all'
  | 'plumbing'
  | 'electrical'
  | 'handyman'
  | 'municipal';

export interface JoziSuburbOption {
  id: string;
  label: string;
  region: string;
}

export interface StarterTopic {
  id: string;
  category: Exclude<CommunityCategory, 'all'>;
  categoryLabel: string;
  title: string;
  prompt: string;
  summary: string;
}

export interface LocalServiceItem {
  id: string;
  directoryCategory: Exclude<DirectoryFilterCategory, 'all'>;
  assistantCategory: Exclude<CommunityCategory, 'all'>;
  categoryLabel: string;
  name: string;
  scope: string;
  description: string;
  contactGuidance: string;
  officialRegistryUrl?: string;
  officialRegistryLabel?: string;
  supportsReviewsPlaceholder: boolean;
  promptTemplate: string;
}

export const JOZI_SUBURBS: JoziSuburbOption[] = [
  { id: 'unspecified', label: 'Not specified (ask me first)', region: 'Johannesburg' },
  { id: 'soweto', label: 'Soweto', region: 'Region D' },
  { id: 'cbd-braamfontein', label: 'CBD & Braamfontein', region: 'Region F' },
  { id: 'sandton', label: 'Sandton', region: 'Region E' },
  { id: 'randburg', label: 'Randburg', region: 'Region B' },
  { id: 'roodepoort', label: 'Roodepoort', region: 'Region C' },
  { id: 'midrand', label: 'Midrand', region: 'Region A' },
  { id: 'alexandra', label: 'Alexandra', region: 'Region E' },
  { id: 'rosebank-melville', label: 'Rosebank & Melville', region: 'Region B / E' },
  { id: 'joburg-south', label: 'Johannesburg South', region: 'Region F / G' },
];

export const CATEGORY_LABELS: Record<CommunityCategory, string> = {
  all: 'All Topics',
  utilities: 'Utilities & Power',
  civic: 'Clinics & Civic',
  transit: 'Transit & Logistics',
  budgeting: 'Household Budget',
};

export const DIRECTORY_FILTER_LABELS: Record<DirectoryFilterCategory, string> = {
  all: 'All Services',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  handyman: 'Handyman',
  municipal: 'Municipal & Civic',
};

export const STARTER_TOPICS: StarterTopic[] = [
  {
    id: 'starter-clinic-hours',
    category: 'civic',
    categoryLabel: 'Clinics & Civic',
    title: 'Check public clinic or Home Affairs hours',
    prompt: 'What are the current opening hours for a public clinic or Home Affairs office near me?',
    summary: 'Live-verified hours and what documents to bring.',
  },
  {
    id: 'starter-power-water',
    category: 'utilities',
    categoryLabel: 'Utilities & Power',
    title: 'Report a power or water outage',
    prompt: 'How do I check current City Power or Johannesburg Water outages and log a reference number?',
    summary: 'Official fault channels and outage lookup steps.',
  },
  {
    id: 'starter-transit-fare',
    category: 'transit',
    categoryLabel: 'Transit & Logistics',
    title: 'Compare Rea Vaya, Metrobus, and Gautrain fares',
    prompt: 'What is the most affordable daily commute option between suburbs in Johannesburg right now?',
    summary: 'Current routes, card fees, and peak schedules.',
  },
  {
    id: 'starter-budget-plan',
    category: 'budgeting',
    categoryLabel: 'Household Budget',
    title: 'Plan a monthly Jozi grocery and prepaid electricity budget',
    prompt: 'Help me plan a practical monthly grocery and prepaid electricity budget for Johannesburg.',
    summary: 'Tariff steps, bulk saving tips, and monthly breakdown.',
  },
];

export const LOCAL_SERVICES_DIRECTORY: LocalServiceItem[] = [
  {
    id: 'svc-plumbing',
    directoryCategory: 'plumbing',
    assistantCategory: 'utilities',
    categoryLabel: 'Plumbing Services',
    name: 'PIRB-Registered Plumbers & Geyser Specialists',
    scope: 'Burst pipes · Blocked drains · Geyser CoCs',
    description:
      'Licensed plumbing cover for leak detection, geyser replacements, pressure-valve repairs, and Certificates of Compliance (CoC) for Johannesburg homes.',
    contactGuidance:
      'Public contact details vary by suburb. Verify licensed providers and publicly listed business numbers via the Plumbing Industry Registration Board (PIRB) or live search.',
    officialRegistryUrl: 'https://www.pirb.co.za/',
    officialRegistryLabel: 'Verify on pirb.co.za',
    supportsReviewsPlaceholder: true,
    promptTemplate:
      'Find publicly listed, PIRB-registered plumbing services and typical call-out fee guidance in my Johannesburg area, and verify their public contact channels via live search.',
  },
  {
    id: 'svc-electrical',
    directoryCategory: 'electrical',
    assistantCategory: 'utilities',
    categoryLabel: 'Electrical Services',
    name: 'Registered Electricians & CoC Inspectors',
    scope: 'DB boards · Earth leakage · Prepaid & solar tie-ins',
    description:
      'Qualified electrical contractors for tripping circuit breakers, inverter/UPS changeover switches, fault-finding, and electrical Certificates of Compliance.',
    contactGuidance:
      'Confirm Department of Labour wireman registration and publicly listed contact details through the Electrical Contractors Association (ECA SA) or live search.',
    officialRegistryUrl: 'https://www.ecasa.co.za/',
    officialRegistryLabel: 'Verify on ecasa.co.za',
    supportsReviewsPlaceholder: true,
    promptTemplate:
      'Find publicly listed, registered electrical contractors or ECA(SA) electricians in my Johannesburg area and verify their public contact info and call-out expectations via live search.',
  },
  {
    id: 'svc-handyman',
    directoryCategory: 'handyman',
    assistantCategory: 'utilities',
    categoryLabel: 'Handyman Services',
    name: 'General Handyman & Home Maintenance',
    scope: 'Carpentry · Painting · Locks, gates & waterproofing',
    description:
      'Everyday home upkeep including door/window repairs, roof waterproofing, tiling touch-ups, security gate hinges, and small household installations.',
    contactGuidance:
      'No single municipal registry exists for general handymen—verify publicly available business contacts, recent reviews, and written quotes via live search before paying any deposit.',
    supportsReviewsPlaceholder: true,
    promptTemplate:
      'Search for established, publicly listed handyman services in my Johannesburg suburb with verifiable contact info and share steps to vet quotes safely.',
  },
  {
    id: 'svc-gas-appliance',
    directoryCategory: 'handyman',
    assistantCategory: 'utilities',
    categoryLabel: 'Gas & Appliance Repairs',
    name: 'LPGSASA Gas Installers & Appliance Technicians',
    scope: 'Gas hobs · Stove & fridge repairs · Gas CoCs',
    description:
      'Certified gas appliance installations, safety inspections, and repairs for fridges, washing machines, and electric or gas stoves.',
    contactGuidance:
      'Verify gas installer registration and publicly available contact details via the Liquefied Petroleum Gas Association of SA (LPGSASA) or live search.',
    officialRegistryUrl: 'https://www.lpgas.co.za/',
    officialRegistryLabel: 'Verify on lpgas.co.za',
    supportsReviewsPlaceholder: true,
    promptTemplate:
      'Verify publicly listed LPGSASA-registered gas installers or appliance repair services in my Johannesburg area using live search.',
  },
  {
    id: 'svc-city-power',
    directoryCategory: 'municipal',
    assistantCategory: 'utilities',
    categoryLabel: 'Municipal & Civic',
    name: 'City Power & Eskom Johannesburg',
    scope: 'Electricity outages · Prepaid tariffs',
    description:
      'Check area outage schedules, prepaid meter block tariffs, and official municipal fault logging channels.',
    contactGuidance:
      'Use official City Power or Eskom fault-reporting channels; verify current call-centre numbers and WhatsApp lines via live search.',
    officialRegistryUrl: 'https://www.citypower.co.za/',
    officialRegistryLabel: 'citypower.co.za',
    supportsReviewsPlaceholder: true,
    promptTemplate:
      'What are the official City Power fault reporting contacts and current prepaid electricity tariff blocks for my area?',
  },
  {
    id: 'svc-joburg-water',
    directoryCategory: 'municipal',
    assistantCategory: 'utilities',
    categoryLabel: 'Municipal & Civic',
    name: 'Johannesburg Water & Pikitup',
    scope: 'Water supply · Refuse collection',
    description:
      'Verify planned water maintenance notices, mobile water tanker updates, burst main reporting, and weekly Pikitup refuse schedules.',
    contactGuidance:
      'Verify official Johannesburg Water and Pikitup customer service numbers and live outage bulletins before reporting.',
    officialRegistryUrl: 'https://www.johannesburgwater.co.za/',
    officialRegistryLabel: 'johannesburgwater.co.za',
    supportsReviewsPlaceholder: true,
    promptTemplate:
      'How do I check Johannesburg Water planned maintenance, official fault contact info, and Pikitup refuse schedules for my suburb?',
  },
  {
    id: 'svc-clinics',
    directoryCategory: 'municipal',
    assistantCategory: 'civic',
    categoryLabel: 'Municipal & Civic',
    name: 'City of Joburg Primary Clinics & Home Affairs',
    scope: 'Primary healthcare · Smart IDs & Passports',
    description:
      'Verify municipal clinic opening hours, chronic medication pickup guidance, and Home Affairs BABS booking rules.',
    contactGuidance:
      'Clinic and Home Affairs hours vary by branch; verify current operating times and official contact numbers via live search.',
    officialRegistryUrl: 'https://www.joburg.org.za/',
    officialRegistryLabel: 'joburg.org.za',
    supportsReviewsPlaceholder: true,
    promptTemplate:
      'Can you check current operating hours and official contact info for City of Johannesburg clinics or Home Affairs branches in my suburb?',
  },
  {
    id: 'svc-budgeting',
    directoryCategory: 'municipal',
    assistantCategory: 'budgeting',
    categoryLabel: 'Municipal & Civic',
    name: 'CoJ Rates Rebates & Indigent Support (ESP)',
    scope: 'Household relief · Utility budgeting',
    description:
      'Understand Expanded Social Package (ESP) eligibility criteria, municipal rates rebates, and prepaid electricity saving habits.',
    contactGuidance:
      'Verify latest City of Johannesburg ESP income thresholds and municipal customer service centre hours via live search.',
    officialRegistryUrl: 'https://www.joburg.org.za/',
    officialRegistryLabel: 'joburg.org.za',
    supportsReviewsPlaceholder: true,
    promptTemplate:
      'How does the City of Johannesburg Expanded Social Package (ESP) rebate work and what are the latest income thresholds and centre hours?',
  },
];
