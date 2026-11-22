export type TransitModeFilter = 'all' | 'bus' | 'rail';

export interface TransitOperator {
  id: string;
  mode: Exclude<TransitModeFilter, 'all'>;
  modeLabel: string;
  name: string;
  authority: string;
  coverageSummary: string;
  majorRoutes: string[];
  paymentAndFares: string;
  officialUrl: string;
  officialSiteLabel: string;
  verifyPrompt: string;
}

export const JOZI_TRANSIT_OPERATORS: TransitOperator[] = [
  {
    id: 'rea-vaya',
    mode: 'bus',
    modeLabel: 'Bus Rapid Transit (BRT)',
    name: 'Rea Vaya',
    authority: 'City of Johannesburg',
    coverageSummary:
      'Dedicated bus lanes connecting Soweto, Johannesburg CBD, Braamfontein, Parktown, and Auckland Park.',
    majorRoutes: [
      'T1 Trunk: Thokoza Park (Soweto) ↔ Ellis Park / CBD via Orlando & Parktown',
      'T2 Trunk: Thokoza Park ↔ Ellis Park via Noordgesig',
      'T3 Trunk: Thokoza Park ↔ Library Gardens (CBD)',
      'Complementary (C1–C6): CBD, Yeoville, Parktown, Auckland Park, and Braamfontein loops',
      'Feeders (F1–F12): Local Soweto & Westbury feeder connections into trunk stations',
    ],
    paymentAndFares:
      'Tap-in/tap-out with a Rea Vaya Smartcard (or compatible contactless bank card where enabled). Fares are distance-banded; check official tariff notices before loading.',
    officialUrl: 'https://www.reavaya.org.za/',
    officialSiteLabel: 'reavaya.org.za',
    verifyPrompt:
      'What are the latest Rea Vaya bus routes, operating hours, and current smartcard fares in Johannesburg?',
  },
  {
    id: 'putco',
    mode: 'bus',
    modeLabel: 'Regional Commuter Bus',
    name: 'Putco',
    authority: 'Putco Limited',
    coverageSummary:
      'Long-running commuter bus network linking Johannesburg CBD and townships with northern and southern Gauteng corridors.',
    majorRoutes: [
      'Soweto, Eldorado Park & Orange Farm ↔ Johannesburg CBD commuter corridors',
      'Midrand, Ivory Park & Diepsloot ↔ Johannesburg / Pretoria links',
      'Cross-metro routes connecting Johannesburg with Tembisa, Tshwane (Pretoria), and the Vaal',
    ],
    paymentAndFares:
      'Uses Putco smartcard / multi-journey tags (weekly and monthly commuter options) alongside selected single-trip tickets; exact fares depend on origin-destination zone.',
    officialUrl: 'https://www.putco.co.za/',
    officialSiteLabel: 'putco.co.za',
    verifyPrompt:
      'How do I check current Putco bus schedules, smartcard outlets, and fares for my Johannesburg corridor?',
  },
  {
    id: 'metrobus',
    mode: 'bus',
    modeLabel: 'Municipal Scheduled Bus',
    name: 'Metrobus',
    authority: 'City of Johannesburg',
    coverageSummary:
      'Scheduled municipal buses radiating from Gandhi Square (CBD) across northern, western, and southern suburbs.',
    majorRoutes: [
      'Northern Suburbs: CBD (Gandhi Square) ↔ Rosebank, Sandton, Randburg & Sunninghill',
      'Western & Southern Suburbs: CBD ↔ Roodepoort, Florida, Southgate & Mondeor',
      'Dedicated peak-hour express and school-term commuter trips',
    ],
    paymentAndFares:
      'Requires a Metrobus Tag smartcard loaded at Gandhi Square or approved outlets. Fares vary by zone stage and concession category (scholar/pensioner).',
    officialUrl: 'https://www.mbus.joburg.org.za/',
    officialSiteLabel: 'mbus.joburg.org.za',
    verifyPrompt:
      'What are the current Metrobus routes from Gandhi Square, tag card fees, and updated timetables in Johannesburg?',
  },
  {
    id: 'gautrain',
    mode: 'rail',
    modeLabel: 'Rapid Rail & Feeder Bus',
    name: 'Gautrain',
    authority: 'Gautrain Management Agency',
    coverageSummary:
      'High-speed commuter rail and integrated station feeder buses linking Johannesburg CBD, northern suburbs, OR Tambo Airport, and Pretoria.',
    majorRoutes: [
      'North–South Line: Park Station (CBD) ↔ Rosebank ↔ Sandton ↔ Marlboro ↔ Midrand ↔ Centurion ↔ Pretoria ↔ Hatfield',
      'East–West / Airport Line: Sandton ↔ Marlboro ↔ Rhodesfield ↔ OR Tambo International Airport',
      'Gautrain Feeder Buses: Short-loop bus routes connecting Sandton, Rosebank, Midrand, and Park stations to nearby business & residential nodes',
    ],
    paymentAndFares:
      'Tap in and tap out using a Gautrain Card or contactless EMV bank card/mobile wallet. Peak and off-peak fares differ by station pair; airport trips carry a dedicated tariff.',
    officialUrl: 'https://www.gautrain.co.za/',
    officialSiteLabel: 'gautrain.co.za',
    verifyPrompt:
      'What are the current Gautrain train and feeder bus schedules and peak/off-peak fares in Johannesburg?',
  },
  {
    id: 'metrorail',
    mode: 'rail',
    modeLabel: 'Commuter Passenger Rail',
    name: 'Metrorail Gauteng',
    authority: 'PRASA (Passenger Rail Agency of SA)',
    coverageSummary:
      'Regional commuter rail lines radiating from Johannesburg Park Station across Soweto, West Rand, East Rand, and Vereeniging.',
    majorRoutes: [
      'Soweto / Naledi Corridor: Johannesburg Park Station ↔ New Canada ↔ Orlando ↔ Naledi',
      'East Rand Corridors: Johannesburg ↔ Germiston ↔ Springs / Daveyton / Leralla',
      'West Rand Corridor: Johannesburg ↔ Roodepoort ↔ Krugersdorp ↔ Randfontein',
      'Southern & Northern Corridors: Johannesburg ↔ Vereeniging; Johannesburg ↔ Pretoria (via Germiston/Kempton Park)',
    ],
    paymentAndFares:
      'Single, return, weekly, and monthly tickets sold at operational station ticket offices. Corridor availability and operating frequencies vary due to ongoing rail recovery—always verify active lines first.',
    officialUrl: 'https://www.prasa.com/',
    officialSiteLabel: 'prasa.com',
    verifyPrompt:
      'Which Metrorail Gauteng train lines from Johannesburg Park Station are currently operational, and what are the latest timetables and fares?',
  },
];

export const TRANSIT_VERIFICATION_STEPS = [
  {
    title: '01. Check the official operator portal before you travel',
    detail:
      'Timetables, route detours, and rail corridor statuses change for maintenance, load-shedding, or public holidays. Confirm live service alerts directly on Gautrain, Rea Vaya, Metrobus, Putco, or PRASA portals.',
  },
  {
    title: '02. Verify exact Rand fares and smartcard rules via live search',
    detail:
      'Tariffs adjust annually and differ by distance band, peak/off-peak window, and smartcard vs single-ticket purchase. Never rely on unverified or outdated fare charts.',
  },
  {
    title: '03. Confirm first/last departures and feeder transfers',
    detail:
      'For multi-leg commutes (for example, Rea Vaya feeder into Gautrain or Metrobus at Gandhi Square), verify last-bus and last-train departure times for weekdays, Saturdays, and Sundays.',
  },
];
