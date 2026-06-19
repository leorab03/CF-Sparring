import { CodeforcesProblem, CodeforcesProblemStat, CodeforcesSubmission } from './types';

const CF_API = 'https://codeforces.com/api';

async function cfFetch<T>(method: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`${CF_API}/${method}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: method === 'problemset.problems' ? 60 * 60 : 0 },
    headers: { 'User-Agent': 'CF-Sparring/0.1' },
  });

  if (!response.ok) {
    throw new Error(`Codeforces request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status !== 'OK') {
    throw new Error(data.comment ?? 'Codeforces API returned non-OK status');
  }
  return data.result as T;
}

export async function getUserSubmissions(handle: string): Promise<CodeforcesSubmission[]> {
  return cfFetch<CodeforcesSubmission[]>('user.status', { handle });
}

export async function getProblemset(): Promise<{ problems: CodeforcesProblem[]; problemStatistics: CodeforcesProblemStat[] }> {
  return cfFetch<{ problems: CodeforcesProblem[]; problemStatistics: CodeforcesProblemStat[] }>('problemset.problems');
}

export function problemKey(problem: Pick<CodeforcesProblem, 'contestId' | 'problemsetName' | 'index'>): string | null {
  if (problem.contestId !== undefined) return `${problem.contestId}-${problem.index}`;
  if (problem.problemsetName) return `${problem.problemsetName}-${problem.index}`;
  return null;
}

export function problemUrl(problem: Pick<CodeforcesProblem, 'contestId' | 'problemsetName' | 'index'>): string {
  if (problem.contestId !== undefined) {
    return `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`;
  }
  return `https://codeforces.com/problemsets/${problem.problemsetName}/problem/${problem.index}`;
}

export function attemptedProblemKeys(submissions: CodeforcesSubmission[]): Set<string> {
  const keys = new Set<string>();
  for (const submission of submissions) {
    const key = problemKey(submission.problem);
    if (key) keys.add(key);
  }
  return keys;
}

export function acceptedProblemKeys(submissions: CodeforcesSubmission[], afterSeconds?: number): Set<string> {
  const keys = new Set<string>();
  for (const submission of submissions) {
    if (submission.verdict !== 'OK') continue;
    if (afterSeconds && submission.creationTimeSeconds < afterSeconds) continue;
    const key = problemKey(submission.problem);
    if (key) keys.add(key);
  }
  return keys;
}
