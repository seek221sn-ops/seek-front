import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { fetchAnnoncePublique, type Bien } from "@/api/bien";
import {
  ArrowLeft,
  Home,
  GitCompareArrows,
  CheckCircle2,
  XCircle,
  MapPin,
  Loader2,
  Info,
  Trophy,
} from "lucide-react";
import { useState } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(price);
}

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Types ───────────────────────────────────────────────────────────────────

type RowType = "text" | "number" | "price" | "bool" | "date" | "score";

interface CompRow {
  label: string;
  key: string;
  type: RowType;
  unit?: string;
  higherIsBetter?: boolean;
  lowerIsBetter?: boolean;
  getValue: (b: Bien) => string | number | boolean | null | undefined;
}

const SECTIONS: { title: string; rows: CompRow[] }[] = [
  {
    title: "Financier",
    rows: [
      { label: "Prix", key: "prix", type: "price", lowerIsBetter: true, getValue: (b) => b.prix ?? null },
      { label: "Fréquence de paiement", key: "freq", type: "text", getValue: (b) => b.frequencePaiement ?? null },
      { label: "Caution", key: "caution", type: "bool", getValue: (b) => b.caution ?? null },
    ],
  },
  {
    title: "Surface & Pièces",
    rows: [
      { label: "Surface", key: "surface", type: "number", unit: "m²", higherIsBetter: true, getValue: (b) => b.surface ?? null },
      { label: "Chambres", key: "nbChambres", type: "number", higherIsBetter: true, getValue: (b) => b.nbChambres ?? null },
      { label: "Salles de bain", key: "nbSdb", type: "number", higherIsBetter: true, getValue: (b) => b.nbSdb ?? null },
      { label: "Salons", key: "nbSalons", type: "number", higherIsBetter: true, getValue: (b) => b.nbSalons ?? null },
      { label: "Cuisines", key: "nbCuisines", type: "number", higherIsBetter: true, getValue: (b) => b.nbCuisines ?? null },
      { label: "WC", key: "nbWc", type: "number", higherIsBetter: true, getValue: (b) => b.nbWc ?? null },
      {
        label: "Étage", key: "etage", type: "text",
        getValue: (b) =>
          b.etage != null && b.nbEtages != null ? `${b.etage} / ${b.nbEtages}`
          : b.etage != null ? String(b.etage)
          : null,
      },
    ],
  },
  {
    title: "Localisation",
    rows: [
      { label: "Pays", key: "pays", type: "text", getValue: (b) => b.pays ?? null },
      { label: "Ville", key: "ville", type: "text", getValue: (b) => b.region ?? null },
      { label: "Quartier", key: "quartier", type: "text", getValue: (b) => b.quartier ?? null },
    ],
  },
  {
    title: "Équipements & Options",
    rows: [
      { label: "Meublé", key: "meuble", type: "bool", higherIsBetter: true, getValue: (b) => b.meuble ?? false },
      { label: "Parking", key: "parking", type: "bool", higherIsBetter: true, getValue: (b) => b.parking ?? false },
      { label: "Ascenseur", key: "ascenseur", type: "bool", higherIsBetter: true, getValue: (b) => b.ascenseur ?? false },
      { label: "Animaux acceptés", key: "animaux", type: "bool", getValue: (b) => b.animaux ?? false },
      { label: "Fumeurs acceptés", key: "fumeurs", type: "bool", getValue: (b) => b.fumeurs ?? false },
    ],
  },
  {
    title: "Confiance & Fraîcheur",
    rows: [
      { label: "Score propriétaire", key: "score", type: "score", higherIsBetter: true, getValue: (b) => b.scoreProprietaire?.total ?? null },
      { label: "Vues", key: "nbVues", type: "number", getValue: (b) => b.nbVues ?? null },
      { label: "Publié le", key: "publishedAt", type: "date", getValue: (b) => b.publishedAt ?? null },
    ],
  },
];

// ─── Mise en évidence ─────────────────────────────────────────────────────────

function getHighlightClass(
  row: CompRow,
  value: string | number | boolean | null | undefined,
  allValues: (string | number | boolean | null | undefined)[]
): string {
  if (value == null || row.type === "bool" || row.type === "text" || row.type === "date") return "";
  const nums = allValues.filter((v) => v != null && typeof v === "number") as number[];
  if (nums.length < 2 || typeof value !== "number") return "";
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  if (max === min) return "";
  if (row.higherIsBetter) {
    if (value === max) return "bg-emerald-50 text-emerald-700 font-semibold";
    if (value === min) return "text-slate-400";
  }
  if (row.lowerIsBetter) {
    if (value === min) return "bg-emerald-50 text-emerald-700 font-semibold";
    if (value === max) return "text-slate-400";
  }
  return "";
}

// ─── Rendu cellule ────────────────────────────────────────────────────────────

function CellValue({ row, value }: { row: CompRow; value: string | number | boolean | null | undefined }) {
  if (value == null) return <span className="text-slate-300 text-xs italic">N/A</span>;
  if (row.type === "bool") {
    return value
      ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
      : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />;
  }
  if (row.type === "price" && typeof value === "number") return <span>{formatPrice(value)}</span>;
  if (row.type === "number" && typeof value === "number") {
    return <span>{value}{row.unit && <span className="text-xs text-slate-400 ml-0.5">{row.unit}</span>}</span>;
  }
  if (row.type === "score" && typeof value === "number") return <span>{value.toFixed(1)}</span>;
  if (row.type === "date" && typeof value === "string") return <span>{formatDate(value)}</span>;
  return <span>{String(value)}</span>;
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function ComparaisonPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [diffOnly, setDiffOnly] = useState(false);

  const rawIds = searchParams.get("ids") ?? "";
  const ids = rawIds.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["annonce-publie", id],
      queryFn: () => fetchAnnoncePublique(id),
      staleTime: 2 * 60 * 1000,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const biens = results.map((r) => r.data).filter((b): b is Bien => !!b);

  if (ids.length < 2) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-8">
        <GitCompareArrows className="w-12 h-12 text-slate-300" />
        <h1 className="text-xl font-bold text-[#0C1A35]">Comparaison impossible</h1>
        <p className="text-slate-500 text-sm">Sélectionnez au moins 2 annonces depuis la recherche.</p>
        <Link to="/annonces" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0C1A35] text-white text-sm font-medium hover:bg-[#1A2942] transition-colors">
          <ArrowLeft className="w-4 h-4" />Voir les annonces
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="hidden sm:block bg-white border-b border-slate-100">
        <div className="container mx-auto px-8">
          <nav className="flex items-center gap-1.5 py-3 text-sm">
            <Link to="/" className="flex items-center gap-1 text-slate-500 hover:text-[#0C1A35] transition-colors">
              <Home className="w-4 h-4" /><span>Accueil</span>
            </Link>
            <span className="text-slate-300">/</span>
            <Link to="/annonces" className="text-slate-500 hover:text-[#0C1A35] transition-colors">Annonces</Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#0C1A35] font-medium">Comparaison</span>
          </nav>
        </div>
      </div>

      {/* Header sticky */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-8">
          {/* Ligne 1 : titre */}
          <div className="flex items-center justify-between h-12 sm:h-14 gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0C1A35] transition-colors">
                <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Retour</span>
              </button>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <h1 className="text-sm font-bold text-[#0C1A35] flex items-center gap-2">
                <GitCompareArrows className="w-4 h-4 text-[#D4A843]" />
                Comparaison ({biens.length} biens)
              </h1>
            </div>
            {/* Contrôles sur desktop uniquement dans la ligne titre */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Toggle différences */}
              <div data-diff-popup className="relative flex items-center gap-1.5">
                <button onClick={() => setDiffOnly((v) => !v)} className="flex items-center gap-1.5 select-none">
                  <span className="text-xs text-slate-500">Différences uniquement</span>
                  <div className={`relative w-9 h-5 rounded-full transition-colors ${diffOnly ? "bg-[#D4A843]" : "bg-slate-200"}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${diffOnly ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </button>
                <div className="relative group/diff-info">
                  <Info className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-default transition-colors" />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#0C1A35] border border-white/10 text-white/80 text-xs px-3 py-2.5 rounded-xl leading-relaxed opacity-0 group-hover/diff-info:opacity-100 transition-opacity pointer-events-none z-[100]">
                    <p className="font-semibold text-[#D4A843] mb-1">Différences uniquement</p>
                    Masque les lignes où tous les biens ont la même valeur. Seules les caractéristiques qui distinguent les annonces restent visibles.
                    <span className="absolute bottom-full right-3 border-4 border-transparent border-b-[#0C1A35]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ligne 2 : contrôles sur mobile uniquement */}
          <div className="sm:hidden flex items-center justify-end pb-2 border-t border-slate-50 pt-2 gap-2">
            {/* Toggle différences mobile */}
            <button onClick={() => setDiffOnly((v) => !v)} className="flex items-center gap-1.5 select-none">
              <span className="text-xs text-slate-500">Diff. seulement</span>
              <div className={`relative w-9 h-5 rounded-full transition-colors ${diffOnly ? "bg-[#D4A843]" : "bg-slate-200"}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${diffOnly ? "translate-x-4" : "translate-x-0"}`} />
              </div>
            </button>
            <div data-diff-popup className="relative group/diff-info-m">
              <Info className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-default transition-colors" />
              <div className="absolute right-0 top-full mt-2 w-60 bg-[#0C1A35] border border-white/10 text-white/80 text-xs px-3 py-2.5 rounded-xl leading-relaxed opacity-0 group-hover/diff-info-m:opacity-100 transition-opacity pointer-events-none z-[100]">
                <p className="font-semibold text-[#D4A843] mb-1">Différences uniquement</p>
                Masque les lignes où tous les biens ont la même valeur. Seules les caractéristiques qui distinguent les annonces restent visibles.
                <span className="absolute bottom-full right-3 border-4 border-transparent border-b-[#0C1A35]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4A843]" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table
                className="w-full border-collapse"
                style={{ minWidth: `${160 + biens.length * 240}px` }}
              >
                {/* ── En-têtes biens (largeur fixe, hauteur uniforme) ── */}
                <thead>
                  <tr>
                    <th className="w-40 border-r border-slate-100">
                      <div className="sm:hidden flex flex-col items-center justify-center h-full py-4 gap-1 text-slate-300">
                        <span className="text-base leading-none">↔</span>
                        <span className="text-[10px] leading-tight text-center">Glisser<br/>pour voir</span>
                      </div>
                    </th>
                    {biens.map((bien) => {
                      return (
                        <th
                          key={bien.id}
                          className="align-top border-r border-slate-100 last:border-r-0"
                        >
                          {/* Carte centrée, largeur contrainte */}
                          <div className="p-3 flex justify-center">
                          <div className="w-[200px]">
                            {/* Photo fixe */}
                            <div className="relative h-28 bg-slate-100 rounded-xl overflow-hidden">
                              <img
                                src={bien.photos?.[0] ?? "/placeholder.svg"}
                                alt={bien.titre ?? ""}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white font-bold text-sm drop-shadow truncate">
                                  {formatPrice(bien.prix ?? 0)}
                                </p>
                              </div>
                            </div>
                            {/* Infos — hauteur fixe pour aligner les boutons */}
                            <div className="mt-2 h-[72px] flex flex-col justify-between">
                              <div>
                                <p className="font-semibold text-[#0C1A35] text-xs line-clamp-2 leading-tight">
                                  {bien.titre}
                                </p>
                                <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                  <MapPin className="w-2.5 h-2.5 text-[#D4A843] flex-shrink-0" />
                                  <span className="truncate">{[bien.quartier, bien.region].filter(Boolean).join(", ")}</span>
                                </p>
                              </div>
                              <Link
                                to={`/annonce/${bien.id}`}
                                className="block text-center text-xs font-medium text-[#0C1A35] border border-[#0C1A35] rounded-lg py-1 hover:bg-[#0C1A35] hover:text-white transition-colors"
                              >
                                Voir l'annonce
                              </Link>
                            </div>
                          </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* ── Corps ── */}
                <tbody>
                  {SECTIONS.map((section) => {
                    const visibleRows = section.rows.filter((row) => {
                      if (!diffOnly) return true;
                      const values = biens.map((b) => row.getValue(b));
                      const nonNull = values.filter((v) => v != null);
                      if (nonNull.length <= 1) return false;
                      return !nonNull.every((v) => String(v) === String(nonNull[0]));
                    });
                    if (visibleRows.length === 0) return null;

                    return (
                      <>
                        <tr key={`section-${section.title}`} className="bg-slate-50 border-t border-slate-200">
                          <td colSpan={biens.length + 1} className="px-4 py-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A843]">
                              {section.title}
                            </span>
                          </td>
                        </tr>

                        {visibleRows.map((row, rowIdx) => {
                          const allValues = biens.map((b) => row.getValue(b));
                          const isEven = rowIdx % 2 === 0;
                          return (
                            <tr
                              key={row.key}
                              className={`border-t border-slate-100 transition-colors hover:bg-blue-50/20 ${isEven ? "bg-white" : "bg-slate-50/50"}`}
                            >
                              <td className="py-3 px-4 text-xs font-semibold text-slate-500 align-middle border-r border-slate-100">
                                {row.label}
                              </td>
                              {biens.map((bien, colIdx) => {
                                const value = row.getValue(bien);
                                const highlight = getHighlightClass(row, value, allValues);
                                return (
                                  <td
                                    key={bien.id}
                                    className={`py-3 px-3 text-center text-sm align-middle border-r border-slate-100 last:border-r-0 transition-colors ${highlight}`}
                                  >
                                    <CellValue row={row} value={value} />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}

                  {/* ── Champs dynamiques ── */}
                  {(() => {
                    type BienWithChamps = Bien & { champValeurs?: { champ: { nom: string }; valeur: string }[] };
                    const allChampNames = Array.from(
                      new Set(biens.flatMap((b) => ((b as BienWithChamps).champValeurs ?? []).map((cv) => cv.champ.nom)))
                    );
                    if (allChampNames.length === 0) return null;
                    const visibleChamps = allChampNames.filter((champNom) => {
                      if (!diffOnly) return true;
                      const vals = biens.map((b) => ((b as BienWithChamps).champValeurs ?? []).find((cv) => cv.champ.nom === champNom)?.valeur ?? null);
                      const nonNull = vals.filter((v) => v != null);
                      if (nonNull.length <= 1) return false;
                      return !nonNull.every((v) => v === nonNull[0]);
                    });
                    if (visibleChamps.length === 0) return null;
                    return (
                      <>
                        <tr className="bg-slate-50 border-t border-slate-200">
                          <td colSpan={biens.length + 1} className="px-4 py-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A843]">Caractéristiques spécifiques</span>
                          </td>
                        </tr>
                        {visibleChamps.map((champNom, rowIdx) => (
                          <tr key={`champ-${champNom}`} className={`border-t border-slate-100 transition-colors hover:bg-blue-50/20 ${rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                            <td className="py-3 px-4 text-xs font-semibold text-slate-500 align-middle border-r border-slate-100">{champNom}</td>
                            {biens.map((b, colIdx) => {
                              const val = ((b as BienWithChamps).champValeurs ?? []).find((cv) => cv.champ.nom === champNom)?.valeur ?? null;
                              return (
                                <td key={b.id} className="py-3 px-3 text-center text-sm align-middle border-r border-slate-100 last:border-r-0">
                                  {val ?? <span className="text-slate-300 text-xs italic">N/A</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </>
                    );
                  })()}

                  {/* ── Établissements ── */}
                  {biens.some((b) => b.etablissements?.length) && (
                    <>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={biens.length + 1} className="px-4 py-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A843]">Proximité</span>
                        </td>
                      </tr>
                      <tr className="border-t border-slate-100 bg-white">
                        <td className="py-3 px-4 text-xs font-semibold text-slate-500 align-middle border-r border-slate-100">Établissements</td>
                        {biens.map((b) => (
                          <td key={b.id} className="py-3 px-3 text-center text-xs align-middle border-r border-slate-100 last:border-r-0">
                            {b.etablissements?.length ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {b.etablissements.slice(0, 4).map((e) => (
                                  <span key={e.id} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px]">
                                    {e.nom}{e.distance != null && <span className="text-slate-400 ml-1">{e.distance}m</span>}
                                  </span>
                                ))}
                                {b.etablissements.length > 4 && <span className="text-slate-400 text-[11px]">+{b.etablissements.length - 4}</span>}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs italic">Aucun renseigné</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
        )}
      </div>
    </div>
  );
}
