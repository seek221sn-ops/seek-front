import axios from "axios";

const RAW_API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const API_URL = RAW_API_URL.endsWith("/api") ? RAW_API_URL : `${RAW_API_URL}/api`;

// ─── --Types ───────────────────────────────────────────────────────────────────

export interface AlertePayload {
  telephone: string;
  typeLogement?: string;
  typeTransaction?: string;
  ville?: string;
  quartier?: string;
  prixMin?: number;
  prixMax?: number;
  canalPrefere?: "SMS" | "WHATSAPP";
}

export interface AlerteComptePayload {
  typeLogement?: string;
  typeTransaction?: string;
  ville?: string;
  quartier?: string;
  prixMin?: number;
  prixMax?: number;
  canalPrefere?: "SMS" | "WHATSAPP";
}

export interface Alerte {
  id: string;
  telephone: string;
  comptePublicId: string | null;
  ville: string | null;
  quartier: string | null;
  typeLogement: string | null;
  typeTransaction: string | null;
  prixMin: number | null;
  prixMax: number | null;
  canalPrefere: string;
  statut: "ACTIVE" | "DESACTIVE";
  createdAt: string;
  updatedAt: string;
}

// ─── Axios instance avec credentials (cookies) ───────────────────────────────

const apiAuth = axios.create({
  baseURL: `${API_URL}/alertes`,
  withCredentials: true,
});

// ─── Public (sans compte) ────────────────────────────────────────────────────

export const creerAlerte = async (payload: AlertePayload) => {
  const response = await axios.post(`${API_URL}/alertes`, payload);
  return response.data;
};

export const desactiverAlerte = async (telephone: string) => {
  const response = await axios.post(`${API_URL}/alertes/desactiver`, { telephone });
  return response.data;
};

// ─── Compte authentifié ──────────────────────────────────────────────────────

export const getMesAlertesApi = async (): Promise<Alerte[]> => {
  const res = await apiAuth.get<{ success: boolean; data: Alerte[] }>("/mes-alertes");
  return res.data.data;
};

export const creerAlerteCompteApi = async (payload: AlerteComptePayload): Promise<Alerte> => {
  const res = await apiAuth.post<{ success: boolean; data: Alerte }>("/compte", payload);
  return res.data.data;
};

export const activerAlerteApi = async (id: string): Promise<Alerte> => {
  const res = await apiAuth.patch<{ success: boolean; data: Alerte }>(`/${id}/activer`);
  return res.data.data;
};

export const desactiverAlerteApi = async (id: string): Promise<Alerte> => {
  const res = await apiAuth.patch<{ success: boolean; data: Alerte }>(`/${id}/desactiver`);
  return res.data.data;
};

export const supprimerAlerteApi = async (id: string): Promise<void> => {
  await apiAuth.delete(`/${id}`);
};
