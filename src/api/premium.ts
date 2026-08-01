import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/premium`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormulePremium {
  id: string;
  nom: string;
  dureeJours: number;
  prix: number;
  accroche: string;
  description: string;
  idealPour: string[];
  populer: boolean;
}

export interface MoyenPaiement {
  id: string;
  nom: string;
  logo: string;
  description: string;
  couleur: string;
}

export interface PaiementResult {
  transactionId: string;
  montant: number;
  modePaiement: string;
  datePaiement: string;
}

export interface PromotionResult {
  bienId: string;
  estMisEnAvant: boolean;
  dateDebutPromotion: string | null;
  dateFinPromotion: string | null;
}

export interface PremiumResponse {
  status: string;
  message: string;
  data: {
    paiement: PaiementResult;
    promotion: PromotionResult;
  };
}

export interface FormulesResponse {
  status: string;
  message: string;
  data: {
    formules: FormulePremium[];
    moyenPaiement: MoyenPaiement[];
  };
}

// Types pour l'historique des mises en avant
export interface PromotionHistory {
  id: string;
  bienId: string;
  proprietaireId: string;
  transactionId: string | null;
  formuleId: string;
  formuleNom: string;
  dureeJours: number;
  montant: number;
  dateDebut: string;
  dateFin: string;
  dateFinReelle: string | null;
  statut: "ACTIVE" | "TERMINEE" | "ARRETEE" | "EXPIREE";
  motifArret: string | null;
  joursRestants: number | null;
  createdAt: string;
  bien?: {
    id: string;
    titre: string;
    photos: string[];
    ville: string | null;
    quartier: string | null;
  };
  proprietaire?: {
    id: string;
    prenom: string;
    nom: string;
    telephone: string;
  };
}

export interface HistoriqueResponse {
  status: string;
  message: string;
  data: PromotionHistory[];
}

export interface HistoriquePaginatedResponse {
  status: string;
  message: string;
  data: {
    data: PromotionHistory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface PromotionStatus {
  bienId: string;
  estMisEnAvant: boolean;
  dateDebutPromotion: string | null;
  dateFinPromotion: string | null;
  joursRestants: number;
}

export interface PlacesDisponibles {
  placesMax: number;
  placesUtilisees: number;
  placesDisponibles: number;
  prochaineLiberation: string | null;
}

// ─── API Calls : formules & paiement ──────────────────────────────────────────

/**
 * Récupère les formules premium et les moyens de paiement disponibles
 */
export const getFormulesPremium = (): Promise<{ formules: FormulePremium[]; moyenPaiement: MoyenPaiement[] }> =>
  api.get<{ status: string; message: string; data: { formules: FormulePremium[]; moyenPaiement: MoyenPaiement[] } }>("/formules").then((r) => r.data.data);

/**
 * Simule le paiement et active la mise en avant (vérifie d'abord la place disponible)
 */
export const payerEtActiverPremium = (
  bienId: string,
  formuleId: string,
  modePaiement: string,
): Promise<PremiumResponse> =>
  api
    .post<{ data: PremiumResponse }>(`/${bienId}/payer`, { formuleId, modePaiement })
    .then((r) => r.data.data);

/**
 * Récupère les moyens de paiement disponibles
 */
export const getMoyensPaiement = (): Promise<MoyenPaiement[]> =>
  api.get<{ data: MoyenPaiement[] }>("/paiements").then((r) => r.data.data);

/**
 * Arrête la mise en avant d'un bien
 */
export const arreterPremium = (
  bienId: string,
): Promise<{ success: boolean; message: string }> =>
  api
    .post<{ data: { success: boolean; message: string } }>(`/${bienId}/arreter`, {})
    .then((r) => r.data.data);

/**
 * Récupère le statut de mise en avant d'un bien
 */
export const getPromotionStatus = (bienId: string): Promise<PromotionStatus> =>
  api.get<{ data: PromotionStatus }>(`/${bienId}/statut`).then((r) => r.data.data);

/**
 * Récupère l'état des places de mise en avant disponibles (5 max)
 */
export const getPlacesDisponibles = (): Promise<PlacesDisponibles> =>
  api.get<{ data: PlacesDisponibles }>("/places").then((r) => r.data.data);

/**
 * Récupère l'historique des mises en avant d'un bien
 */
export const getHistoriqueMisesEnAvant = (
  bienId: string,
): Promise<PromotionHistory[]> =>
  api
    .get<{ data: PromotionHistory[] }>(`/${bienId}/historique`)
    .then((r) => r.data.data);

/**
 * Récupère l'historique de tous les paiements premium du propriétaire
 */
export const getHistoriquePaiementsPremium = (
  page?: number,
  limit?: number
): Promise<{ data: PromotionHistory[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> =>
  api
    .get<{ data: { data: PromotionHistory[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }>("/historique", {
      params: { page, limit },
    })
    .then((r) => r.data.data);

// ─── API Calls : page d'accueil (public) ──────────────────────────────────────

export interface AnnonceMiseEnAvant {
  id: string;
  titre: string | null;
  description: string | null;
  prix: number | null;
  photos: string[];
  ville: string | null;
  quartier: string | null;
  surface: number | null;
  nbChambres: number | null;
  nbSdb: number | null;
  typeLogement: { id: string; nom: string; slug: string } | null;
  typeTransaction: { id: string; nom: string; slug: string } | null;
  statutBien: { id: string; nom: string; slug: string } | null;
  estMisEnAvant: boolean;
  dateDebutPromotion: string | null;
  dateFinPromotion: string | null;
  proprietaire: { id: string; prenom: string; nom: string; telephone: string; email: string | null; statutVerification?: "NOT_VERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" };
  nombreAnnoncesProprietaire?: number;
}

export interface MiseEnAvantResponse {
  annonces: AnnonceMiseEnAvant[];
  total: number;
  placesDisponibles: number;
}

/**
 * Récupère les annonces mises en avant pour la page d'accueil (public)
 */
export const fetchAnnoncesMiseEnAvant = (limit: number = 5): Promise<MiseEnAvantResponse> =>
  api
    .get<{ data: MiseEnAvantResponse }>("/accueil", { params: { limit } })
    .then((r) => r.data.data);

// ─── Admin CRUD FormulePremium ────────────────────────────────────────────────

export interface FormulePremiumFull extends FormulePremium {
  code: string;
  accroche: string;
  description: string;
  idealPour: string[];
  actif: boolean;
  ordre: number;
}

export const adminGetFormules = (): Promise<FormulePremiumFull[]> =>
  api.get<{ data: FormulePremiumFull[] }>("/admin/formules").then((r) => r.data.data);

export const adminCreateFormule = (data: Partial<FormulePremiumFull>): Promise<FormulePremiumFull> =>
  api.post<{ data: FormulePremiumFull }>("/admin/formules", data).then((r) => r.data.data);

export const adminUpdateFormule = (id: string, data: Partial<FormulePremiumFull>): Promise<FormulePremiumFull> =>
  api.put<{ data: FormulePremiumFull }>(`/admin/formules/${id}`, data).then((r) => r.data.data);

export const adminDeleteFormule = (id: string): Promise<void> =>
  api.delete(`/admin/formules/${id}`).then(() => undefined);

// ─── Admin historique / stats mise en avant ───────────────────────────────────

export interface AdminPromotionStats {
  total: number;
  actives: number;
  montantTotal: number;
  montantMois: number;
  parFormule: { formuleNom: string; count: number; montant: number }[];
}

export const adminGetHistoriquePromotions = (params?: {
  page?: number;
  limit?: number;
  statut?: string;
  proprietaireId?: string;
}): Promise<{ data: PromotionHistory[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> =>
  api
    .get<{ data: { data: PromotionHistory[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }>("/admin/historique", { params })
    .then((r) => r.data.data);

export const adminGetStatsPromotions = (): Promise<AdminPromotionStats> =>
  api.get<{ data: AdminPromotionStats }>("/admin/stats").then((r) => r.data.data);

export const adminArreterPromotion = (id: string, motif?: string): Promise<{ success: boolean; message: string }> =>
  api.post<{ data: { success: boolean; message: string } }>(`/admin/${id}/arreter`, { motif }).then((r) => r.data.data);

export const adminTraiterExpires = (): Promise<{ traite: number }> =>
  api.post<{ data: { traite: number } }>("/admin/traiter-expires", {}).then((r) => r.data.data);
