const nigeriaFacts = [
  {
    id: 1,
    category: "ELECTORATE",
    text: "Nigeria has over 93.5 million registered voters across 36 states and the FCT — the largest electorate in Africa.",
    source: "INEC, 2023 General Election Report",
  },
  {
    id: 2,
    category: "STATES",
    text: "Nigeria is divided into 36 states and the Federal Capital Territory (FCT), with 774 local government areas in total.",
    source: "Federal Republic of Nigeria Constitution",
  },
  {
    id: 3,
    category: "ELECTIONS",
    text: "Presidential elections are held every four years. A candidate must win at least 25% of votes in at least 24 states to be declared winner.",
    source: "Electoral Act 2022, Section 134",
  },
  {
    id: 4,
    category: "PARTIES",
    text: "As of 2023, INEC recognises 18 registered political parties eligible to field candidates in national and state elections.",
    source: "INEC Party Registry, 2023",
  },
  {
    id: 5,
    category: "TURNOUT",
    text: "Voter turnout in the 2023 presidential election was approximately 29% — one of the lowest in Nigeria's democratic history.",
    source: "INEC Official Results, February 2023",
  },
  {
    id: 6,
    category: "HISTORY",
    text: "Nigeria has held uninterrupted civilian-to-civilian presidential transitions since 1999, marking over 25 years of democratic governance.",
    source: "Independent National Electoral Commission",
  },
  {
    id: 7,
    category: "WOMEN IN POLITICS",
    text: "Women make up only 4.3% of Nigeria's National Assembly — one of the lowest rates of female representation in Africa.",
    source: "Inter-Parliamentary Union, 2023",
  },
  {
    id: 8,
    category: "YOUTH VOTE",
    text: "Voters aged 18–34 account for over 37% of registered voters, making the youth demographic a decisive force in every election.",
    source: "INEC Voter Demographics Report, 2023",
  },
];

export async function fetchFacts() {
  return nigeriaFacts;
}
