import { useRef, useCallback, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Locate, Loader2, MapPin } from "lucide-react";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
const DAKAR: [number, number] = [-17.4467, 14.6928]; // [lng, lat]
const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";

export interface GeocodingData {
  countryCode?: string;
  country?: string;
  city?: string;
  /**
   * Candidats de nom de quartier, du plus probable au moins probable.
   * OSM ne tague pas "suburb"/"neighbourhood" de façon cohérente au Sénégal :
   * selon l'endroit, le nom de quartier précis se trouve dans l'un ou l'autre
   * champ (l'autre contenant alors une commune/arrondissement plus large).
   * On garde tous les candidats et on laisse l'appelant matcher contre sa
   * propre liste de quartiers plutôt que de deviner lequel est le bon.
   */
  quartierCandidates: string[];
  adresse: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<GeocodingData | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lng}&format=json&accept-language=fr&addressdetails=1`,
      { headers: { "Accept-Language": "fr", "User-Agent": "seek-immobilier/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address ?? {};

    const quartierCandidates = [addr.neighbourhood, addr.suburb, addr.city_district].filter(
      (v: unknown): v is string => Boolean(v)
    );

    const adressePrecise =
      [addr.house_number, addr.road].filter(Boolean).join(", ") ||
      quartierCandidates[0] ||
      data.display_name ||
      "";

    return {
      countryCode: addr.country_code?.toUpperCase(),
      country: addr.country,
      city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state_district,
      quartierCandidates,
      adresse: adressePrecise,
    };
  } catch {
    return null;
  }
}

export interface MapPickerValue {
  lat: number;
  lng: number;
  geocoding?: GeocodingData;
}

interface MapPickerProps {
  value: MapPickerValue | null;
  onChange: (v: MapPickerValue) => void;
  disabled?: boolean;
}

export default function MapPicker({ value, onChange, disabled = false }: MapPickerProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [locating,  setLocating]  = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const handlePlace = useCallback(
    async (lat: number, lng: number) => {
      if (disabled) return;
      setGeocoding(true);
      const geo = await reverseGeocode(lat, lng);
      setGeocoding(false);
      onChange({ lat, lng, geocoding: geo ?? undefined });
      mapRef.current?.flyTo({ center: [lng, lat], zoom: Math.max(mapRef.current.getZoom(), 14) });
    },
    [disabled, onChange]
  );

  const handleLocate = () => {
    if (disabled || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        await handlePlace(pos.coords.latitude, pos.coords.longitude);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };

  const initialViewState = value
    ? { longitude: value.lng, latitude: value.lat, zoom: 15 }
    : { longitude: DAKAR[0], latitude: DAKAR[1], zoom: 12 };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height: 300 }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={TOKEN}
        mapStyle={MAP_STYLE}
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        scrollZoom={true}
        onClick={(e) => {
          if (disabled) return;
          handlePlace(e.lngLat.lat, e.lngLat.lng);
        }}
        cursor={disabled ? "default" : "crosshair"}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {value && (
          <Marker
            longitude={value.lng}
            latitude={value.lat}
            draggable={!disabled}
            onDragEnd={(e) => handlePlace(e.lngLat.lat, e.lngLat.lng)}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="w-2 h-2 rounded-full bg-red-500 mt-0.5 opacity-50" />
            </div>
          </Marker>
        )}
      </Map>

      {/* Me localiser */}
      <button
        type="button"
        onClick={handleLocate}
        disabled={disabled || locating}
        title="Me localiser"
        className="absolute bottom-10 right-3 z-10 bg-white rounded-lg shadow-md border border-slate-200 w-9 h-9 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {locating ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#D4A843]" />
        ) : (
          <Locate className="w-4 h-4 text-[#0C1A35]" />
        )}
      </button>

      {geocoding && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow text-xs text-slate-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          Localisation en cours…
        </div>
      )}

      {!value && (
        <div className="absolute inset-0 z-10 flex items-end justify-center pb-4 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow text-xs text-slate-500 text-center">
            Cliquez sur la carte pour placer votre annonce
          </div>
        </div>
      )}
    </div>
  );
}
