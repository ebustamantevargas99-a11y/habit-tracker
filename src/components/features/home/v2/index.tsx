"use client";

import Hero from "./hero";
import Vitals from "./vitals";
import Radar from "./radar";
import HabitForest from "./habit-forest";
import Timeline from "./timeline";
import CompoundEffect from "./compound-effect";
import Heatmap90 from "./heatmap-90d";
import ModuleSpotlights from "./module-spotlights";
import AIHub from "./ai-hub";
import AchievementsRibbon from "./achievements-ribbon";
import { useHomeV2Data } from "./data/use-home-v2-data";

/**
 * Home v2 — nuevo dashboard con diseño editorial + gráficos animados.
 * Por ahora activable via `?home=v2` (ver app-store / main-app).
 * Data = mock estable. Próximo commit: wire real data from stores.
 */
export default function HomeV2() {
  const data = useHomeV2Data();
  const hour = new Date().getHours();
  const showCierre = hour >= 18;

  return (
    <div
      className="flex flex-col gap-14"
      style={{ paddingBottom: 64, maxWidth: 1320, margin: "0 auto" }}
    >
      <Hero
        hour={hour}
        score={data.lifeScore}
        scorePrev={data.lifeScorePrev}
        userName={data.user.name}
        showCierre={showCierre}
      />

      <Vitals modules={data.enabledModules} data={data} />

      <Radar data={data.radar} />

      <HabitForest habits={data.habits} />

      {data.enabledModules.planner && <Timeline data={data.timeline} />}

      <CompoundEffect data={data.compound52} />

      <Heatmap90 data={data.heatmap90} />

      <ModuleSpotlights modules={data.enabledModules} data={data} />

      <AIHub />

      <AchievementsRibbon data={data} />
    </div>
  );
}
