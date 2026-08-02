import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SlidersHorizontal, ArrowLeft, Loader2, Check, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useChampsAdminState, useSetChampsForTypeLogement } from "@/hooks/useTypeLogementChamp";
import { useEquipementsAdminState, useSetEquipementsForTypeLogement } from "@/hooks/useTypeLogementEquipement";
import { useMeublesAdminState, useSetMeublesForTypeLogement } from "@/hooks/useTypeLogementMeuble";
import { useTypeLogementsAdmin } from "@/hooks/useTypeLogements";
import type { ChampWithState } from "@/api/typeLogementChamp";
import type { EquipementWithState } from "@/api/typeLogementEquipement";
import type { MeubleWithState } from "@/api/typeLogementMeuble";

interface ChampRow {
  champId: string;
  nom: string;
  type: string;
  categorieNom: string;
  categorieOrdre: number;
  actif: boolean;
  associe: boolean;
  obligatoire: boolean;
  ordre: number;
  cleSysteme: string | null;
}

interface SimpleRow {
  id: string;
  nom: string;
  categorieNom: string;
  categorieOrdre: number;
  actif: boolean;
  associe: boolean;
}

function groupByCategorie<T extends { categorieNom: string; categorieOrdre: number }>(rows: T[]) {
  const grouped = rows.reduce<Record<string, { nom: string; ordre: number; items: T[] }>>((acc, r) => {
    if (!acc[r.categorieNom]) acc[r.categorieNom] = { nom: r.categorieNom, ordre: r.categorieOrdre, items: [] };
    acc[r.categorieNom].items.push(r);
    return acc;
  }, {});
  return Object.entries(grouped).sort((a, b) => a[1].ordre - b[1].ordre);
}

export default function TypeLogementChampsPage() {
  const { id: typeLogementId = "" } = useParams<{ id: string }>();
  const { data: types = [] }        = useTypeLogementsAdmin();
  const typeLogement                = types.find((t) => t.id === typeLogementId);

  const { data: champsRaw = [], isLoading: champsLoading } = useChampsAdminState(typeLogementId);
  const { data: equipementsRaw = [], isLoading: eqLoading } = useEquipementsAdminState(typeLogementId);
  const { data: meublesRaw = [], isLoading: mblLoading } = useMeublesAdminState(typeLogementId);
  const setChamps = useSetChampsForTypeLogement(typeLogementId);
  const setEquipements = useSetEquipementsForTypeLogement(typeLogementId);
  const setMeubles = useSetMeublesForTypeLogement(typeLogementId);

  const isLoading = champsLoading || eqLoading || mblLoading;
  const isSaving = setChamps.isPending || setEquipements.isPending || setMeubles.isPending;

  const [champRows, setChampRows] = useState<ChampRow[]>([]);
  const [equipementRows, setEquipementRows] = useState<SimpleRow[]>([]);
  const [meubleRows, setMeubleRows] = useState<SimpleRow[]>([]);

  useEffect(() => {
    if (!champsRaw.length) return;
    setChampRows(
      (champsRaw as ChampWithState[]).map((c, i) => ({
        champId:        c.id,
        nom:            c.nom,
        type:           c.type,
        categorieNom:   c.categorie.nom,
        categorieOrdre: c.categorie.ordre,
        actif:          c.actif,
        associe:        c.typeLogements.length > 0,
        obligatoire:    c.typeLogements[0]?.obligatoire ?? false,
        ordre:          c.typeLogements[0]?.ordre ?? i,
        cleSysteme:     c.cleSysteme,
      }))
    );
  }, [champsRaw]);

  useEffect(() => {
    if (!equipementsRaw.length) return;
    setEquipementRows(
      (equipementsRaw as EquipementWithState[]).map((eq) => ({
        id:            eq.id,
        nom:           eq.nom,
        categorieNom:  eq.categorie.nom,
        categorieOrdre: 0,
        actif:         eq.actif,
        associe:       eq.typeLogements.length > 0,
      }))
    );
  }, [equipementsRaw]);

  useEffect(() => {
    if (!meublesRaw.length) return;
    setMeubleRows(
      (meublesRaw as MeubleWithState[]).map((m) => ({
        id:            m.id,
        nom:           m.nom,
        categorieNom:  m.categorie.nom,
        categorieOrdre: 0,
        actif:         m.actif,
        associe:       m.typeLogements.length > 0,
      }))
    );
  }, [meublesRaw]);

  const toggle = (champId: string) => {
    setChampRows((prev) =>
      prev.map((r) =>
        r.champId === champId ? { ...r, associe: !r.associe, obligatoire: false } : r
      )
    );
  };

  const toggleObligatoire = (champId: string) => {
    setChampRows((prev) =>
      prev.map((r) =>
        r.champId === champId && r.associe ? { ...r, obligatoire: !r.obligatoire } : r
      )
    );
  };

  const toggleEquipement = (id: string) => {
    setEquipementRows((prev) => prev.map((r) => (r.id === id ? { ...r, associe: !r.associe } : r)));
  };

  const toggleMeuble = (id: string) => {
    setMeubleRows((prev) => prev.map((r) => (r.id === id ? { ...r, associe: !r.associe } : r)));
  };

  const handleSave = async () => {
    const associatedChamps = champRows
      .filter((r) => r.associe)
      .map((r, i) => ({ champId: r.champId, obligatoire: r.obligatoire, ordre: i }));
    const associatedEquipementIds = equipementRows.filter((r) => r.associe).map((r) => r.id);
    const associatedMeubleIds = meubleRows.filter((r) => r.associe).map((r) => r.id);

    await Promise.all([
      setChamps.mutateAsync(associatedChamps),
      setEquipements.mutateAsync(associatedEquipementIds),
      setMeubles.mutateAsync(associatedMeubleIds),
    ]);
    toast.success("Configuration enregistrée");
  };

  const sortedChampGroups = groupByCategorie(champRows);
  const sortedEquipementGroups = groupByCategorie(equipementRows);
  const sortedMeubleGroups = groupByCategorie(meubleRows);
  const nbAssocies = champRows.filter((r) => r.associe).length
    + equipementRows.filter((r) => r.associe).length
    + meubleRows.filter((r) => r.associe).length;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", to: "/admin/dashboard" },
          { label: "Types de logement", to: "/admin/biens/categories" },
          { label: typeLogement?.nom ?? "Champs" },
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-3">
        <div className="flex items-start gap-3">
          <Link
            to="/admin/biens/categories"
            className="mt-1 shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-500 hover:text-[#0C1A35] hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4A843] mb-2">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Configuration des champs
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0C1A35]">
              {typeLogement?.nom ?? "Type de logement"}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {nbAssocies} élément{nbAssocies > 1 ? "s" : ""} associé{nbAssocies > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#D4A843] hover:bg-[#C09535] text-white text-sm font-semibold shadow-sm shadow-[#D4A843]/20 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#D4A843]" /></div>
      ) : (
        <div className="space-y-8">
          {/* ── Champs ── */}
          <div>
            <h2 className="text-sm font-bold text-[#0C1A35] mb-3">Champs</h2>
            {champRows.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
                Aucun champ disponible. Créez d'abord des champs dans{" "}
                <Link to="/admin/champs" className="text-[#D4A843] underline">Champs de formulaire</Link>.
              </div>
            ) : (
              <div className="space-y-4">
                {sortedChampGroups.map(([catNom, group]) => (
                  <div key={catNom} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/60">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{group.nom}</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {group.items.map((row) => (
                        <div
                          key={row.champId}
                          className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                            row.associe ? "bg-white" : "bg-slate-50/30"
                          }`}
                        >
                          <GripVertical className="w-4 h-4 text-slate-200 flex-shrink-0" />

                          <input
                            type="checkbox"
                            checked={row.associe}
                            onChange={() => toggle(row.champId)}
                            disabled={!row.actif}
                            className="w-4 h-4 rounded accent-[#D4A843] cursor-pointer disabled:cursor-not-allowed"
                          />

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${row.associe ? "text-[#0C1A35]" : "text-slate-400"}`}>
                              {row.nom}
                              {row.cleSysteme && (
                                <span className="ml-2 text-[10px] font-normal text-slate-300">(champ système)</span>
                              )}
                              {!row.actif && <span className="ml-2 text-xs font-normal text-slate-300">(inactif)</span>}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">{row.type}</p>
                          </div>

                          {row.associe && (
                            <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={row.obligatoire}
                                onChange={() => toggleObligatoire(row.champId)}
                                className="w-4 h-4 rounded accent-red-400"
                              />
                              Obligatoire
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Équipements ── */}
          <div>
            <h2 className="text-sm font-bold text-[#0C1A35] mb-3">Équipements disponibles</h2>
            {equipementRows.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
                Aucun équipement disponible. Créez d'abord des équipements dans{" "}
                <Link to="/admin/biens/meuble-equipement" className="text-[#D4A843] underline">Meubles & Équipements</Link>.
              </div>
            ) : (
              <div className="space-y-4">
                {sortedEquipementGroups.map(([catNom, group]) => (
                  <div key={catNom} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/60">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{group.nom}</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {group.items.map((row) => (
                        <label
                          key={row.id}
                          className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
                            row.associe ? "bg-white" : "bg-slate-50/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={row.associe}
                            onChange={() => toggleEquipement(row.id)}
                            disabled={!row.actif}
                            className="w-4 h-4 rounded accent-[#D4A843] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <p className={`text-sm font-semibold ${row.associe ? "text-[#0C1A35]" : "text-slate-400"}`}>
                            {row.nom}
                            {!row.actif && <span className="ml-2 text-xs font-normal text-slate-300">(inactif)</span>}
                          </p>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Meubles ── */}
          <div>
            <h2 className="text-sm font-bold text-[#0C1A35] mb-3">Meubles disponibles</h2>
            {meubleRows.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
                Aucun meuble disponible. Créez d'abord des meubles dans{" "}
                <Link to="/admin/biens/meuble-equipement" className="text-[#D4A843] underline">Meubles & Équipements</Link>.
              </div>
            ) : (
              <div className="space-y-4">
                {sortedMeubleGroups.map(([catNom, group]) => (
                  <div key={catNom} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/60">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{group.nom}</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {group.items.map((row) => (
                        <label
                          key={row.id}
                          className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
                            row.associe ? "bg-white" : "bg-slate-50/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={row.associe}
                            onChange={() => toggleMeuble(row.id)}
                            disabled={!row.actif}
                            className="w-4 h-4 rounded accent-[#D4A843] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <p className={`text-sm font-semibold ${row.associe ? "text-[#0C1A35]" : "text-slate-400"}`}>
                            {row.nom}
                            {!row.actif && <span className="ml-2 text-xs font-normal text-slate-300">(inactif)</span>}
                          </p>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
