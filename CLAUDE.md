# App: Tend

You are working in the Tend PWA source at `C:\Users\jlgon\ClaudeProjects\tend\app\`.

## What this is
Tend — a Progressive Web App for low-stakes social coordination and relationship tending. React + Leaflet + Supabase. Three tabs: Garden / Map / Schedule. Pixel/Animal Crossing aesthetic.

## Stack
- **Framework:** Vite 8 + React
- **Map:** react-leaflet + Leaflet (CartoDB Voyager tiles, no API key)
- **Backend:** Supabase (auth, database, realtime, push)
- **PWA:** vite-plugin-pwa (Workbox) — installed with --legacy-peer-deps due to Vite 8 peer dep lag
- **Styles:** CSS custom properties (no CSS framework); tokens in `src/styles/tokens.css`

## File structure
```
src/
├── App.jsx              ← tab shell (Garden / Map / Schedule)
├── App.css              ← app shell layout, tab bar
├── index.css            ← global reset, base styles
├── screens/
│   ├── Garden.jsx       ← home screen (02_garden)
│   ├── Map.jsx          ← map screen (03_map)
│   └── Schedule.jsx     ← schedule tab (04_schedule)
├── components/          ← shared UI components (built in 02+)
├── lib/
│   └── supabase.js      ← Supabase client init
└── styles/
    └── tokens.css       ← all CSS custom properties (colors, spacing, animation)
```

## Environment
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
Never commit `.env`.

## Running locally
```bash
npm run dev
```

## Build stages
This app is built in stages — see `C:\Users\jlgon\ClaudeProjects\tend\CONTEXT.md` for the pipeline. Current stage: check status table there. Do not build ahead of the current stage.

## Key conventions
- Mobile-first, max-width 480px centered on desktop
- Warm palette — all colors via CSS vars from tokens.css, never hardcoded hex
- No image sharing — emojis only throughout the app
- Garden is the home screen (default tab), not the map
- Neurodivergent-friendly: never guilt-inducing, no streak punishment
