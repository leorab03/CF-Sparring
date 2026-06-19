export type CodeforcesProblem = {
  contestId?: number;
  problemsetName?: string;
  index: string;
  name: string;
  type?: string;
  points?: number;
  rating?: number;
  tags: string[];
};

export type CodeforcesProblemStat = {
  contestId?: number;
  index: string;
  solvedCount: number;
};

export type CodeforcesSubmission = {
  id: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: CodeforcesProblem;
  programmingLanguage: string;
  verdict?: string;
};

export type ContestProblem = {
  slot: string;
  key: string;
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
  solvedCount?: number;
  url: string;
};

export type GenerateContestRequest = {
  handle1: string;
  handle2: string;
  minRating: number;
  maxRating: number;
  count: number;
  durationMinutes: number;
  allowedIndexes?: string[];
  includeTags?: string[];
  excludeTags?: string[];
};

export type GeneratedContest = {
  id: string;
  handle1: string;
  handle2: string;
  generatedAt: number;
  durationMinutes: number;
  filters: Omit<GenerateContestRequest, 'handle1' | 'handle2'>;
  problems: ContestProblem[];
};

export type ScoreResult = {
  handle: string;
  solved: string[];
  solvedCount: number;
};
