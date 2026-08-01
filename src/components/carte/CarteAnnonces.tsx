import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, Popup, type MapRef } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { Bien } from "@/api/bien";

const TOKEN     = import.meta.env.VITE_MAPBOX_TOKEN as string;
const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
const DAKAR     = { longitude: -17.4467, latitude: 14.6928 };

const formatPrice = (price: number) =>
  new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(price);


// ─── Types ──────────────────────────────────────────────────────────────────────

type BienWithCoords = Bien & { latitude: number; longitude: number };

interface Cluster {
  lat: number; lng: number;
  count: number; biens: BienWithCoords[];
}

function buildClusters(items: BienWithCoords[], zoom: number): Cluster[] {
  const step = zoom < 11 ? 0.1 : zoom < 13 ? 0.02 : 0;
  if (step === 0) return items.map((b) => ({ lat: b.latitude, lng: b.longitude, count: 1, biens: [b] }));
  const grid: Record<string, Cluster> = {};
  for (const b of items) {
    const key = `${Math.floor(b.latitude / step)}_${Math.floor(b.longitude / step)}`;
    if (!grid[key]) grid[key] = { lat: 0, lng: 0, count: 0, biens: [] };
    grid[key].biens.push(b);
    grid[key].count++;
  }
  return Object.values(grid).map((c) => ({
    ...c,
    lat: c.biens.reduce((s, b) => s + b.latitude, 0) / c.count,
    lng: c.biens.reduce((s, b) => s + b.longitude, 0) / c.count,
  }));
}

// ─── Markers ─────────────────────────────────────────────────────────────────

function ClusterBubble({ count }: { count: number }) {
  const size = count < 10 ? 36 : count < 100 ? 44 : 52;
  const bg   = count < 10 ? "#0C1A35" : count < 50 ? "#D4A843" : "#e53e3e";
  return (
    <div style={{
      width: size, height: size, background: bg,
      border: "3px solid white", borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: count < 100 ? 13 : 11,
      boxShadow: "0 2px 8px rgba(0,0,0,0.35)", cursor: "pointer",
    }}>
      {count}
    </div>
  );
}

function TitrePill({ titre, promoted, active }: { titre: string | null; promoted?: boolean; active?: boolean }) {
  const label = titre ? (titre.length > 22 ? titre.slice(0, 21) + "…" : titre) : "Annonce";
  return (
    <div style={{
      background:   active ? "#0C1A35" : promoted ? "#D4A843" : "white",
      color:        active ? "white"   : promoted ? "white"   : "#0C1A35",
      border:       `2px solid ${active ? "#0C1A35" : promoted ? "#C09535" : "#cbd5e1"}`,
      borderRadius: 20,
      padding:      "4px 10px",
      fontSize:     11,
      fontWeight:   600,
      whiteSpace:   "nowrap",
      boxShadow:    active ? "0 4px 14px rgba(12,26,53,0.45)" : "0 1px 4px rgba(0,0,0,0.18)",
      cursor:       "pointer",
      transform:    active ? "scale(1.08)" : "scale(1)",
      transition:   "all 0.15s ease",
      display:      "flex",
      alignItems:   "center",
      gap:          5,
    }}>
      {label}
      {/* petit chevron indiquant que c'est cliquable */}
      <svg
        width="10" height="10" viewBox="0 0 10 10" fill="none"
        style={{ opacity: active ? 0.7 : 0.4, flexShrink: 0 }}
      >
        <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M4 3.5L6 5L4 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// Point de recherche précis — cercle pulsant rouge
function ProximityMarker({ label }: { label?: string }) {
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Cercle pulsant */}
      <div style={{ position: "relative", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="animate-ping" style={{
          position: "absolute",
          width: 28, height: 28,
          borderRadius: "50%",
          background: "rgba(239,68,68,0.25)",
        }} />
        <div style={{
          width: 16, height: 16, borderRadius: "50%",
          background: "#ef4444",
          border: "3px solid white",
          boxShadow: "0 2px 8px rgba(239,68,68,0.6)",
          zIndex: 1,
        }} />
      </div>
      {/* Label */}
      {label && (
        <div style={{
          marginTop: 4,
          background: "#ef4444",
          color: "white",
          fontSize: 10,
          fontWeight: 700,
          padding: "2px 7px",
          borderRadius: 10,
          whiteSpace: "nowrap",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          maxWidth: 140,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  items: Bien[];
  proximityPoint?: { lat: number; lng: number; label?: string } | null;
}

export default function CarteAnnonces({ items, proximityPoint }: Props) {
  const mapRef = useRef<MapRef | null>(null);
  const [zoom,      setZoom]      = useState(12);
  const [activeBien, setActiveBien] = useState<BienWithCoords | null>(null);

  const withCoords = useMemo(
    () => items.filter((b): b is BienWithCoords => b.latitude !== null && b.longitude !== null),
    [items]
  );

  const clusters = useMemo(() => buildClusters(withCoords, zoom), [withCoords, zoom]);

  // Fit bounds incluant le point de proximité
  useEffect(() => {
    if (!mapRef.current) return;
    const pts: [number, number][] = withCoords.map((b) => [b.longitude, b.latitude]);
    if (proximityPoint) pts.push([proximityPoint.lng, proximityPoint.lat]);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      mapRef.current.flyTo({ center: pts[0], zoom: 14 });
      return;
    }
    const bounds = pts.reduce(
      (b, pt) => b.extend(pt),
      new mapboxgl.LngLatBounds()
    );
    mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 16 });
  }, [withCoords, proximityPoint]);

  const shortLabel = proximityPoint?.label
    ? proximityPoint.label.split(",")[0].trim()
    : undefined;

  return (
    <div>
      <style>{`.mapboxgl-popup { z-index: 9999 !important; }`}</style>
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 520 }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={TOKEN}
          mapStyle={MAP_STYLE}
          initialViewState={{ ...DAKAR, zoom: 12 }}
          style={{ width: "100%", height: "100%" }}
          scrollZoom={false}
          onZoom={(e) => setZoom(e.viewState.zoom)}
          onClick={() => setActiveBien(null)}
        >
          {/* ── Marqueur point de recherche ── */}
          {proximityPoint && (
            <Marker
              longitude={proximityPoint.lng}
              latitude={proximityPoint.lat}
              anchor="center"
            >
              <ProximityMarker label={shortLabel} />
            </Marker>
          )}

          {/* ── Clusters et biens ── */}
          {clusters.map((cluster, i) => {
            if (cluster.count > 1) {
              return (
                <Marker
                  key={`cluster-${i}`}
                  longitude={cluster.lng}
                  latitude={cluster.lat}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    mapRef.current?.flyTo({
                      center: [cluster.lng, cluster.lat],
                      zoom: (mapRef.current.getZoom() ?? zoom) + 2,
                    });
                  }}
                >
                  <ClusterBubble count={cluster.count} />
                </Marker>
              );
            }

            const bien = cluster.biens[0];
            const isActive = activeBien?.id === bien.id;
            const dimmed  = activeBien !== null && !isActive;
            return (
              <Marker
                key={bien.id}
                longitude={cluster.lng}
                latitude={cluster.lat}
                anchor="center"
                style={{
                  zIndex:        isActive ? 999 : 1,
                  opacity:       dimmed ? 0 : 1,
                  pointerEvents: dimmed ? "none" : "auto",
                  transition:    "opacity 0.15s ease",
                }}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setActiveBien(isActive ? null : bien);
                }}
              >
                <TitrePill titre={bien.titre} promoted={bien.estMisEnAvant} active={isActive} />
              </Marker>
            );
          })}

          {/* ── Popup fiche bien (clic sur pill) ── */}
          {activeBien && (
            <Popup
              longitude={activeBien.longitude}
              latitude={activeBien.latitude}
              anchor="bottom"
              offset={14}
              closeButton={false}
              onClose={() => setActiveBien(null)}
              maxWidth="260px"
            >
              <div className="text-sm p-1">
                {activeBien.photos?.[0] && (
                  <img
                    src={activeBien.photos[0]}
                    alt={activeBien.titre ?? ""}
                    className="w-full h-28 object-cover rounded-lg mb-2"
                  />
                )}
                <p className="font-semibold text-[#0C1A35] line-clamp-2 leading-tight mb-1">
                  {activeBien.titre ?? "Annonce"}
                </p>
                {activeBien.prix !== null && (
                  <p className="text-[#D4A843] font-bold text-sm mb-1">
                    {formatPrice(activeBien.prix)}
                  </p>
                )}
                {activeBien.distance !== undefined && (
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#D4A843]" />
                    {activeBien.distance < 1
                      ? `${Math.round(activeBien.distance * 1000)} m du point`
                      : `${activeBien.distance.toFixed(1)} km du point`}
                  </p>
                )}
                {(activeBien.quartier || activeBien.ville) && (
                  <p className="text-xs text-slate-400 mb-2">
                    {[activeBien.quartier, activeBien.ville].filter(Boolean).join(", ")}
                  </p>
                )}
                <Link
                  to={`/annonce/${activeBien.id}`}
                  className="block text-center text-xs font-medium bg-[#0C1A35] text-white rounded-lg py-1.5 hover:bg-[#1A2942] transition-colors"
                >
                  Voir l'annonce
                </Link>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {withCoords.length < items.length && (
        <div className="px-4 py-2 mt-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
          {items.length - withCoords.length} annonce(s) sans coordonnées GPS ne sont pas affichées sur la carte.
        </div>
      )}
    </div>
  );
}
