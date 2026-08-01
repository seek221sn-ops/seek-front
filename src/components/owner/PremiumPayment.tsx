import { useState, useEffect } from "react";
import { Star, Clock, AlertCircle, CheckCircle, XCircle, Sparkles, X, Smartphone, AlertTriangle } from "lucide-react";
import {
  usePromotionStatus,
  usePlacesDisponibles,
  useFormulesPremium,
  usePayerPremium,
  useArreterPremium,
  type FormulePremium,
  type MoyenPaiement,
} from "@/hooks/usePremium";
import { useOwnerAuth } from "@/context/OwnerAuthContext";

interface PremiumPaymentProps {
  bienId: string;
  bienTitre: string;
  onSuccess?: () => void;
}

type ModalType = "select-formule" | "select-paiement" | "success" | "error" | "arreter" | null;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4A843] mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  onConfirm,
  confirmLabel,
  isPending,
  showCancel = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  isPending?: boolean;
  showCancel?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!onConfirm) return;
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Fermer">
          <XCircle className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold text-[#0C1A35] pr-8">{title}</h2>
        <div className="text-sm text-slate-600">{children}</div>
        <div className="flex justify-end gap-2 mt-2">
          {showCancel && (
            <button onClick={onClose} disabled={isPending} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50">
              Annuler
            </button>
          )}
          {onConfirm && confirmLabel && (
            <button onClick={handleConfirm} disabled={isPending || isLoading} className="px-4 py-2 rounded-xl text-sm font-medium bg-[#D4A843] text-white hover:bg-[#c49a3a] disabled:opacity-50 inline-flex items-center gap-2">
              {(isPending || isLoading) && <Sparkles className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FormuleCard({
  formule,
  isSelected,
  onSelect,
}: {
  formule: FormulePremium;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative p-4 rounded-xl border-2 text-left transition-all w-full ${
        isSelected
          ? "border-[#D4A843] bg-amber-50"
          : "border-slate-200 hover:border-slate-300 bg-white"
      }`}
    >
      {formule.populer && (
        <span className="absolute -top-2 right-2 px-2 py-0.5 bg-[#D4A843] text-white text-xs font-medium rounded-full">
          Recommandée
        </span>
      )}
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-semibold text-[#0C1A35]">{formule.nom}</h4>
        <span className="text-lg font-bold text-[#D4A843]">{formule.prix.toLocaleString()} fcfa</span>
      </div>
      <p className="text-xs text-slate-500 mb-1">Durée : {formule.dureeJours} jours</p>
      <p className="text-sm font-medium text-amber-700 mb-2">{formule.accroche}</p>
      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{formule.description}</p>
      {formule.idealPour && formule.idealPour.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {formule.idealPour.slice(0, 2).map((item, idx) => (
            <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
              {item}
            </span>
          ))}
        </div>
      )}
      {isSelected && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-[#D4A843] rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
}

function MoyenPaiementCard({
  moyen,
  isSelected,
  onSelect,
}: {
  moyen: MoyenPaiement;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isOrange = moyen.couleur === "orange";
  const isWave = moyen.couleur === "bleu";

  return (
    <button
      onClick={onSelect}
      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
        isSelected
          ? "border-[#D4A843] bg-amber-50"
          : "border-slate-200 hover:border-slate-300 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isOrange ? "bg-orange-100" : isWave ? "bg-blue-100" : "bg-slate-100"
        }`}>
          <Smartphone className={`w-6 h-6 ${isOrange ? "text-orange-600" : isWave ? "text-blue-600" : "text-slate-600"}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-[#0C1A35]">{moyen.nom}</h4>
          <p className="text-sm text-slate-500">{moyen.description}</p>
        </div>
      </div>
      {isSelected && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-[#D4A843] rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
}

export default function PremiumPayment({ bienId, bienTitre, onSuccess }: PremiumPaymentProps) {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedFormule, setSelectedFormule] = useState<FormulePremium | null>(null);
  const [selectedPaiement, setSelectedPaiement] = useState<string | null>(null);
  const [paiementResult, setPaiementResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: formulesData, isLoading: loadingFormules } = useFormulesPremium();
  const { data: status, isLoading: loadingStatus } = usePromotionStatus(bienId);
  const { data: places } = usePlacesDisponibles();
  const payerMutation = usePayerPremium();
  const arreterMutation = useArreterPremium();
  const { owner } = useOwnerAuth();

  const formules = formulesData?.formules || [];
  const moyensPaiement = formulesData?.moyenPaiement || [];

  const isPromoted = status?.estMisEnAvant ?? false;
  const joursRestants = status?.joursRestants ?? 0;
  const isTerminee = !isPromoted && status?.dateFinPromotion && new Date(status.dateFinPromotion) < new Date();
  const peutRenouveler = !isPromoted && (!status?.dateFinPromotion || isTerminee);

  useEffect(() => {
    if (modalType === "select-formule") {
      setSelectedFormule(null);
      setSelectedPaiement(null);
      setErrorMessage(null);
    }
  }, [modalType]);

  const handleOpenPayment = () => {
    if (!selectedFormule) return;
    setModalType("select-paiement");
  };

  const handlePayer = async () => {
    if (!selectedFormule || !selectedPaiement || !owner) return;

    payerMutation.mutate(
      { bienId, formuleId: selectedFormule.id, modePaiement: selectedPaiement },
      {
        onSuccess: (data) => {
          setPaiementResult(data);
          setModalType("success");
          onSuccess?.();
        },
        onError: (error: any) => {
          setErrorMessage(error?.response?.data?.message ?? null);
          setModalType("error");
        },
      }
    );
  };

  const handleCloseSuccess = () => {
    setModalType(null);
    setSelectedFormule(null);
    setSelectedPaiement(null);
    setPaiementResult(null);
  };

  const handleOpenArreter = () => {
    setModalType("arreter");
  };

  const handleArreter = async () => {
    if (!owner) return;

    arreterMutation.mutate(
      { bienId },
      {
        onSuccess: () => {
          setModalType(null);
          onSuccess?.();
        },
        onError: (error: any) => {
          console.error('Erreur arrêt:', error);
        },
      }
    );
  };

  if (loadingFormules || loadingStatus) {
    return (
      <Section title="Mise en avant Premium">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      </Section>
    );
  }

  return (
    <>
      <Section title="Mise en avant Premium">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPromoted ? "bg-amber-100" : "bg-slate-100"}`}>
                {isPromoted ? <Sparkles className="w-5 h-5 text-amber-600" /> : <Star className="w-5 h-5 text-slate-400" />}
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  {isPromoted ? "Apparaît en priorité" : "Apparaît en priorité"}
                </p>
              </div>
            </div>
            {isPromoted ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3" /> Actif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                <XCircle className="w-3 h-3" /> Inactif
              </span>
            )}
          </div>

          {/* Places disponibles */}
          {places && !isPromoted && (
            <p className="text-xs text-slate-500">
              {places.placesDisponibles > 0
                ? `${places.placesUtilisees}/${places.placesMax} places de mise en avant utilisées`
                : `Toutes les places sont occupées (${places.placesMax}/${places.placesMax})${
                    places.prochaineLiberation
                      ? ` — prochaine place le ${new Date(places.prochaineLiberation).toLocaleDateString("fr-FR")}`
                      : ""
                  }`}
            </p>
          )}

          {/* Expiration info */}
          {isPromoted && status?.dateFinPromotion && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">
                Expire le {new Date(status.dateFinPromotion).toLocaleDateString("fr-FR")}
                {joursRestants > 0 && (
                  <span className="text-[#D4A843] font-medium"> ({joursRestants} jour{joursRestants > 1 ? "s" : ""})</span>
                )}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {isPromoted ? (
              // En cours - afficher Arrêter
              <button
                onClick={handleOpenArreter}
                disabled={arreterMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Arrêter
              </button>
            ) : (
              // Pas en cours - afficher Mettre en avant ou Renouveler
              <button
                onClick={() => setModalType("select-formule")}
                disabled={payerMutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#D4A843] text-white rounded-xl text-sm font-medium hover:bg-[#c49a3a] disabled:opacity-50"
              >
                <Star className="w-4 h-4" />
                {peutRenouveler ? "Renouveler" : "Mettre en avant"}
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* Modal Sélection Formule */}
      <Modal
        open={modalType === "select-formule"}
        onClose={() => setModalType(null)}
        title="FORMULES DE MISE EN AVANT D'UNE ANNONCE"
        showCancel={false}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Sélectionnez la durée de mise en avant pour « <strong>{bienTitre}</strong> »
          </p>

          {loadingFormules ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-200 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {formules.map((formule) => (
                <FormuleCard
                  key={formule.id}
                  formule={formule}
                  isSelected={selectedFormule?.id === formule.id}
                  onSelect={() => setSelectedFormule(formule)}
                />
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleOpenPayment}
              disabled={!selectedFormule}
              className="px-6 py-2 bg-[#0C1A35] text-white rounded-xl text-sm font-medium hover:bg-[#162540] disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Sélection Paiement */}
      <Modal
        open={modalType === "select-paiement"}
        onClose={() => setModalType(null)}
        title="Mode de paiement"
        onConfirm={handlePayer}
        confirmLabel="Payer maintenant"
        isPending={payerMutation.isPending}
      >
        <div className="space-y-4">
          {/* Résumé */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Formule</span>
              <span className="text-sm font-medium text-[#0C1A35]">{selectedFormule?.nom}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total</span>
              <span className="text-lg font-bold text-[#D4A843]">{selectedFormule?.prix.toLocaleString()} fcfa</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sélectionnez un moyen de paiement</label>
            <div className="space-y-3">
              {moyensPaiement.map((moyen) => (
                <MoyenPaiementCard
                  key={moyen.id}
                  moyen={moyen}
                  isSelected={selectedPaiement === moyen.id}
                  onSelect={() => setSelectedPaiement(moyen.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Succès */}
      <Modal
        open={modalType === "success"}
        onClose={handleCloseSuccess}
        title="Paiement réussi !"
        showCancel={false}
        confirmLabel="Fermer"
        onConfirm={handleCloseSuccess}
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-slate-600 mb-4">
            Votre annonce « <strong>{bienTitre}</strong> » est maintenant mise en avant !
          </p>

          {paiementResult && (
            <div className="p-4 bg-slate-50 rounded-xl text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Transaction</span>
                <span className="font-mono text-xs">{paiementResult.paiement.transactionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Montant</span>
                <span className="font-medium">{paiementResult.paiement.montant.toLocaleString()} fcfa</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Durée</span>
                <span className="font-medium">{selectedFormule?.dureeJours} jours</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Expire le</span>
                <span className="font-medium">
                  {paiementResult.promotion.dateFinPromotion &&
                    new Date(paiementResult.promotion.dateFinPromotion).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Erreur */}
      <Modal
        open={modalType === "error"}
        onClose={() => setModalType(null)}
        title="Erreur de paiement"
        confirmLabel="Réessayer"
        onConfirm={() => setModalType("select-formule")}
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-slate-600">
            {errorMessage ?? "Une erreur s'est produite lors du paiement. Veuillez réessayer."}
          </p>
        </div>
      </Modal>

      {/* Modal Arrêter la mise en avant */}
      <Modal
        open={modalType === "arreter"}
        onClose={() => setModalType(null)}
        title="Arrêter la mise en avant"
        onConfirm={handleArreter}
        confirmLabel="Confirmer l'arrêt"
        isPending={arreterMutation.isPending}
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-slate-600 mb-2">
            Êtes-vous sûr de vouloir arrêter la mise en avant de cette annonce ?
          </p>
          <div className="p-3 bg-red-50 rounded-xl text-left">
            <div className="flex items-start gap-2 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Attention :</strong> Vous perdrez les <span className="font-bold">{joursRestants} jour{joursRestants > 1 ? "s" : ""}</span> restants de mise en avant. Cette action est irréversible.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
