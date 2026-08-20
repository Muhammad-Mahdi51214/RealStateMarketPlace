import { TownPlanViewer } from "@/components/inventory/town-plan-viewer";

export const metadata = {
  title: "Town Plan | Capital Smart City Marketplace",
  description: "View the Capital Smart City town plan overview.",
};

export default function TownPlanPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-[28px] font-bold text-primary-navy">Town Plan</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          High-resolution Capital Smart City master plans. Drag to pan, scroll
          to zoom, and use Enhance for clearer district labels. Interactive
          shapefile overlays will replace placeholders when uploaded.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <TownPlanViewer
          src="/images/town-plan-master.png"
          webpSrc="/images/town-plan-master-hq.webp"
          alt="Capital Smart City master plan"
          caption="Master plan overview — zoom in to read sector labels"
          className="min-h-[520px] shadow-sm"
        />
        <TownPlanViewer
          src="/images/town-plan-phase2.png"
          webpSrc="/images/town-plan-phase2-hq.webp"
          alt="Capital Smart City Phase II plan"
          caption="Phase II detailed plan — pan across blocks for clarity"
          className="min-h-[520px] shadow-sm"
        />
      </div>
    </div>
  );
}
