# CF Sparring

CF Sparring is a Vercel-ready Next.js app that generates a Codeforces practice contest for two handles.

It finds problems that neither handle has attempted, creates a balanced contest list, opens each problem via deep links to Codeforces, runs a local timer, and can refresh public submissions to score the duel.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Keep default Next.js settings.
4. Deploy.

No Codeforces password or API key is needed. This uses only public Codeforces API methods.

## MVP features

- Two Codeforces handles
- Rating range and problem count
- Avoids problems attempted by either handle
- Optional index filter such as A,B,C,D,E,F
- Optional tag include/exclude filters
- Deep links to Codeforces problems
- Local timer
- Submission refresh and scoreboard
