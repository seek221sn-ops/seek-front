import axios from "axios";
import type { TypeChamp } from "./champ";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/types-logement`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export interface ChampAvecCategorie {
  id: string;
  nom: string;
  type: TypeChamp;
  unite: string | null;
  options: string[];
  categorieId: string;
  categorie: { id: string; nom: string; ordre: number };
  actif: boolean;
  /** Non nul pour un champ "système" (Surface, Chambres...) mappé à une colonne Bien */
  cleSysteme: string | null;
}

export interface TypeLogementChampConfig {
  typeLogementId: string;
  champId: string;
  obligatoire: boolean;
  ordre: number;
  champ: ChampAvecCategorie;
}

export interface ChampWithState extends ChampAvecCategorie {
  typeLogements: { obligatoire: boolean; ordre: number }[];
}

export const fetchChampsForTypeLogement = (typeLogementId: string) =>
  api
    .get<{ data: TypeLogementChampConfig[] }>(`/${typeLogementId}/champs`)
    .then((r) => r.data.data);

export const fetchChampsAdminState = (typeLogementId: string) =>
  api
    .get<{ data: ChampWithState[] }>(`/${typeLogementId}/champs/admin`)
    .then((r) => r.data.data);

export const setChampsForTypeLogement = (
  typeLogementId: string,
  champs: { champId: string; obligatoire: boolean; ordre: number }[]
) =>
  api
    .put<{ data: null }>(`/${typeLogementId}/champs`, { champs })
    .then((r) => r.data);
