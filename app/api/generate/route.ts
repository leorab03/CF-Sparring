import { NextRequest, NextResponse } from 'next/server';
import { attemptedProblemKeys, getProblemset, getUserSubmissions } from '@/lib/codeforces';
import { generateContest } from '@/lib/generator';
import { GenerateContestRequest } from '@/lib/types';

function parseCsv(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value.split(',').map((x) => x.trim()).filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload: GenerateContestRequest = {
      handle1: String(body.handle1 ?? '').trim(),
      handle2: String(body.handle2 ?? '').trim(),
      minRating: Number(body.minRating ?? 1400),
      maxRating: Number(body.maxRating ?? 2200),
      count: Number(body.count ?? 6),
      durationMinutes: Number(body.durationMinutes ?? 150),
      allowedIndexes: Array.isArray(body.allowedIndexes) ? body.allowedIndexes : parseCsv(body.allowedIndexes),
      includeTags: Array.isArray(body.includeTags) ? body.includeTags : parseCsv(body.includeTags),
      excludeTags: Array.isArray(body.excludeTags) ? body.excludeTags : parseCsv(body.excludeTags),
    };

    if (!payload.handle1 || !payload.handle2) {
      return NextResponse.json({ error: 'Both Codeforces handles are required.' }, { status: 400 });
    }
    if (payload.minRating > payload.maxRating) {
      return NextResponse.json({ error: 'Minimum rating cannot exceed maximum rating.' }, { status: 400 });
    }

    const [submissions1, submissions2, problemset] = await Promise.all([
      getUserSubmissions(payload.handle1),
      getUserSubmissions(payload.handle2),
      getProblemset(),
    ]);

    const contest = generateContest(
      payload,
      problemset.problems,
      problemset.problemStatistics,
      attemptedProblemKeys(submissions1),
      attemptedProblemKeys(submissions2),
    );

    return NextResponse.json(contest);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
