import { NextRequest, NextResponse } from 'next/server';
import { acceptedProblemKeys, getUserSubmissions } from '@/lib/codeforces';
import { ContestProblem, ScoreResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const handles = [String(body.handle1 ?? '').trim(), String(body.handle2 ?? '').trim()];
    const problems = (body.problems ?? []) as ContestProblem[];
    const startedAt = Number(body.startedAt ?? 0);

    if (!handles[0] || !handles[1] || problems.length === 0) {
      return NextResponse.json({ error: 'Handles and problems are required.' }, { status: 400 });
    }

    const results: ScoreResult[] = [];
    for (const handle of handles) {
      const submissions = await getUserSubmissions(handle);
      const accepted = acceptedProblemKeys(submissions, startedAt || undefined);
      const solved = problems.filter((problem) => accepted.has(problem.key)).map((problem) => problem.slot);
      results.push({ handle, solved, solvedCount: solved.length });
    }

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
