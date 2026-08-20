"use client";

import { TownPlanViewer } from "@/components/inventory/town-plan-viewer";
import type { Phase } from "@shared/types/database.types";

interface TownPlanViewProps {
  phases: Phase[];
}

export function TownPlanView({ phases }: TownPlanViewProps) {
  const url =
    phases.find((p) => p.town_plan_url)?.town_plan_url ??
    "/images/town-plan-master.png";
  const isDefault =
    !phases.find((p) => p.town_plan_url)?.town_plan_url ||
    url.includes("town-plan");

  return (
    <div className="flex h-full flex-col bg-[#f3f6fa]">
      <div className="border-b border-border bg-white px-4 py-3">
        <h2 className="text-lg font-bold text-primary-navy">Town Plan</h2>
        <p className="text-sm text-text-secondary">
          Static master plan overview for Capital Smart City phases.
        </p>
      </div>
      <div className="flex-1 p-4">
        <TownPlanViewer
          src={url}
          webpSrc={
            isDefault ? "/images/town-plan-master-hq.webp" : undefined
          }
          alt="Capital Smart City town plan"
          caption="Drag to pan · scroll to zoom · tap Enhance for clearer labels"
          className="h-full min-h-[480px]"
        />
      </div>
    </div>
  );
}
