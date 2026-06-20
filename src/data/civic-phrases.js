

export const CIVIC_SUMMARIES = [
  // Queue flow
  {
    id: "queue-slow",
    summary: "the queue is slow",
    keywords: ["queue slow", "long queue", "queue moving slowly", "long wait", "queue stalled", "slow queue", "in line slow", "queue not moving"],
  },
  {
    id: "queue-fast",
    summary: "the queue is moving fast",
    keywords: ["queue fast", "queue moving", "line moving", "quick line", "flowing fast", "no wait"],
  },
  {
    id: "queue-organized",
    summary: "the queue is well organized",
    keywords: ["organized queue", "well organized", "tidy queue", "in order", "orderly queue"],
  },

  // Card reader
  {
    id: "card-reader-jammed",
    summary: "the card reader is jammed",
    keywords: ["card reader jammed", "reader jammed", "reader issue", "card reader problem", "reader failing", "reader broken", "card reader error"],
  },
  {
    id: "card-reader-ok",
    summary: "the card reader is working",
    keywords: ["card reader ok", "reader working", "reader fixed", "reader fine", "card reader working"],
  },

  // Schedule
  {
    id: "started-late",
    summary: "we started behind schedule",
    keywords: ["started late", "late start", "delay start", "behind schedule", "delayed opening", "late opening"],
  },
  {
    id: "started-on-time",
    summary: "we started on time",
    keywords: ["started on time", "on schedule", "right on time", "punctual start", "started punctually"],
  },

  // Atmosphere
  {
    id: "calm",
    summary: "all is calm",
    keywords: ["calm", "peaceful", "no incident", "orderly", "all calm", "smooth", "very calm"],
  },
  {
    id: "tense",
    summary: "atmosphere is tense",
    keywords: ["tense", "tension", "heated", "anxious", "uneasy"],
  },
  {
    id: "security-presence",
    summary: "security presence today",
    keywords: ["security present", "police here", "officers present", "soldiers here", "security on site", "police on ground"],
  },

  // Materials
  {
    id: "ballot-supply-low",
    summary: "ballot papers running short",
    keywords: ["ballot short", "papers short", "ran out of ballots", "low ballot supply", "ballot shortage", "running out of ballots"],
  },
  {
    id: "ballot-supply-ok",
    summary: "ballot papers are enough",
    keywords: ["ballot enough", "papers enough", "enough ballots", "ballot supply ok", "plenty ballots"],
  },

  // Turnout
  {
    id: "turnout-high",
    summary: "high voter turnout",
    keywords: ["high turnout", "lots of voters", "big turnout", "crowded", "many voters", "packed"],
  },
  {
    id: "turnout-low",
    summary: "low voter turnout",
    keywords: ["low turnout", "few voters", "empty", "small turnout", "not many voters", "quiet"],
  },

  // Verification
  {
    id: "pvc-verification",
    summary: "PVC verification ongoing",
    keywords: ["pvc", "verifying pvc", "checking voter card", "pvc check", "voter card check"],
  },

  // Weather
  {
    id: "weather-rain",
    summary: "rain slowing things down",
    keywords: ["rain", "raining", "wet", "weather delay", "rain delay", "downpour"],
  },
  {
    id: "weather-hot",
    summary: "the heat is intense",
    keywords: ["hot", "heat", "very hot", "sunny", "intense sun", "scorching"],
  },

  // Officials
  {
    id: "agent-present",
    summary: "INEC agent is present",
    keywords: ["inec agent", "inec official", "official present", "agent on site", "inec staff"],
  },
  {
    id: "agent-absent",
    summary: "INEC agent not yet on site",
    keywords: ["agent absent", "no agent", "no official", "agent missing", "no inec"],
  },

  // Process
  {
    id: "accreditation-ongoing",
    summary: "accreditation is ongoing",
    keywords: ["accreditation", "accrediting", "voter check", "verifying voters", "credentialing"],
  },
  {
    id: "voting-started",
    summary: "voting has started",
    keywords: ["voting started", "voting begins", "casting ballots", "voting has begun", "voting commences"],
  },
  {
    id: "voting-ended",
    summary: "voting has ended",
    keywords: ["voting ended", "voting closed", "cast closed", "voting finished", "voting wraps up"],
  },

  // Conditions
  {
    id: "logistics-issue",
    summary: "logistics issue noted",
    keywords: ["logistics", "logistics issue", "supply issue", "delivery delay", "materials issue"],
  },
  {
    id: "sealing-ok",
    summary: "ballot box sealed in public view",
    keywords: ["sealed", "ballot box sealed", "sealing", "sealed publicly", "seal in full view"],
  },
  {
    id: "observers-present",
    summary: "election observers are present",
    keywords: ["observers", "observer present", "watching", "monitors present", "civil society present"],
  },

  // Equipment
  {
    id: "power-issue",
    summary: "no electricity at the unit",
    keywords: ["no power", "no light", "power out", "blackout", "no electricity", "generator needed"],
  },
  {
    id: "generator-on",
    summary: "generator is now running",
    keywords: ["generator on", "gen on", "power restored", "now have light", "generator running"],
  },

  // Minor plumbing
  {
    id: "restroom-ok",
    summary: "restroom facilities available",
    keywords: ["restroom", "toilet ok", "washroom", "facilities ok"],
  },
  {
    id: "restroom-issue",
    summary: "restroom is out of order",
    keywords: ["no restroom", "toilet bad", "restroom issue", "no facilities"],
  },
  {
    id: "counting-started",
    summary: "results counting has started",
    keywords: ["counting started", "counting votes", "sorting ballots", "sorting votes", "tallying started"],
  },
  {
    id: "results-pasted",
    summary: "official results are pasted",
    keywords: ["results pasted", "pasted results", "pasted sheets", "result sheet pasted", "inec pasted"],
  },
  {
    id: "party-agents-present",
    summary: "party agents are present",
    keywords: ["party agents", "agents present", "apc agent", "pdp agent", "lp agent"],
  },
  {
    id: "bvas-failed",
    summary: "BVAS authentication issue",
    keywords: ["bvas issue", "bvas failed", "bvas not working", "bvas error", "fingerprint failed", "face capture failed"],
  },
  {
    id: "bvas-ok",
    summary: "BVAS machine working well",
    keywords: ["bvas ok", "bvas working", "bvas fine", "bvas authentication ok"],
  },
  {
    id: "materials-missing",
    summary: "critical materials missing",
    keywords: ["materials missing", "no papers", "no ink", "missing sheets", "sheets not here"],
  },
  {
    id: "assisted-voting",
    summary: "assisted voting ongoing",
    keywords: ["assisted voting", "elderly assisted", "disabled assisted", "pregnant priority"],
  },
];

/**
 * Pre-built normalized lookup: lowercased keywords with summary pair.
 * Built once at module-load; consumers don't need to re-normalize.
 *
 * @returns {Array<{ keyword: string, id: string, summary: string }>}
 */
export function buildKeywordIndex() {
  const entries = [];
  for (const entry of CIVIC_SUMMARIES) {
    for (const keyword of entry.keywords) {
      entries.push({
        keyword: keyword.toLowerCase().trim(),
        id: entry.id,
        summary: entry.summary,
        keywordLength: keyword.length,
      });
    }
  }
  // Longest keywords first so "card reader jammed" wins over "card reader".
  entries.sort((a, b) => b.keywordLength - a.keywordLength);
  return entries;
}

/**
 * Normalize a body for substring matching:
 *   - lowercase
 *   - trim leading/trailing whitespace
 *   - collapse multiple spaces to one
 * Length must remain ≤30 chars client-side before this call.
 *
 * @param {string} body
 * @returns {string}
 */
export function normalizeBody(body) {
  return body
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
