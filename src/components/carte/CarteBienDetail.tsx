import { useEffect, useMemo, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Etablissement } from "@/api/bien";

const TOKEN     = import.meta.env.VITE_MAPBOX_TOKEN as string;
const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

// ─── Etablissement helpers ────────────────────────────────────────────────────

type EtabCat = "sante" | "education" | "commerce" | "culte" | "transport" | "services";

function getEtabCat(type: string): EtabCat {
  if (["hopital","pharmacie"].includes(type)) return "sante";
  if (["ecole_maternelle","ecole_primaire","college","lycee","universite"].includes(type)) return "education";
  if (["supermarche","marche","boulangerie"].includes(type)) return "commerce";
  if (["mosquee","eglise"].includes(type)) return "culte";
  if (["arret_bus","station_brt","route_principale"].includes(type)) return "transport";
  return "services";
}

const CAT_COLORS: Record<EtabCat, { bg: string; text: string; badgeBg: string }> = {
  sante:     { bg: "#d1fae5", text: "#059669", badgeBg: "#a7f3d0" },
  education: { bg: "#dbeafe", text: "#2563eb", badgeBg: "#bfdbfe" },
  commerce:  { bg: "#fef3c7", text: "#d97706", badgeBg: "#fde68a" },
  culte:     { bg: "#ede9fe", text: "#7c3aed", badgeBg: "#ddd6fe" },
  transport: { bg: "#e0f2fe", text: "#0284c7", badgeBg: "#bae6fd" },
  services:  { bg: "#f1f5f9", text: "#475569", badgeBg: "#e2e8f0" },
};

const ETABLISSEMENT_LABELS: Record<string, string> = {
  hopital: "Hôpital", pharmacie: "Pharmacie",
  ecole_maternelle: "École maternelle", ecole_primaire: "École primaire",
  college: "Collège", lycee: "Lycée", universite: "Université",
  supermarche: "Supermarché", marche: "Marché", boulangerie: "Boulangerie",
  mosquee: "Mosquée", eglise: "Église",
  gendarmerie: "Gendarmerie", pompiers: "Caserne des pompiers", mairie: "Mairie",
  arret_bus: "Arrêt de bus", station_brt: "Station BRT", route_principale: "Route principale",
};

function estimateTime(distanceM: number) {
  return { walk: Math.ceil(distanceM / 83), car: Math.ceil(distanceM / 667) };
}

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const d = (deg: number) => (deg * Math.PI) / 180;
  const a =
    Math.sin(d(lat2 - lat1) / 2) ** 2 +
    Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(d(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ─── Overpass ─────────────────────────────────────────────────────────────────

type OverpassElement = {
  type: string; id: number;
  lat?: number; lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function overpassToType(tags: Record<string, string>): string | null {
  const a = tags.amenity ?? ""; const s = tags.shop ?? "";
  if (a === "hospital" || a === "clinic") return "hopital";
  if (a === "pharmacy") return "pharmacie";
  if (a === "school") return "ecole_primaire";
  if (a === "college") return "college";
  if (a === "university") return "universite";
  if (a === "marketplace") return "marche";
  if (a === "place_of_worship") return tags.religion === "christian" ? "eglise" : "mosquee";
  if (a === "bus_station") return "arret_bus";
  if (a === "police") return "gendarmerie";
  if (a === "fire_station") return "pompiers";
  if (a === "townhall" || a === "public_building") return "mairie";
  if (s === "supermarket") return "supermarche";
  if (s === "bakery") return "boulangerie";
  return null;
}

const OVERPASS_MIRRORS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

async function fetchOverpassEtabs(lat: number, lng: number): Promise<Etablissement[]> {
  const amenity = "hospital|clinic|pharmacy|school|college|university|marketplace|place_of_worship|bus_station|police|fire_station|townhall";
  const query =
    `[out:json][timeout:20];` +
    `(nwr["amenity"~"^(${amenity})$"](around:1500,${lat},${lng});` +
    `nwr["shop"~"^(supermarket|bakery)$"](around:1000,${lat},${lng});` +
    `);out center;`;
  let lastError: unknown;
  for (const mirror of OVERPASS_MIRRORS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18_000);
    try {
      // POST (recommandé par Overpass) plutôt que GET : les miroirs publics
      // rejettent souvent les requêtes GET avec querystring longue (406),
      // surtout sous charge — le POST classique est mieux accepté.
      const res = await fetch(mirror, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const all = (data.elements as OverpassElement[])
        .map((el) => {
          const elLat = el.lat ?? el.center?.lat;
          const elLon = el.lon ?? el.center?.lon;
          const type  = overpassToType(el.tags ?? {});
          if (!type || !Number.isFinite(elLat) || !Number.isFinite(elLon)) return null;
          const tags = el.tags ?? {};
          const adresse = tags["addr:full"] ??
            (tags["addr:housenumber"] && tags["addr:street"]
              ? `${tags["addr:housenumber"]} ${tags["addr:street"]}`
              : tags["addr:street"] ?? null);
          return {
            id: `overpass-${el.id}`, type,
            nom: tags.name ?? null,
            latitude: elLat as number, longitude: elLon as number,
            distance: Math.round(haversineDist(lat, lng, elLat as number, elLon as number)),
            adresse: adresse ?? null,
          } as Etablissement;
        })
        .filter((e): e is Etablissement => e !== null);
      // `Map` est shadowé par l'import du composant react-map-gl plus haut dans ce
      // fichier — on passe par `globalThis.Map` pour viser le vrai constructeur JS.
      const byType = new globalThis.Map<string, Etablissement>();
      for (const e of all) {
        const existing = byType.get(e.type);
        if (!existing || (e.distance ?? Infinity) < (existing.distance ?? Infinity)) byType.set(e.type, e);
      }
      return Array.from(byType.values());
    } catch (err) { clearTimeout(timer); lastError = err; }
  }
  throw lastError;
}

// ─── Marker visuals ───────────────────────────────────────────────────────────

function BienMarker() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-9 h-9 rounded-full bg-[#D4A843] border-2 border-white shadow-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3" fill="#D4A843"/>
        </svg>
      </div>
      <div className="w-2 h-2 rounded-full bg-[#D4A843] mt-0.5 opacity-60" />
    </div>
  );
}

function EtabMarker({ type }: { type: string }) {
  const cat    = getEtabCat(type);
  const colors = CAT_COLORS[cat];
  return (
    <div
      style={{
        width: 22, height: 22, borderRadius: "50%",
        background: colors.text,
        border: "2px solid white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        cursor: "pointer",
      }}
    />
  );
}

// ─── Popup content ────────────────────────────────────────────────────────────

function EtabPopupContent({ etab }: { etab: Etablissement }) {
  const cat    = getEtabCat(etab.type);
  const colors = CAT_COLORS[cat];
  const label  = ETABLISSEMENT_LABELS[etab.type] ?? etab.type.replace(/_/g, " ");
  const dist   = etab.distance;
  const hasD   = typeof dist === "number" && dist > 0;
  const distTxt = hasD ? (dist! < 1000 ? `${dist} m` : `${(dist! / 1000).toFixed(1)} km`) : null;
  const time   = hasD ? estimateTime(dist!) : null;

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", minWidth: 160, maxWidth: 230 }}>
      <div className="flex items-start gap-2">
        <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>
            {cat === "sante" ? "🏥" : cat === "education" ? "🏫" : cat === "commerce" ? "🛒" : cat === "culte" ? "🕌" : cat === "transport" ? "🚌" : "🏛️"}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0C1A35", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {etab.nom || label}
          </p>
          <span style={{ display: "inline-block", marginTop: 3, fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 999, background: colors.badgeBg, color: colors.text }}>
            {label}
          </span>
          {distTxt && time && (
            <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: colors.text, background: colors.bg, padding: "1px 6px", borderRadius: 999 }}>↗ {distTxt}</span>
              <span style={{ fontSize: 11, color: "#64748b" }}>🚶 {time.walk} min</span>
              <span style={{ fontSize: 11, color: "#64748b" }}>🚗 {time.car} min</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  latitude: number;
  longitude: number;
  titreBien?: string | null;
  etablissements?: Etablissement[];
  onOverpassLoaded?: (etabs: Etablissement[]) => void;
}

export default function CarteBienDetail({
  latitude, longitude, titreBien, etablissements = [], onOverpassLoaded,
}: Props) {
  const [overpassEtabs,   setOverpassEtabs]   = useState<Etablissement[]>([]);
  const [overpassLoading, setOverpassLoading] = useState(false);
  const [hoveredEtab,     setHoveredEtab]     = useState<Etablissement | null>(null);
  const [showBienPopup,   setShowBienPopup]   = useState(false);

  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);

  const allEtabs   = useMemo(() => etablissements.length > 0 ? etablissements : overpassEtabs, [etablissements, overpassEtabs]);
  const validEtabs = useMemo(() => allEtabs.filter((e) => Number.isFinite(e.latitude) && Number.isFinite(e.longitude)), [allEtabs]);

  useEffect(() => {
    if (!hasCoords || etablissements.length > 0) return;
    let cancelled = false;
    setOverpassLoading(true);
    fetchOverpassEtabs(latitude, longitude)
      .then((etabs) => {
        if (!cancelled) { setOverpassEtabs(etabs); onOverpassLoaded?.(etabs); }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setOverpassLoading(false); });
    return () => { cancelled = true; };
  }, [hasCoords, latitude, longitude, etablissements.length]);

  if (!hasCoords) {
    return (
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-[380px] grid place-items-center bg-slate-50 text-slate-500 text-sm px-4 text-center">
        Coordonnées GPS invalides pour afficher la carte.
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 380 }}>
      <Map
        mapboxAccessToken={TOKEN}
        mapStyle={MAP_STYLE}
        initialViewState={{ longitude, latitude, zoom: 15 }}
        style={{ width: "100%", height: "100%" }}
        scrollZoom={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Bien marker */}
        <Marker longitude={longitude} latitude={latitude} anchor="bottom" onClick={() => setShowBienPopup(v => !v)}>
          <BienMarker />
        </Marker>

        {showBienPopup && (
          <Popup longitude={longitude} latitude={latitude} anchor="bottom" offset={40} closeButton onClose={() => setShowBienPopup(false)} maxWidth="200px">
            <div style={{ fontFamily: "system-ui,sans-serif" }}>
              <div className="flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>📍</div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0C1A35" }}>{titreBien ?? "Ce bien"}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#D4A843", fontWeight: 600 }}>Vous êtes ici</p>
                </div>
              </div>
            </div>
          </Popup>
        )}

        {/* Etablissement markers */}
        {validEtabs.map((etab) => (
          <Marker
            key={etab.id}
            longitude={etab.longitude}
            latitude={etab.latitude}
            anchor="center"
            onClick={(e) => { e.originalEvent.stopPropagation(); setHoveredEtab(etab); }}
          >
            <EtabMarker type={etab.type} />
          </Marker>
        ))}

        {hoveredEtab && (
          <Popup
            longitude={hoveredEtab.longitude}
            latitude={hoveredEtab.latitude}
            anchor="bottom"
            offset={12}
            closeButton
            onClose={() => setHoveredEtab(null)}
            maxWidth="240px"
          >
            <EtabPopupContent etab={hoveredEtab} />
          </Popup>
        )}
      </Map>

      {overpassLoading && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-xs text-slate-600 px-3 py-1.5 rounded-full shadow flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin" />
          Recherche des établissements…
        </div>
      )}

      {!overpassLoading && overpassEtabs.length > 0 && etablissements.length === 0 && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-xs text-slate-500 px-3 py-1.5 rounded-full shadow">
          {overpassEtabs.length} établissement{overpassEtabs.length > 1 ? "s" : ""} à proximité
        </div>
      )}
    </div>
  );
}
