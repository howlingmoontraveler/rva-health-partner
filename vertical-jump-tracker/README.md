# Misogi Vertical

A personal vertical jump and dunk-training tracker built for a 12-month program.

## What it tracks

- Current week and phase of the program
- Five programmed sessions per week
- Session completion, load/touch notes, RPE, and 24-hour knee response
- Daily readiness, BJJ stress, sprint reps, and jump contacts
- Max-touch and dunk-height testing history

## Persistence

Local development stores data in `data/tracker-state.json`.

Production uses Vercel KV / Upstash when these environment variables are set:

```env
KV_REST_API_URL=
KV_REST_API_TOKEN=
VERTICAL_JUMP_KV_KEY=vertical-jump-tracker:state
```

## Commands

```bash
npm run dev
npm run typecheck
npm run build
```
