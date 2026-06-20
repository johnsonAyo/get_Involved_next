export type ElectionFeedAnchor = {
  state: string;
  stateSlug: string;
  lga: string;
  ward: string;
  pollingUnitCode: string;
  pollingUnitName: string;
};

export type ElectionFeedMessage = {
  id: string;
  poster: string;
  postedAt: string;
  anchor: ElectionFeedAnchor;
  text: string;
  tags: string[];
};

export type ElectionFeedStateOption = {
  value: string;
  label: string;
};

export type ElectionFeedLgaOption = {
  value: string;
  label: string;
};

export type ElectionFeedWardOption = {
  value: string;
  label: string;
};

export type ElectionFeedPollingUnitOption = {
  value: string;
  label: string;
};

export type ElectionFeedFilters = {
  state: string;
  lga: string;
  ward: string;
  pollingUnit: string;
};

export const ACTIVE_ELECTION = {
  state: "Ekiti State",
  stateSlug: "ekiti",
  type: "Governorship Election",
  date: "20 June 2026",
} as const;

export const CIVIC_TEMPLATES: { text: string; tags: string[] }[] = [
  {
    text: "Accreditation opened on time. Voters in queue are mostly elderly.",
    tags: ["#accreditation"],
  },
  {
    text: "INEC officer just confirmed serial numbers on the card reader. Voting starts in a moment.",
    tags: ["#card-reader", "#ongoing"],
  },
  {
    text: "Queue moved about 20 steps in the last few minutes. Pace is steady.",
    tags: ["#queue", "#flow"],
  },
  {
    text: "Heavy rain just started — turnout may dip into the afternoon.",
    tags: ["#weather"],
  },
  {
    text: "Two voters were turned away for arriving without PVC. Reminder for tomorrow.",
    tags: ["#pvc"],
  },
  {
    text: "Card reader reset, then came back online. Voting has resumed.",
    tags: ["#card-reader", "#delay"],
  },
  {
    text: "Ballot papers reportedly short by a small margin. INEC officer requesting backup.",
    tags: ["#ballot-papers", "#supply"],
  },
  {
    text: "Peaceful and orderly so far. No incidences reported in this unit.",
    tags: ["#calm"],
  },
  {
    text: "Security personnel present. Crowd calm. Accreditation ongoing.",
    tags: ["#security"],
  },
  {
    text: "Slow queue at this unit. Voters waiting under shade. Atmosphere relaxed.",
    tags: ["#queue"],
  },
];

export const POSTER_HANDLES = [
  "Aisha B.",
  "Tunde O.",
  "Ngozi E.",
  "Femi A.",
  "Bukola S.",
  "Chidi M.",
  "Halima Y.",
  "Olusegun K.",
  "Ifeanyi D.",
  "Zainab R.",
  "Adaeze N.",
  "Babatunde I.",
  "Hadiza G.",
  "Folake P.",
];

export const INITIAL_MESSAGES: ElectionFeedMessage[] = [
  {
    id: "seed-001",
    poster: "Aisha B.",
    postedAt: "2026-06-20T07:14:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Awka South",
      ward: "Amawbia",
      pollingUnitCode: "014",
      pollingUnitName: "Amawbia Town Hall",
    },
    text: "Queue already forming before 7am. Card reader just switched on; INEC officials doing serial number verification.",
    tags: ["#queue", "#card-reader"],
  },
  {
    id: "seed-002",
    poster: "Tunde O.",
    postedAt: "2026-06-20T07:21:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Awka South",
      ward: "Amawbia",
      pollingUnitCode: "014",
      pollingUnitName: "Amawbia Town Hall",
    },
    text: "Voting started 14 minutes behind schedule. Officials apologised to the queue.",
    tags: ["#delay", "#started-late"],
  },
  {
    id: "seed-003",
    poster: "Ngozi E.",
    postedAt: "2026-06-20T07:28:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Onitsha North",
      ward: "Onitsha Urban I",
      pollingUnitCode: "022",
      pollingUnitName: "Onitsha Main Market Open Square",
    },
    text: "Crowd much larger here than last cycle. PVC verification ongoing.",
    tags: ["#turnout", "#accreditation"],
  },
  {
    id: "seed-004",
    poster: "Femi A.",
    postedAt: "2026-06-20T07:33:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Onitsha North",
      ward: "Onitsha Urban I",
      pollingUnitCode: "022",
      pollingUnitName: "Onitsha Main Market Open Square",
    },
    text: "Card reader took a moment, then reconnected. Voting has been steady since.",
    tags: ["#card-reader"],
  },
  {
    id: "seed-005",
    poster: "Bukola S.",
    postedAt: "2026-06-20T07:38:00Z",
    anchor: {
      state: "Imo",
      stateSlug: "imo",
      lga: "Ideato North",
      ward: "Onicha Mbaise",
      pollingUnitCode: "014",
      pollingUnitName: "Onicha Mbaise Community Hall",
    },
    text: "Peaceful and orderly so far. Security personnel present at all entries.",
    tags: ["#calm", "#security"],
  },
  {
    id: "seed-006",
    poster: "Chidi M.",
    postedAt: "2026-06-20T07:44:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Nnewi North",
      ward: "Nnewi-Ichi",
      pollingUnitCode: "007",
      pollingUnitName: "Nnewi-Ichi Civic Centre",
    },
    text: "Two voters turned away — no PVC. Officials explaining transfer process aloud.",
    tags: ["#pvc"],
  },
  {
    id: "seed-007",
    poster: "Halima Y.",
    postedAt: "2026-06-20T07:51:00Z",
    anchor: {
      state: "Edo",
      stateSlug: "edo",
      lga: "Oredo",
      ward: "GRA",
      pollingUnitCode: "033",
      pollingUnitName: "GRA Primary School",
    },
    text: "Voting underway. Voters moving briskly through the line.",
    tags: ["#ongoing", "#flow"],
  },
  {
    id: "seed-008",
    poster: "Olusegun K.",
    postedAt: "2026-06-20T07:56:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Awka South",
      ward: "Amawbia",
      pollingUnitCode: "014",
      pollingUnitName: "Amawbia Town Hall",
    },
    text: "Queue now moving steadily. Roughly a dozen voters cleared in five minutes.",
    tags: ["#flow"],
  },
  {
    id: "seed-009",
    poster: "Ifeanyi D.",
    postedAt: "2026-06-20T08:02:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Oyi",
      ward: "Nteje",
      pollingUnitCode: "009",
      pollingUnitName: "Nteje Town Hall",
    },
    text: "Heavy rain beginning. Officials moved queue under the canopy.",
    tags: ["#weather"],
  },
  {
    id: "seed-010",
    poster: "Zainab R.",
    postedAt: "2026-06-20T08:07:00Z",
    anchor: {
      state: "Imo",
      stateSlug: "imo",
      lga: "Ideato North",
      ward: "Onicha Mbaise",
      pollingUnitCode: "014",
      pollingUnitName: "Onicha Mbaise Community Hall",
    },
    text: "Independence observers arrived. Showing accreditation tags to the officer.",
    tags: ["#observers"],
  },
  {
    id: "seed-011",
    poster: "Adaeze N.",
    postedAt: "2026-06-20T08:14:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Onitsha North",
      ward: "Onitsha Urban II",
      pollingUnitCode: "018",
      pollingUnitName: "Onitsha Urban School",
    },
    text: "Ballot box opened in full public view. Sealed with the INEC serial tag.",
    tags: ["#ballot", "#sealing"],
  },
  {
    id: "seed-012",
    poster: "Babatunde I.",
    postedAt: "2026-06-20T08:20:00Z",
    anchor: {
      state: "Edo",
      stateSlug: "edo",
      lga: "Egor",
      ward: "Uselu",
      pollingUnitCode: "011",
      pollingUnitName: "Uselu Primary School",
    },
    text: "Peaceful atmosphere. No incidents. Security presence is calm.",
    tags: ["#calm"],
  },
  {
    id: "seed-013",
    poster: "Hadiza G.",
    postedAt: "2026-06-20T08:27:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Nnewi North",
      ward: "Nnewi-Ichi",
      pollingUnitCode: "007",
      pollingUnitName: "Nnewi-Ichi Civic Centre",
    },
    text: "Queue now over 80 deep. Officials requesting additional voting cubicles.",
    tags: ["#queue", "#logistics"],
  },
  {
    id: "seed-014",
    poster: "Folake P.",
    postedAt: "2026-06-20T08:34:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Awka South",
      ward: "Umuawulu",
      pollingUnitCode: "005",
      pollingUnitName: "Umuawulu Health Centre",
    },
    text: "Voting pace brisk. INEC officer recording accreditation count into the log.",
    tags: ["#accreditation"],
  },
  {
    id: "seed-015",
    poster: "Aisha B.",
    postedAt: "2026-06-20T08:40:00Z",
    anchor: {
      state: "Imo",
      stateSlug: "imo",
      lga: "Owerri Municipal",
      ward: "Owerri Central",
      pollingUnitCode: "021",
      pollingUnitName: "Owerri Township Hall",
    },
    text: "Officials opened the unit an hour ago. Steady pace so far.",
    tags: ["#started-on-time"],
  },
  {
    id: "seed-016",
    poster: "Tunde O.",
    postedAt: "2026-06-20T08:46:00Z",
    anchor: {
      state: "Edo",
      stateSlug: "edo",
      lga: "Oredo",
      ward: "GRA",
      pollingUnitCode: "033",
      pollingUnitName: "GRA Primary School",
    },
    text: "Voters applauding the orderly process. Calm, friendly queues.",
    tags: ["#calm"],
  },
  {
    id: "seed-017",
    poster: "Ngozi E.",
    postedAt: "2026-06-20T08:52:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Oyi",
      ward: "Nteje",
      pollingUnitCode: "009",
      pollingUnitName: "Nteje Town Hall",
    },
    text: "Rain easing. Voters returning to the line after brief shelter.",
    tags: ["#weather", "#returning"],
  },
  {
    id: "seed-018",
    poster: "Femi A.",
    postedAt: "2026-06-20T08:59:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Onitsha North",
      ward: "Onitsha Urban I",
      pollingUnitCode: "022",
      pollingUnitName: "Onitsha Main Market Open Square",
    },
    text: "Card reader briefly offline. Resolved within minutes.",
    tags: ["#card-reader"],
  },
  {
    id: "seed-019",
    poster: "Bukola S.",
    postedAt: "2026-06-20T09:05:00Z",
    anchor: {
      state: "Imo",
      stateSlug: "imo",
      lga: "Ideato North",
      ward: "Onicha Mbaise",
      pollingUnitCode: "014",
      pollingUnitName: "Onicha Mbaise Community Hall",
    },
    text: "Voters commenting on how smooth this unit is vs last cycle.",
    tags: ["#flow"],
  },
  {
    id: "seed-020",
    poster: "Chidi M.",
    postedAt: "2026-06-20T09:11:00Z",
    anchor: {
      state: "Edo",
      stateSlug: "edo",
      lga: "Egor",
      ward: "Uselu",
      pollingUnitCode: "011",
      pollingUnitName: "Uselu Primary School",
    },
    text: "Officials reading out instructions in three local languages. Helpful.",
    tags: ["#outreach"],
  },
  {
    id: "seed-021",
    poster: "Halima Y.",
    postedAt: "2026-06-20T09:18:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Awka South",
      ward: "Amawbia",
      pollingUnitCode: "014",
      pollingUnitName: "Amawbia Town Hall",
    },
    text: "Officials requested backup ballot papers. Backup arrived twenty minutes later.",
    tags: ["#supply", "#delay"],
  },
  {
    id: "seed-022",
    poster: "Olusegun K.",
    postedAt: "2026-06-20T09:24:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Nnewi North",
      ward: "Nnewi-Ichi",
      pollingUnitCode: "007",
      pollingUnitName: "Nnewi-Ichi Civic Centre",
    },
    text: "Queue now over 150. Officials opened the second voting cubicle.",
    tags: ["#queue", "#logistics"],
  },
  {
    id: "seed-023",
    poster: "Ifeanyi D.",
    postedAt: "2026-06-20T09:31:00Z",
    anchor: {
      state: "Imo",
      stateSlug: "imo",
      lga: "Owerri Municipal",
      ward: "Owerri Central",
      pollingUnitCode: "021",
      pollingUnitName: "Owerri Township Hall",
    },
    text: "Voter turnout strong at this unit. Calm atmosphere.",
    tags: ["#turnout", "#calm"],
  },
  {
    id: "seed-024",
    poster: "Zainab R.",
    postedAt: "2026-06-20T09:38:00Z",
    anchor: {
      state: "Anambra",
      stateSlug: "anambra",
      lga: "Oyi",
      ward: "Nteje",
      pollingUnitCode: "009",
      pollingUnitName: "Nteje Town Hall",
    },
    text: "Brief delay while officials replaced a printer ribbon. Resumed quickly.",
    tags: ["#logistics"],
  },
];
