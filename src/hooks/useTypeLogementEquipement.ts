import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEquipementsForTypeLogement,
  fetchEquipementsAdminState,
  setEquipementsForTypeLogement,
} from "@/api/typeLogementEquipement";

const QK = "type-logement-equipements";

export const useEquipementsForTypeLogement = (typeLogementId: string) =>
  useQuery({
    queryKey: [QK, typeLogementId],
    queryFn: () => fetchEquipementsForTypeLogement(typeLogementId),
    enabled: !!typeLogementId,
    staleTime: 5 * 60 * 1000,
  });

export const useEquipementsAdminState = (typeLogementId: string) =>
  useQuery({
    queryKey: [QK, typeLogementId, "admin"],
    queryFn: () => fetchEquipementsAdminState(typeLogementId),
    enabled: !!typeLogementId,
  });

export const useSetEquipementsForTypeLogement = (typeLogementId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (equipementIds: string[]) => setEquipementsForTypeLogement(typeLogementId, equipementIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK, typeLogementId] });
      qc.invalidateQueries({ queryKey: [QK, typeLogementId, "admin"] });
    },
  });
};
