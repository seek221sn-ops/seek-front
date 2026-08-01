import { useQuery } from "@tanstack/react-query";
import { fetchAnnoncesMiseEnAvant, type AnnonceMiseEnAvant, type MiseEnAvantResponse } from "@/api/premium";

// Places plafonnées (5), pas de rotation - refetch périodique pour rester à jour
const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

export const useAnnoncesMiseEnAvant = (limit: number = 5) =>
  useQuery<MiseEnAvantResponse>({
    queryKey: ["annonces-mise-en-avant", limit],
    queryFn: () => fetchAnnoncesMiseEnAvant(limit),
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
    retry: 1,
  });

// Type exporté pour utilisation dans les composants
export type { AnnonceMiseEnAvant };
