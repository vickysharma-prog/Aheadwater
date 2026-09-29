"use client";
import { useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

export type MapSite = { id: string; name: string; lat: number; lon: number; level: "alert" | "watch" | "normal" | "incident"; label: string };
type Leaflet = typeof import("leaflet");

const COLOR = { incident: "#b91c1c", alert: "#b91c1c", watch: "#b45309", normal: "#047857" };

function draw(L: Leaflet, layer: LayerGroup, sites: MapSite[], onSelect?: (id: string) => void) {
  layer.clearLayers();
  for (const s of sites) {
    const c = COLOR[s.level];
    if (s.level !== "normal") L.circle([s.lat, s.lon], { radius: 260, color: c, weight: 1, fillOpacity: 0.12 }).addTo(layer);
    L.circleMarker([s.lat, s.lon], { radius: 9, color: "white", weight: 2, fillColor: c, fillOpacity: 1 })
      .bindTooltip(`<b>${s.name}</b><br>${s.label}`, { direction: "top" })
      .on("click", () => onSelect?.(s.id))
      .addTo(layer);
  }
}

export function SiteMap({ sites, onSelect }: { sites: MapSite[]; onSelect?: (id: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const leaflet = useRef<Leaflet | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || map.current) return;
      leaflet.current = L;
      map.current = L.map(el.current, { scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map.current);
      map.current.fitBounds(L.latLngBounds(sites.map((s) => [s.lat, s.lon])), { padding: [60, 60] });
      layer.current = L.layerGroup().addTo(map.current);
      draw(L, layer.current, sites, onSelect);
    });
    return () => {
      cancelled = true;
    };
    // The map is created once; the effect below redraws the markers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (leaflet.current && layer.current) draw(leaflet.current, layer.current, sites, onSelect);
  }, [sites, onSelect]);

  return <div ref={el} className="h-full min-h-72 w-full rounded-lg" role="img" aria-label="Map of Ghent bathing sites" />;
}
