import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFavorisApi, removeFavoriApi, type FavoriItem } from "@/api/favori";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";

const QK = "public-favoris";

/** Liste des favoris - ne s'exécute que si authentifié */
export function useFavorisList() {
  const { isAuthenticated } = useComptePublicAuth();
  return useQuery<FavoriItem[]>({
    queryKey: [QK],
    queryFn: getFavorisApi,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

/** Supprimer un favori */
export function useRemoveFavori() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bienId: string) => removeFavoriApi(bienId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
