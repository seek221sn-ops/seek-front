import { useState } from "react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Navigation, Plus, Pencil, Trash2, X, AlertCircle, Loader2, ChevronDown, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  useAllPaysAdmin,
  useAllVillesAdmin,
  useAllQuartiersAdmin,
  useCreateQuartier,
  useUpdateQuartier,
  useDeleteQuartier,
} from "@/hooks/useGeo";
import type { Pays, Ville, Quartier } from "@/api/geo";
import ConfirmModal from "@/components/admin/ConfirmModal";

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm " +
  "text-slate-700 placeholder:text-slate-300 outline-none " +
  "focus:border-[#D4A843]/60 focus:bg-white transition-all";

const labelCls = "block text-xs font-medium text-slate-500 mb-1.5";

// ─── Modal formulaire ─────────────────────────────────────────────────────────

function QuartierForm({
  initial,
  paysList,
  onClose,
}: {
  initial?: Quartier;
  paysList: Pays[];
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const create = useCreateQuartier();
  const update = useUpdateQuartier();

  // Trouver le paysId initial depuis la ville du quartier
  const initPaysId = initial?.ville?.pays?.id ?? "";
  const [paysId, setPaysId] = useState(initPaysId);
  const [villeId, setVilleId] = useState(initial?.villeId ?? "");
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [latitude, setLatitude] = useState<number | null>(initial?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initial?.longitude ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: villesList = [] } = useAllVillesAdmin(paysId || undefined);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!villeId) errs.villeId = "Choisissez une ville";
    if (!nom.trim()) errs.nom = "Le nom est requis";
    if (latitude == null || isNaN(latitude)) errs.latitude = "La latitude est requise";
    if (longitude == null || isNaN(longitude)) errs.longitude = "La longitude est requise";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (isEdit && initial) {
        await update.mutateAsync({
          id: initial.id,
          data: { nom: nom.trim(), villeId, latitude: latitude!, longitude: longitude! },
        });
        toast.success("Quartier mis à jour");
      } else {
        await create.mutateAsync({ nom: nom.trim(), villeId, latitude: latitude!, longitude: longitude! });
        toast.success("Quartier créé");
      }
      onClose();
    } catch (err: unknown) {
      toast.error("Erreur lors de l'enregistrement du quartier");
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#0C1A35]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-[#0C1A35]">
            {isEdit ? "Modifier le quartier" : "Nouveau quartier"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pays */}
          <div>
            <label className={labelCls}>Pays *</label>
            <div className="relative">
              <select
                value={paysId}
                onChange={(e) => { setPaysId(e.target.value); setVilleId(""); }}
                className={`${inputCls} cursor-pointer appearance-none pr-8`}
              >
                <option value="">- Choisir un pays -</option>
                {paysList.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Ville */}
          <div>
            <label className={labelCls}>Ville *</label>
            <div className="relative">
              <select
                value={villeId}
                onChange={(e) => setVilleId(e.target.value)}
                disabled={!paysId}
                className={`${inputCls} cursor-pointer appearance-none pr-8 disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <option value="">
                  {paysId ? "- Choisir une ville -" : "- Sélectionnez d'abord un pays -"}
                </option>
                {villesList.map((v) => (
                  <option key={v.id} value={v.id}>{v.nom}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.villeId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.villeId}</p>}
          </div>

          {/* Nom */}
          <div>
            <label className={labelCls}>Nom du quartier *</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex : Almadies"
              className={inputCls}
            />
            {errors.nom && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.nom}</p>}
          </div>

          {/* Coordonnées GPS (Manuelles) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Latitude *</label>
              <input
                type="number"
                step="any"
                value={latitude !== null ? latitude : ""}
                onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Ex : 14.716677"
                className={inputCls}
              />
              {errors.latitude && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.latitude}</p>}
            </div>
            <div>
              <label className={labelCls}>Longitude *</label>
              <input
                type="number"
                step="any"
                value={longitude !== null ? longitude : ""}
                onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Ex : -17.467686"
                className={inputCls}
              />
              {errors.longitude && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.longitude}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-10 rounded-xl bg-[#D4A843] text-sm font-semibold text-[#0C1A35] hover:bg-[#C89A3A] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function QuartiersPage() {
  const { data: paysList = [] } = useAllPaysAdmin();
  const [filterPaysId, setFilterPaysId] = useState<string>("");
  const [filterVilleId, setFilterVilleId] = useState<string>("");

  const { data: villesFilter = [] } = useAllVillesAdmin(filterPaysId || undefined);
  const { data: quartiers = [], isLoading } = useAllQuartiersAdmin(filterVilleId || undefined);
  const deleteQuartier = useDeleteQuartier();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Quartier | undefined>();
  const [toDelete, setToDelete] = useState<Quartier | null>(null);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteQuartier.mutateAsync(toDelete.id);
      toast.success("Quartier supprimé");
    } catch (err: unknown) {
      toast.error("Erreur lors de la suppression du quartier");
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", to: "/admin/dashboard" }, { label: "Géographie" }, { label: "Quartiers" }]} />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4A843] mb-1">
            <Navigation className="w-3.5 h-3.5" /> Géographie
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0C1A35]">Quartiers</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Gérez la liste des quartiers et leurs coordonnées GPS.
          </p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setShowForm(true); }}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#D4A843] text-sm font-semibold text-[#0C1A35] hover:bg-[#C89A3A] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Ajouter un quartier
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <select
            value={filterPaysId}
            onChange={(e) => { setFilterPaysId(e.target.value); setFilterVilleId(""); }}
            className="h-10 pl-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#D4A843]/60 transition-all cursor-pointer appearance-none min-w-40"
          >
            <option value="">Tous les pays</option>
            {paysList.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterVilleId}
            onChange={(e) => setFilterVilleId(e.target.value)}
            disabled={!filterPaysId}
            className="h-10 pl-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#D4A843]/60 transition-all cursor-pointer appearance-none min-w-44 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">{filterPaysId ? "Toutes les villes" : "- Sélectionnez un pays -"}</option>
            {villesFilter.map((v) => (
              <option key={v.id} value={v.id}>{v.nom}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : quartiers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Navigation className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Aucun quartier enregistré</p>
            <p className="text-xs mt-1">Commencez par ajouter un quartier.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Quartier</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Ville / Pays</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Latitude</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Longitude</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {quartiers.map((q) => (
                <tr key={q.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-[#0C1A35]">{q.nom}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    {q.ville ? (
                      <span>
                        {q.ville.nom}
                        {q.ville.pays && (
                          <span className="ml-1 text-slate-400">({q.ville.pays.nom})</span>
                        )}
                      </span>
                    ) : ""}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      {q.latitude.toFixed(6)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      {q.longitude.toFixed(6)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditing(q); setShowForm(true); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#D4A843] hover:bg-[#D4A843]/8 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setToDelete(q)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <QuartierForm
          initial={editing}
          paysList={paysList}
          onClose={() => { setShowForm(false); setEditing(undefined); }}
        />
      )}

      {toDelete && (
        <ConfirmModal
          title="Supprimer ce quartier ?"
          message={`"${toDelete.nom}" sera supprimé définitivement.`}
          confirmLabel="Supprimer"
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          isPending={deleteQuartier.isPending}
        />
      )}
    </div>
  );
}
