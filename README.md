# Ultimate Habit Tracker

La app #1 para trackear tu vida entera: hábitos, fitness, finanzas, nutrición y bienestar.

## Setup Rápido

```bash
cd app
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Tech Stack

- **Framework:** Next.js 14 + TypeScript
- **Styling:** Tailwind CSS + Inline Styles (warm brown palette)
- **Charts:** Recharts
- **Icons:** Lucide React
- **State:** Zustand
- **Dates:** date-fns

## Estructura del Proyecto

```
src/
├── app/           → App Router (layout, page, globals)
├── components/
│   ├── ui/        → Componentes base (Button, Card, Input...)
│   ├── layout/    → Sidebar, TopBar, MainApp
│   ├── charts/    → Componentes de gráficos reutilizables
│   └── features/  → Componentes por feature
│       ├── home/     → Dashboard, Monthly Summary
│       ├── habits/   → Habit Tracker
│       ├── fitness/  → Workout Tracker, Body Metrics
│       ├── finance/  → Budget, Transactions
│       ├── planner/  → Daily/Weekly Planner
│       └── wellness/ → Mood, Sleep, Hydration
├── hooks/         → Custom hooks
├── stores/        → Zustand stores
├── lib/           → Utilidades, colores, constantes
└── types/         → TypeScript types
```

## Documentación

Ver `../PROJECT-BIBLE.md` para la documentación completa del proyecto.
