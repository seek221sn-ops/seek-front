import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMeublesForTypeLogement,
  fetchMeublesAdminState,
  setMeublesForTypeLogement,
} from "@/api/typeLogementMeuble";

const QK = "type-logement-meubles";

export const useMeublesForTypeLogement = (typeLogementId: string) =>
  useQuery({
    queryKey: [QK, typeLogementId],
    queryFn: () => fetchMeublesForTypeLogement(typeLogementId),
    enabled: !!typeLogementId,
    staleTime: 5 * 60 * 1000,
  });

export const useMeublesAdminState = (typeLogementId: string) =>
  useQuery({
    queryKey: [QK, typeLogementId, "admin"],
    queryFn: () => fetchMeublesAdminState(typeLogementId),
    enabled: !!typeLogementId,
  });

export const useSetMeublesForTypeLogement = (typeLogementId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meubleIds: string[]) => setMeublesForTypeLogement(typeLogementId, meubleIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK, typeLogementId] });
      qc.invalidateQueries({ queryKey: [QK, typeLogementId, "admin"] });
    },
  });
};
