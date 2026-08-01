import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  Upload,
  CreditCard,
} from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  useVerificationStatus,
  useSubmitVerification,
  useCancelVerification,
} from "@/hooks/useVerification";
import { uploadVerificationImageApi } from "@/api/ownerAuth";
import type { SubmitVerificationPayload } from "@/api/ownerAuth";
import { toast } from "sonner";

const TYPE_PIECE_OPTIONS = [
  { value: "CNI", label: "CNI (Carte Nationale d'Identité)", requiresVerso: true },
  { value: "PASSEPORT", label: "Passeport", requiresVerso: false },
] as const;

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

interface PhotoPreview {
  file: File;
  preview: string;
}

export default function OwnerVerification() {
  const { data: status, isLoading } = useVerificationStatus();
  const submitVerification = useSubmitVerification();
  const cancelVerification = useCancelVerification();

  const [typePiece, setTypePiece] = useState<"CNI" | "PASSEPORT">("CNI");
  const [pieceIdentiteRecto, setPieceIdentiteRecto] = useState<PhotoPreview | null>(null);
  const [pieceIdentiteVerso, setPieceIdentiteVerso] = useState<PhotoPreview | null>(null);
  const [selfie, setSelfie] = useState<PhotoPreview | null>(null);
  const [conditionsAcceptees, setConditionsAcceptees] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{
    pieceIdentiteRecto?: string;
    pieceIdentiteVerso?: string;
    selfie?: string;
    conditions?: string;
  }>({});

  const rectoInputRef = useRef<HTMLInputElement>(null);
  const versoInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const selectedType = TYPE_PIECE_OPTIONS.find((t) => t.value === typePiece);
  const requiresVerso = selectedType?.requiresVerso ?? true;

  const statut = status?.statut ?? "NOT_VERIFIED";

  const handleFileChange = (
    type: "pieceIdentiteRecto" | "pieceIdentiteVerso" | "selfie",
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, [type]: "Format non supporté. Utilisez JPG, PNG ou WebP." }));
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrors((prev) => ({ ...prev, [type]: "La taille du fichier ne doit pas dépasser 5 Mo." }));
      return;
    }

    const preview = URL.createObjectURL(file);
    if (type === "pieceIdentiteRecto") setPieceIdentiteRecto({ file, preview });
    else if (type === "pieceIdentiteVerso") setPieceIdentiteVerso({ file, preview });
    else setSelfie({ file, preview });

    setErrors((prev) => ({ ...prev, [type]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!pieceIdentiteRecto) newErrors.pieceIdentiteRecto = "Le recto est obligatoire";
    if (requiresVerso && !pieceIdentiteVerso) newErrors.pieceIdentiteVerso = "Le verso est obligatoire pour la CNI";
    if (!selfie) newErrors.selfie = "Veuillez fournir un selfie";
    if (!conditionsAcceptees) newErrors.conditions = "Vous devez accepter les conditions";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsUploading(true);
    toast.info("Upload des documents en cours...");

    try {
      let pieceIdentiteRectoUrl = "";
      let pieceIdentiteVersoUrl = "";
      let selfieUrl = "";

      if (pieceIdentiteRecto?.file) {
        pieceIdentiteRectoUrl = await uploadVerificationImageApi(pieceIdentiteRecto.file);
      }
      if (pieceIdentiteVerso?.file) {
        pieceIdentiteVersoUrl = await uploadVerificationImageApi(pieceIdentiteVerso.file);
      }
      if (selfie?.file) {
        selfieUrl = await uploadVerificationImageApi(selfie.file);
      }

      const payload: SubmitVerificationPayload = {
        typePiece,
        pieceIdentiteRecto: pieceIdentiteRectoUrl,
        pieceIdentiteVerso: pieceIdentiteVersoUrl || undefined,
        selfie: selfieUrl,
        conditionsAcceptees,
      };

      await submitVerification.mutateAsync(payload);
      toast.success("Demande de vérification soumise avec succès");

      setPieceIdentiteRecto(null);
      setPieceIdentiteVerso(null);
      setSelfie(null);
      setConditionsAcceptees(false);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      const message = axiosError.response?.data?.message;
      if (axiosError.response?.status === 413) {
        toast.error("Fichier trop volumineux. Maximum 5 Mo.");
      } else {
        toast.error(message || "Erreur lors de l'upload des documents");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelVerification.mutateAsync();
      toast.success("Demande annulée");
    } catch {
      toast.error("Erreur lors de l'annulation");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4A843]" />
      </div>
    );
  }

  const UploadSlot = ({
    label,
    value,
    inputRef,
    onSelect,
    error,
    aspect = "aspect-[4/3]",
  }: {
    label: string;
    value: PhotoPreview | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onSelect: (files: FileList | null) => void;
    error?: string;
    aspect?: string;
  }) => (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onSelect(e.target.files)}
      />
      {value ? (
        <div className={`relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 ${aspect}`}>
          <img src={value.preview} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-medium hover:bg-black/75 transition-colors"
          >
            Changer
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed ${
            error ? "border-red-300 bg-red-50" : "border-slate-200 hover:border-[#D4A843] hover:bg-[#D4A843]/5"
          } transition-colors ${aspect}`}
        >
          <Upload className="w-6 h-6 text-slate-400" />
          <span className="text-xs text-slate-400">Cliquez pour choisir un fichier</span>
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", to: "/owner/dashboard" },
          { label: "Vérification d'identité" },
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4A843] mb-2">
          <Shield className="w-3.5 h-3.5" />
          Vérification d'identité
        </div>
        <h1 className="font-display text-2xl font-bold text-[#0C1A35]">
          Vérifiez votre identité
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Fournissez une pièce d'identité et un selfie. Un administrateur validera votre demande.
        </p>
      </div>

      {statut === "VERIFIED" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-emerald-800">Compte vérifié</h2>
            <p className="text-sm text-emerald-700 mt-0.5">
              Votre identité a été vérifiée avec succès. Votre badge de confiance est actif.
            </p>
            {status?.verifiedAt && (
              <p className="text-xs text-emerald-600 mt-1">
                Vérifié le {new Date(status.verifiedAt).toLocaleDateString("fr-FR")}
              </p>
            )}
          </div>
        </div>
      )}

      {statut === "PENDING" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-800">Vérification en cours</h2>
              <p className="text-sm text-amber-700 mt-0.5">
                Votre dossier est en cours d'analyse par un administrateur.
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelVerification.isPending}
            className="shrink-0 px-4 py-2 rounded-xl border border-amber-300 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors disabled:opacity-60"
          >
            {cancelVerification.isPending ? "Annulation…" : "Annuler la demande"}
          </button>
        </div>
      )}

      {statut === "REJECTED" && status?.documents?.motifRejet && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <XCircle className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-800">Vérification refusée</h2>
            <p className="text-sm text-red-700 mt-0.5">{status.documents.motifRejet}</p>
          </div>
        </div>
      )}

      {statut !== "VERIFIED" && statut !== "PENDING" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Type de pièce d'identité</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TYPE_PIECE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTypePiece(opt.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      typePiece === opt.value
                        ? "border-[#D4A843] bg-[#D4A843]/10 text-[#0C1A35]"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`grid grid-cols-1 ${requiresVerso ? "sm:grid-cols-2" : ""} gap-4`}>
              <UploadSlot
                label={typePiece === "CNI" ? "CNI - Recto" : "Passeport - Page d'identité"}
                value={pieceIdentiteRecto}
                inputRef={rectoInputRef}
                onSelect={(files) => handleFileChange("pieceIdentiteRecto", files)}
                error={errors.pieceIdentiteRecto}
              />
              {requiresVerso && (
                <UploadSlot
                  label="CNI - Verso"
                  value={pieceIdentiteVerso}
                  inputRef={versoInputRef}
                  onSelect={(files) => handleFileChange("pieceIdentiteVerso", files)}
                  error={errors.pieceIdentiteVerso}
                />
              )}
            </div>

            <div className="max-w-[240px]">
              <UploadSlot
                label="Selfie"
                value={selfie}
                inputRef={selfieInputRef}
                onSelect={(files) => handleFileChange("selfie", files)}
                error={errors.selfie}
                aspect="aspect-square"
              />
            </div>

            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conditionsAcceptees}
                  onChange={(e) => {
                    setConditionsAcceptees(e.target.checked);
                    setErrors((prev) => ({ ...prev, conditions: undefined }));
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#D4A843] focus:ring-[#D4A843]"
                />
                <span className="text-sm text-slate-600">
                  Je certifie que les documents fournis sont authentiques et me concernent.
                </span>
              </label>
              {errors.conditions && <p className="text-xs text-red-500 mt-1">{errors.conditions}</p>}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Vos documents sont examinés manuellement par un administrateur. Le délai de traitement est généralement de 24 à 48h.
            </div>

            <button
              onClick={handleSubmit}
              disabled={isUploading || submitVerification.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#D4A843] hover:bg-[#D4A843]/90 text-[#0C1A35] rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {isUploading || submitVerification.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  {statut === "REJECTED" ? "Soumettre une nouvelle demande" : "Soumettre ma demande"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Link
          to="/owner/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-white hover:text-slate-700 transition-colors"
        >
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}
