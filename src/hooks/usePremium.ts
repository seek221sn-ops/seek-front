import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFormulesPremium,
  payerEtActiverPremium,
  arreterPremium,
  getPromotionStatus,
  getPlacesDisponibles,
  adminGetFormules,
  adminCreateFormule,
  adminUpdateFormule,
  adminDeleteFormule,
  adminGetHistoriquePromotions,
  adminGetStatsPromotions,
  adminArreterPromotion,
  adminTraiterExpires,
  type FormulePremium,
  type FormulePremiumFull,
  type MoyenPaiement
} from "@/api/premium";
import {
  getHistoriqueTransactions,
  getAdminHistoriqueTransactions,
  getAdminStatsTransactions,
  type Transaction
} from "@/api/transaction";
import { toast } from "sonner";

/**
 * Hook pour récupérer l'état des places de mise en avant disponibles (5 max)
 */
export const usePlacesDisponibles = () => {
  return useQuery({
    queryKey: ["places-mise-en-avant"],
    queryFn: getPlacesDisponibles,
  });
};

/**
 * Hook pour récupérer le statut de mise en avant d'un bien
 */
export const usePromotionStatus = (bienId: string) => {
  return useQuery({
    queryKey: ["promotion-status", bienId],
    queryFn: () => getPromotionStatus(bienId),
    enabled: !!bienId,
  });
};

/**
 * Hook pour récupérer les formules premium et les moyens de paiement
 */
export const useFormulesPremium = () => {
  return useQuery({
    queryKey: ["formules-premium"],
    queryFn: getFormulesPremium,
  });
};

/**
 * Hook pour payer et activer la mise en avant premium
 */
export const usePayerPremium = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bienId, formuleId, modePaiement }: { bienId: string; formuleId: string; modePaiement: string }) =>
      payerEtActiverPremium(bienId, formuleId, modePaiement),
    onSuccess: () => {
      toast.success("Paiement effectué avec succès ! Votre annonce est maintenant mise en avant.");
      queryClient.invalidateQueries({ queryKey: ["biens"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-status"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-stats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["places-mise-en-avant"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Erreur lors du paiement");
    },
  });
};

/**
 * Hook pour arrêter la mise en avant premium
 */
export const useArreterPremium = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bienId }: { bienId: string }) => arreterPremium(bienId),
    onSuccess: (data) => {
      toast.success("Mise en avant arrêtée avec succès.");
      queryClient.invalidateQueries({ queryKey: ["biens"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-status"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-stats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["places-mise-en-avant"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'arrêt de la mise en avant");
    },
  });
};

/**
 * Hook pour récupérer l'historique de tous les paiements du propriétaire
 */
export const useHistoriqueTransactions = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: ["transactions", page, limit],
    queryFn: () => getHistoriqueTransactions(page, limit),
  });
};

// ─── Admin Formules Premium ───────────────────────────────────────────────────

export const useAdminFormules = () =>
  useQuery({ queryKey: ["admin-formules"], queryFn: adminGetFormules });

export const useAdminCreateFormule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FormulePremiumFull>) => adminCreateFormule(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-formules"] }),
  });
};

export const useAdminUpdateFormule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormulePremiumFull> }) => adminUpdateFormule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-formules"] }),
  });
};

export const useAdminDeleteFormule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDeleteFormule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-formules"] }),
  });
};

// ─── Admin Historique Promotions ──────────────────────────────────────────────

export const useAdminHistoriquePromotions = (params?: {
  page?: number;
  limit?: number;
  statut?: string;
  proprietaireId?: string;
}) =>
  useQuery({
    queryKey: ["admin-historique-promotions", params],
    queryFn: () => adminGetHistoriquePromotions(params),
  });

export const useAdminStatsPromotions = () =>
  useQuery({ queryKey: ["admin-stats-promotions"], queryFn: adminGetStatsPromotions });

// ─── Admin Historique Transactions ────────────────────────────────────────────

export const useAdminHistoriqueTransactions = (params?: {
  page?: number;
  limit?: number;
  type?: string;
  statut?: string;
  proprietaireId?: string;
  dateDebut?: string;
  dateFin?: string;
  search?: string;
}) =>
  useQuery({
    queryKey: ["admin-historique-transactions", params],
    queryFn: () => getAdminHistoriqueTransactions(params),
  });

export const useAdminStatsTransactions = () =>
  useQuery({ queryKey: ["admin-stats-transactions"], queryFn: getAdminStatsTransactions });

// ─── Admin Arrêt Promotion ────────────────────────────────────────────────────

export const useAdminArreterPromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif?: string }) => adminArreterPromotion(id, motif),
    onSuccess: () => {
      toast.success("Promotion arrêtée, propriétaire notifié");
      qc.invalidateQueries({ queryKey: ["admin-historique-promotions"] });
      qc.invalidateQueries({ queryKey: ["admin-stats-promotions"] });
    },
    onError: () => toast.error("Erreur lors de l'arrêt de la promotion"),
  });
};

export const useAdminTraiterExpires = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminTraiterExpires,
    onSuccess: (data) => {
      toast.success(`${data.traite} promotion(s) expirée(s) traitée(s)`);
      qc.invalidateQueries({ queryKey: ["admin-historique-promotions"] });
    },
    onError: () => toast.error("Erreur lors du traitement des expirations"),
  });
};

// Type pour l'affichage
export type { FormulePremium, FormulePremiumFull, MoyenPaiement, Transaction };
