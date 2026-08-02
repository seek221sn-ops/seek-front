import axios from "axios";
import type { Equipement } from "./equipement";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/types-logement`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export interface TypeLogementEquipementConfig {
  typeLogementId: string;
  equipementId: string;
  equipement: Equipement;
}

export interface EquipementWithState extends Equipement {
  typeLogements: { typeLogementId: string }[];
}

export const fetchEquipementsForTypeLogement = (typeLogementId: string) =>
  api
    .get<{ data: TypeLogementEquipementConfig[] }>(`/${typeLogementId}/equipements`)
    .then((r) => r.data.data);

export const fetchEquipementsAdminState = (typeLogementId: string) =>
  api
    .get<{ data: EquipementWithState[] }>(`/${typeLogementId}/equipements/admin`)
    .then((r) => r.data.data);

export const setEquipementsForTypeLogement = (typeLogementId: string, equipementIds: string[]) =>
  api
    .put<{ data: null }>(`/${typeLogementId}/equipements`, { equipementIds })
    .then((r) => r.data);
