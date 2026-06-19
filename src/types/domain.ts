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

export type PollingUnit = {
  id: Id;
  pollingUnitCode?: string;
  pollingUnitName: string;
  remark?: string;
  stateCode?: string;
  state: string;
  stateSlug: string;
  lga: string;
  ward: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  coordinateQuality?: string;
  coordinateConfidence?: number;
  coordinateSource?: string;
  coordinateLabel?: string;
  coordinateMatch?: string;
  sourceSnapshotUrl?: string;
  sourceGeneratedAt?: string;
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
