"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { Phase, PlotWithRelations } from "@shared/types/database.types";
import type { BasemapId } from "@/lib/hooks/use-inventory-store";
import {
  buildPlotParcels,
  parcelFillColor,
} from "@/lib/map/plot-polygons";
import { formatReservedLabel } from "@/lib/time/countdown";

interface MapViewProps {
  plots: PlotWithRelations[];
  phases: Phase[];
  selectedPlotId: string | null;
  basemap: BasemapId;
  onSelectPlot: (plot: PlotWithRelations) => void;
  onReady?: (api: { zoomIn: () => void; zoomOut: () => void }) => void;
}

const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_LABELS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const OSM = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export function MapView({
  plots,
  phases,
  selectedPlotId,
  basemap,
  onSelectPlot,
  onReady,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const basemapGroupRef = useRef<L.LayerGroup | null>(null);
  const overlaysRef = useRef<L.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const hasReservedTimers = useMemo(
    () =>
      plots.some(
        (p) => p.status === "reserved" && p.reservation_expires_at,
      ),
    [plots],
  );

  useEffect(() => {
    if (!hasReservedTimers) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasReservedTimers]);

  const plotById = useMemo(() => {
    const map = new Map<string, PlotWithRelations>();
    plots.forEach((p) => map.set(p.id, p));
    return map;
  }, [plots]);

  const parcels = useMemo(
    () => buildPlotParcels(phases, plots),
    [phases, plots],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [33.555, 72.87],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    basemapGroupRef.current = L.layerGroup().addTo(map);
    overlaysRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setReady(true);
    onReady?.({
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
    });

    return () => {
      map.remove();
      mapRef.current = null;
      basemapGroupRef.current = null;
      overlaysRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map init once
  }, []);

  useEffect(() => {
    const group = basemapGroupRef.current;
    if (!group || !ready) return;
    group.clearLayers();

    if (basemap === "satellite") {
      L.tileLayer(ESRI_IMAGERY, {
        attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>',
        maxZoom: 19,
      }).addTo(group);
      L.tileLayer(ESRI_LABELS, {
        attribution: "",
        maxZoom: 19,
        opacity: 0.9,
      }).addTo(group);
    } else if (basemap === "osm") {
      L.tileLayer(OSM, {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(group);
    }
  }, [basemap, ready]);

  useEffect(() => {
    const overlays = overlaysRef.current;
    if (!overlays || !ready) return;
    overlays.clearLayers();

    phases.forEach((phase) => {
      const geometry = phase.boundary_geojson as {
        type: string;
        coordinates: number[][][];
      };
      if (geometry?.type !== "Polygon") return;
      const latLngs = geometry.coordinates[0].map(
        ([lng, lat]) => [lat, lng] as [number, number],
      );
      L.polygon(latLngs, {
        color: "#FFFFFF",
        weight: 2,
        dashArray: "8 6",
        fillColor: "#001A4D",
        fillOpacity: 0.04,
        interactive: false,
      })
        .bindTooltip(phase.name, { sticky: true, direction: "center" })
        .addTo(overlays);
    });

    parcels.forEach((parcel) => {
      const selected = parcel.plotId === selectedPlotId;
      const fill = parcelFillColor(parcel.type, selected, parcel.status);
      const poly = L.polygon(parcel.latlngs, {
        color: selected ? "#001A4D" : "#1a1a1a",
        weight: selected ? 2.5 : 1,
        fillColor: fill,
        fillOpacity: selected ? 0.9 : 0.72,
      });

      const tip =
        parcel.status === "reserved" && parcel.reservationExpiresAt
          ? `Plot ${parcel.label} · ${formatReservedLabel(parcel.reservationExpiresAt, now)}`
          : `Plot ${parcel.label} · ${parcel.type}`;

      poly.bindTooltip(tip, { sticky: true });

      const labelIcon = L.divIcon({
        className: "",
        html: `<div style="display:flex;align-items:center;justify-content:center;min-width:22px;padding:1px 4px;font-size:11px;font-weight:700;color:#111;text-shadow:0 0 3px #fff,0 0 2px #fff;pointer-events:none">${parcel.label}</div>`,
        iconSize: [28, 16],
        iconAnchor: [14, 8],
      });
      const labelMarker = L.marker(parcel.center, {
        icon: labelIcon,
        interactive: false,
        keyboard: false,
      });

      poly.on("click", () => {
        const plot = plotById.get(parcel.plotId);
        if (plot) onSelectPlot(plot);
      });

      poly.addTo(overlays);
      labelMarker.addTo(overlays);
    });
  }, [now, onSelectPlot, parcels, phases, plotById, ready, selectedPlotId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
