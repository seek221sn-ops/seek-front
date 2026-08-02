import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/champs`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export type TypeChamp = "TEXTE" | "NOMBRE" | "SURFACE" | "PRIX" | "BOOLEEN" | "SELECT" | "DATE";

export const TYPE_CHAMP_LABELS: Record<TypeChamp, string> = {
  TEXTE:   "Texte",
  NOMBRE:  "Nombre",
  SURFACE: "Surface (m²)",
  PRIX:    "Prix",
  BOOLEEN: "Oui / Non",
  SELECT:  "Liste de choix",
  DATE:    "Date",
};

export interface Champ {
  id: string;
  nom: string;
  type: TypeChamp;
  unite: string | null;
  options: string[];
  categorieId: string;
  categorie: { id: string; nom: string };
  actif: boolean;
  /** Non nul pour un champ "système" (Surface, Chambres...) mappé à une colonne Bien — non modifiable/supprimable */
  cleSysteme: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChampPayload {
  nom: string;
  type: TypeChamp;
  unite?: string | null;
  options?: string[];
  categorieId: string;
}

export const fetchChamps = () =>
  api.get<{ data: Champ[] }>("/").then((r) => r.data.data);

export const fetchChampsAdmin = () =>
  api.get<{ data: Champ[] }>("/admin").then((r) => r.data.data);

export const createChamp = (payload: CreateChampPayload) =>
  api.post<{ data: Champ }>("/", payload).then((r) => r.data.data);

export const updateChamp = (id: string, payload: Partial<CreateChampPayload & { actif: boolean }>) =>
  api.put<{ data: Champ }>(`/${id}`, payload).then((r) => r.data.data);

export const deleteChamp = (id: string) =>
  api.delete(`/${id}`);
