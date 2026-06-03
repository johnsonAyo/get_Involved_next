import { fetchSanity } from "../lib/sanity";

export const PARTIES = {
  apc: {
    id: "apc",
    name: "All Progressives Congress",
    abbreviation: "APC",
    logo: "/assets/logo/APC-logo.png",
  },
  adc: {
    id: "adc",
    name: "African Democratic Congress",
    abbreviation: "ADC",
    logo: "/assets/logo/African_Democratic_Congress_logo.png",
  },
  ndc: {
    id: "ndc",
    name: "Nigeria Democratic Congress",
    abbreviation: "NDC",
    logo: "/assets/logo/ndc.png",
  },
  apm: {
    id: "apm",
    name: "Allied Peoples' Movement",
    abbreviation: "APM",
    logo: "/assets/logo/apm.png",
  },
  ypp: {
    id: "ypp",
    name: "Young Progressive Party",
    abbreviation: "YPP",
    logo: "/assets/logo/ypp.png",
  },
  aac: {
    id: "aac",
    name: "African Action Congress",
    abbreviation: "AAC",
    logo: "/assets/logo/aac.png",
  },
};

export async function fetchParties() {
  const sanityParties = await fetchSanity("parties");
  if (Array.isArray(sanityParties) && sanityParties.length > 0) {
    return sanityParties;
  }

  return Object.values(PARTIES);
}
