import axios from "axios";
import type { Meuble } from "./meuble";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/types-logement`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export interface TypeLogementMeubleConfig {
  typeLogementId: string;
  meubleId: string;
  meuble: Meuble;
}

export interface MeubleWithState extends Meuble {
  typeLogements: { typeLogementId: string }[];
}

export const fetchMeublesForTypeLogement = (typeLogementId: string) =>
  api
    .get<{ data: TypeLogementMeubleConfig[] }>(`/${typeLogementId}/meubles`)
    .then((r) => r.data.data);

export const fetchMeublesAdminState = (typeLogementId: string) =>
  api
    .get<{ data: MeubleWithState[] }>(`/${typeLogementId}/meubles/admin`)
    .then((r) => r.data.data);

export const setMeublesForTypeLogement = (typeLogementId: string, meubleIds: string[]) =>
  api
    .put<{ data: null }>(`/${typeLogementId}/meubles`, { meubleIds })
    .then((r) => r.data);
