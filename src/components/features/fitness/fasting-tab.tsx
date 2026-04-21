"use client";

import FastingPage from "@/components/features/fasting/fasting-page";

// Reexporta el nuevo FastingPage (con backend Prisma) como tab de Fitness.
// El viejo fasting-tab usaba fitness-extended-store; ahora persiste en
// FastingSession vía /api/fasting/sessions.
export default function FastingTab() {
  return <FastingPage />;
}
