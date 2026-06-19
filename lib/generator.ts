import { CodeforcesProblem, CodeforcesProblemStat, ContestProblem, GenerateContestRequest, GeneratedContest } from './types';
import { problemKey, problemUrl } from './codeforces';

const SLOT_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function normalizeTags(tags: string[] | undefined): string[] {
  return (tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
    const j = Math.abs(h) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function indexLetter(index: string): string {
  return index.replace(/\d/g, '').charAt(0).toUpperCase();
}

export function generateContest(
  request: GenerateContestRequest,
  allProblems: CodeforcesProblem[],
  stats: CodeforcesProblemStat[],
  attempted1: Set<string>,
  attempted2: Set<string>,
): GeneratedContest {
  const includeTags = normalizeTags(request.includeTags);
  const excludeTags = normalizeTags(request.excludeTags);
  const allowedIndexes = (request.allowedIndexes ?? []).map((x) => x.trim().toUpperCase()).filter(Boolean);

  const solvedCountByKey = new Map<string, number>();
  for (const stat of stats) {
    const key = problemKey(stat);
    if (key) solvedCountByKey.set(key, stat.solvedCount);
  }

  const candidates = allProblems.filter((problem) => {
    const key = problemKey(problem);
    if (!key || problem.contestId === undefined) return false;
    if (attempted1.has(key) || attempted2.has(key)) return false;
    if (problem.rating === undefined) return false;
    if (problem.rating < request.minRating || problem.rating > request.maxRating) return false;
    if (problem.type && problem.type !== 'PROGRAMMING') return false;
    const tags = normalizeTags(problem.tags);
    if (excludeTags.some((tag) => tags.includes(tag))) return false;
    if (includeTags.length && !includeTags.some((tag) => tags.includes(tag))) return false;
    if (allowedIndexes.length && !allowedIndexes.includes(indexLetter(problem.index))) return false;
    return true;
  });

  const count = Math.max(1, Math.min(12, request.count));
  const ratingStep = count === 1 ? 0 : (request.maxRating - request.minRating) / (count - 1);
  const seed = `${request.handle1}-${request.handle2}-${Date.now()}`;
  const shuffled = seededShuffle(candidates, seed);
  const chosen: CodeforcesProblem[] = [];
  const usedKeys = new Set<string>();

  for (let slot = 0; slot < count; slot++) {
    const target = request.minRating + ratingStep * slot;
    const pick = shuffled
      .filter((p) => {
        const key = problemKey(p);
        return key && !usedKeys.has(key);
      })
      .sort((a, b) => {
        const da = Math.abs((a.rating ?? target) - target);
        const db = Math.abs((b.rating ?? target) - target);
        if (da !== db) return da - db;
        const sa = solvedCountByKey.get(problemKey(a) ?? '') ?? 0;
        const sb = solvedCountByKey.get(problemKey(b) ?? '') ?? 0;
        return sb - sa;
      })[0];

    if (!pick) break;
    const key = problemKey(pick)!;
    usedKeys.add(key);
    chosen.push(pick);
  }

  const contestProblems: ContestProblem[] = chosen.map((problem, idx) => {
    const key = problemKey(problem)!;
    return {
      slot: SLOT_LETTERS[idx],
      key,
      contestId: problem.contestId,
      index: problem.index,
      name: problem.name,
      rating: problem.rating,
      tags: problem.tags,
      solvedCount: solvedCountByKey.get(key),
      url: problemUrl(problem),
    };
  });

  if (contestProblems.length === 0) {
    throw new Error('No matching problems found. Try widening the rating range or removing tag/index filters.');
  }

  return {
    id: crypto.randomUUID(),
    handle1: request.handle1,
    handle2: request.handle2,
    generatedAt: Math.floor(Date.now() / 1000),
    durationMinutes: request.durationMinutes,
    filters: {
      minRating: request.minRating,
      maxRating: request.maxRating,
      count,
      durationMinutes: request.durationMinutes,
      allowedIndexes,
      includeTags,
      excludeTags,
    },
    problems: contestProblems,
  };
}
