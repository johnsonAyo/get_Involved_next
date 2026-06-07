export type StateId = string;

export type Id = string;

export type Party = {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
};

export type Candidate = {
  id: Id;
  year?: number;
  candidateName: string;
  birthYear?: number;
  careerHistory?: string[];
  education?: string[];
  profileHighlights?: string[];
  profileSources?: string[];
  profileUrl?: string;
  profilePictureUrl?: string;
  party: string;
  partyFullName?: string;
  partyId?: string;
  position: string;
  viceCandidateName?: string;
  stateId?: StateId;
  stateName?: string;
  state?: string;
  lga?: string;
  logo?: string;
  source?: string | string[];
  display?: boolean;
};

export type Fact = {
  id: Id;
  category?: string;
  text?: string;
  source?: string;
};

export type DirectoryStateOption = {
  id: string;
  name: string;
};

export type CandidateSubmission = {
  website: string;
  candidate: string;
  position: string;
  party: string;
  state: string;
  localGovernment: string;
  source: string;
  sourceUrl: string;
};

export type ReportSubmission = {
  website: string;
  title: string;
  description: string;
};
