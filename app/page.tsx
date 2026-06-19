'use client';

import { useEffect, useMemo, useState } from 'react';
import { GeneratedContest, ScoreResult } from '@/lib/types';

type FormState = {
  handle1: string;
  handle2: string;
  minRating: number;
  maxRating: number;
  count: number;
  durationMinutes: number;
  allowedIndexes: string;
  includeTags: string;
  excludeTags: string;
};

const defaultForm: FormState = {
  handle1: 'Cosmicoder',
  handle2: 'trappedintesseract',
  minRating: 1600,
  maxRating: 2200,
  count: 6,
  durationMinutes: 150,
  allowedIndexes: 'B,C,D,E,F',
  includeTags: '',
  excludeTags: 'interactive',
};

function secondsToClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

function csv(value: string): string[] {
  return value.split(',').map((x) => x.trim()).filter(Boolean);
}

export default function Home() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [contest, setContest] = useState<GeneratedContest | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState('');
  const [scores, setScores] = useState<ScoreResult[]>([]);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cf-sparring-contest');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setContest(parsed.contest ?? null);
        setStartedAt(parsed.startedAt ?? null);
        setScores(parsed.scores ?? []);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (contest) localStorage.setItem('cf-sparring-contest', JSON.stringify({ contest, startedAt, scores }));
  }, [contest, startedAt, scores]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = useMemo(() => {
    if (!contest || !startedAt) return contest ? contest.durationMinutes * 60 : 0;
    return contest.durationMinutes * 60 - (now - startedAt);
  }, [contest, startedAt, now]);

  async function generateContest() {
    setLoading(true);
    setError('');
    setScores([]);
    setStartedAt(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          allowedIndexes: csv(form.allowedIndexes),
          includeTags: csv(form.includeTags),
          excludeTags: csv(form.excludeTags),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to generate contest');
      setContest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function refreshScore() {
    if (!contest) return;
    setScoring(true);
    setError('');
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle1: contest.handle1,
          handle2: contest.handle2,
          problems: contest.problems,
          startedAt: startedAt ?? contest.generatedAt,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to refresh score');
      setScores(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setScoring(false);
    }
  }

  function copyLinks() {
    if (!contest) return;
    navigator.clipboard.writeText(contest.problems.map((p) => `${p.slot}. ${p.url}`).join('\n'));
  }

  function resetContest() {
    setContest(null);
    setStartedAt(null);
    setScores([]);
    localStorage.removeItem('cf-sparring-contest');
  }

  return (
    <main>
      <section className="hero">
        <div className="badge">CF Sparring · private Codeforces duel generator</div>
        <h1>Build a contest neither of you has touched.</h1>
        <p>
          Enter two Codeforces handles, generate a balanced list of unattempted problems, open each problem directly on Codeforces, and refresh public submissions to score the sparring session.
        </p>
      </section>

      <section className="grid">
        <div className="card">
          <div className="form">
            <label>
              Your handle
              <input value={form.handle1} onChange={(e) => setForm({ ...form, handle1: e.target.value })} />
            </label>
            <label>
              Friend handle
              <input value={form.handle2} onChange={(e) => setForm({ ...form, handle2: e.target.value })} />
            </label>
            <div className="row">
              <label>
                Min rating
                <input type="number" step="100" value={form.minRating} onChange={(e) => setForm({ ...form, minRating: Number(e.target.value) })} />
              </label>
              <label>
                Max rating
                <input type="number" step="100" value={form.maxRating} onChange={(e) => setForm({ ...form, maxRating: Number(e.target.value) })} />
              </label>
            </div>
            <div className="row">
              <label>
                Problems
                <input type="number" min="1" max="12" value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} />
              </label>
              <label>
                Duration minutes
                <input type="number" min="15" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
              </label>
            </div>
            <label>
              Allowed indexes, comma separated
              <input value={form.allowedIndexes} onChange={(e) => setForm({ ...form, allowedIndexes: e.target.value })} placeholder="B,C,D,E,F" />
            </label>
            <label>
              Include tags, optional
              <input value={form.includeTags} onChange={(e) => setForm({ ...form, includeTags: e.target.value })} placeholder="dp, graphs" />
            </label>
            <label>
              Exclude tags
              <input value={form.excludeTags} onChange={(e) => setForm({ ...form, excludeTags: e.target.value })} placeholder="interactive, geometry" />
            </label>
            <button onClick={generateContest} disabled={loading}>{loading ? 'Generating...' : 'Generate CF Sparring contest'}</button>
            {error && <div className="error">{error}</div>}
          </div>
        </div>

        <div className="card">
          {!contest ? (
            <p>
              Your generated contest will appear here. The links are deep links, so submissions still happen on Codeforces.
            </p>
          ) : (
            <>
              <div className="row">
                <div>
                  <div className="meta">Duel</div>
                  <h2>{contest.handle1} vs {contest.handle2}</h2>
                </div>
                <div>
                  <div className="meta">Timer</div>
                  <div className="timer">{secondsToClock(remaining)}</div>
                </div>
              </div>

              <div className="actions">
                <button onClick={() => setStartedAt(Math.floor(Date.now() / 1000))} disabled={Boolean(startedAt)}>
                  {startedAt ? 'Contest started' : 'Start contest'}
                </button>
                <button className="secondary" onClick={refreshScore} disabled={scoring}>{scoring ? 'Checking...' : 'Refresh score'}</button>
                <button className="secondary" onClick={copyLinks}>Copy links</button>
                <button className="secondary" onClick={() => setShowTags(!showTags)}>{showTags ? 'Hide tags' : 'Reveal tags'}</button>
                <button className="secondary" onClick={resetContest}>Reset</button>
              </div>

              <div style={{ marginTop: 18 }}>
                {contest.problems.map((problem) => (
                  <div className="problem" key={problem.key}>
                    <div className="slot">{problem.slot}</div>
                    <div>
                      <h3>{problem.name}</h3>
                      <div className="meta">
                        {problem.rating ?? 'unrated'} · CF {problem.contestId}{problem.index} · solved {problem.solvedCount ?? '?'} times
                        {showTags && <> · {problem.tags.join(', ') || 'no tags'}</>}
                      </div>
                    </div>
                    <a href={problem.url} target="_blank" rel="noreferrer"><button className="secondary">Open</button></a>
                  </div>
                ))}
              </div>

              {scores.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h2>Scoreboard</h2>
                  <div className="score">
                    {scores.map((score) => (
                      <div className="scorebox" key={score.handle}>
                        <strong>{score.handle}</strong>
                        <p className="ok">Solved {score.solvedCount}: {score.solved.join(', ') || 'none yet'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <p className="footer-note">
        CF Sparring uses public Codeforces API data only. It never asks for your Codeforces password and does not create contests on Codeforces directly.
      </p>
    </main>
  );
}
