# Axis

Axis is a single-user, premium time regulation system for work and home. It adapts to variable schedules, enforces breaks and lunch intelligently, and logs reality without judgement.

## Core Logic

- Sessions are the source of truth. Only one session runs at a time; starting a new one auto-closes the current session with `source = auto_closed`.
- Sessions are stored in `localStorage` (no backend). Reloading keeps the running session active.
- Work and Home modes are fully separated and filtered throughout the UI.
- Undo restores the most recent auto-close state.

## Scheduling Rules (Work Mode)

- Workday range is derived from the weekly schedule.
- Lunch is required when planned work duration is at least 6 hours.
- Short break targets scale with planned duration:
  - ~4h day → 1 break
  - ~8h day → 2 breaks + lunch
  - ~9.5–10h day → 3 breaks + lunch
- Breaks are spaced roughly every 90 minutes.
- Lunch is placed near the midpoint of the day.
- Busy blocks move suggestions:
  - If overlapping, suggestions try the nearest free gap within ±20 minutes.
  - Otherwise, they move forward to the next available gap.

## Running Locally

```bash
cd /Users/briancumming/Desktop/Axis
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create a `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase setup

Run:

```
npm run setup:supabase
```

Restart your dev server and confirm `/login` loads.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Set these environment variables (Production + Preview):
   - NEXT_PUBLIC_SUPABASE_URL=https://obtwaplzyawlvnnocsbk.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jDjhdzFZ8u4quk2uCmTavw_F5QGXp2-
4. Deploy and open the Vercel URL.
