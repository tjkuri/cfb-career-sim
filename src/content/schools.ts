// Tier 4 = national contenders, 3 = power conference, 2 = Group of 5, 1 = FCS.
// Tiers are assigned by real program stature; empty region x tier cells are then
// backfilled with the most defensible real program available. Conferences and
// states are factual. Balance-tunable in Stage 4.
export const SCHOOLS: { id: string; name: string; tier: 1 | 2 | 3 | 4; conference: string; state: string }[] = [
  // Tier 4 — national contenders
  { id: "bama", name: "Alabama", tier: 4, conference: "SEC", state: "AL" },
  { id: "uga", name: "Georgia", tier: 4, conference: "SEC", state: "GA" },
  { id: "osu", name: "Ohio State", tier: 4, conference: "Big Ten", state: "OH" },
  { id: "texas", name: "Texas", tier: 4, conference: "SEC", state: "TX" },
  { id: "michigan", name: "Michigan", tier: 4, conference: "Big Ten", state: "MI" },
  { id: "oregon", name: "Oregon", tier: 4, conference: "Big Ten", state: "OR" },
  { id: "notredame", name: "Notre Dame", tier: 4, conference: "Independent", state: "IN" },
  { id: "lsu", name: "LSU", tier: 4, conference: "SEC", state: "LA" },
  { id: "pennstate", name: "Penn State", tier: 4, conference: "Big Ten", state: "PA" },

  // Tier 3 — power conference
  { id: "smu", name: "SMU", tier: 3, conference: "ACC", state: "TX" },
  { id: "tcu", name: "TCU", tier: 3, conference: "Big 12", state: "TX" },
  { id: "baylor", name: "Baylor", tier: 3, conference: "Big 12", state: "TX" },
  { id: "ksu", name: "Kansas State", tier: 3, conference: "Big 12", state: "KS" },
  { id: "iowastate", name: "Iowa State", tier: 3, conference: "Big 12", state: "IA" },
  { id: "mizzou", name: "Missouri", tier: 3, conference: "SEC", state: "MO" },
  { id: "wisconsin", name: "Wisconsin", tier: 3, conference: "Big Ten", state: "WI" },
  { id: "olemiss", name: "Ole Miss", tier: 3, conference: "SEC", state: "MS" },
  { id: "florida", name: "Florida", tier: 3, conference: "SEC", state: "FL" },
  { id: "miami", name: "Miami", tier: 3, conference: "ACC", state: "FL" },
  { id: "ncstate", name: "NC State", tier: 3, conference: "ACC", state: "NC" },
  { id: "louisville", name: "Louisville", tier: 3, conference: "ACC", state: "KY" },
  { id: "vatech", name: "Virginia Tech", tier: 3, conference: "ACC", state: "VA" },
  { id: "pitt", name: "Pittsburgh", tier: 3, conference: "ACC", state: "PA" },
  { id: "washington", name: "Washington", tier: 3, conference: "Big Ten", state: "WA" },
  { id: "arizona", name: "Arizona", tier: 3, conference: "Big 12", state: "AZ" },
  { id: "ucla", name: "UCLA", tier: 3, conference: "Big Ten", state: "CA" },

  // Tier 2 — Group of 5
  { id: "boise", name: "Boise State", tier: 2, conference: "Pac-12", state: "ID" },
  { id: "fresno", name: "Fresno State", tier: 2, conference: "Pac-12", state: "CA" },
  { id: "sdsu", name: "San Diego State", tier: 2, conference: "Pac-12", state: "CA" },
  { id: "unt", name: "North Texas", tier: 2, conference: "American", state: "TX" },
  { id: "utsa", name: "UTSA", tier: 2, conference: "American", state: "TX" },
  { id: "memphis", name: "Memphis", tier: 2, conference: "American", state: "TN" },
  { id: "tulane", name: "Tulane", tier: 2, conference: "American", state: "LA" },
  { id: "usf", name: "South Florida", tier: 2, conference: "American", state: "FL" },
  { id: "fau", name: "Florida Atlantic", tier: 2, conference: "American", state: "FL" },
  { id: "temple", name: "Temple", tier: 2, conference: "American", state: "PA" },
  { id: "app", name: "App State", tier: 2, conference: "Sun Belt", state: "NC" },
  { id: "coastal", name: "Coastal Carolina", tier: 2, conference: "Sun Belt", state: "SC" },
  { id: "gasouthern", name: "Georgia Southern", tier: 2, conference: "Sun Belt", state: "GA" },
  { id: "gastate", name: "Georgia State", tier: 2, conference: "Sun Belt", state: "GA" },
  { id: "jmu", name: "James Madison", tier: 2, conference: "Sun Belt", state: "VA" },
  { id: "toledo", name: "Toledo", tier: 2, conference: "MAC", state: "OH" },
  { id: "ohiou", name: "Ohio", tier: 2, conference: "MAC", state: "OH" },
  { id: "liberty", name: "Liberty", tier: 2, conference: "Conference USA", state: "VA" },

  // Tier 1 — FCS
  { id: "mont", name: "Montana", tier: 1, conference: "Big Sky", state: "MT" },
  { id: "ewu", name: "Eastern Washington", tier: 1, conference: "Big Sky", state: "WA" },
  { id: "sacst", name: "Sacramento State", tier: 1, conference: "Big Sky", state: "CA" },
  { id: "ucdavis", name: "UC Davis", tier: 1, conference: "Big Sky", state: "CA" },
  { id: "ndsu", name: "North Dakota State", tier: 1, conference: "MVFC", state: "ND" },
  { id: "ysu", name: "Youngstown State", tier: 1, conference: "MVFC", state: "OH" },
  { id: "dayton", name: "Dayton", tier: 1, conference: "Pioneer", state: "OH" },
  { id: "villanova", name: "Villanova", tier: 1, conference: "CAA", state: "PA" },
  { id: "uiw", name: "Incarnate Word", tier: 1, conference: "Southland", state: "TX" },
  { id: "sfa", name: "Stephen F. Austin", tier: 1, conference: "Southland", state: "TX" },
  { id: "famu", name: "Florida A&M", tier: 1, conference: "SWAC", state: "FL" },
  { id: "bcu", name: "Bethune-Cookman", tier: 1, conference: "SWAC", state: "FL" },
  // Georgia's only plausible FCS program — the two-per-state rule yields to
  // realism here rather than inventing a second (see the spec's §4).
  { id: "mercer", name: "Mercer", tier: 1, conference: "SoCon", state: "GA" },
];
