import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Bien } from "@/api/bien";
import { toast } from "sonner";

const MAX_ITEMS = 3;

interface ComparisonContextValue {
  items: Bien[];
  isSelected: (id: string) => boolean;
  toggle: (bien: Bien) => void;
  remove: (id: string) => void;
  clear: () => void;
  isFull: boolean;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Bien[]>([]);

  const isSelected = useCallback((id: string) => items.some((b) => b.id === id), [items]);

  const toggle = useCallback((bien: Bien) => {
    setItems((prev) => {
      if (prev.some((b) => b.id === bien.id)) {
        return prev.filter((b) => b.id !== bien.id);
      }

      if (prev.length > 0 && prev[0].typeLogementId !== bien.typeLogementId) {
        toast.error("Vous ne pouvez comparer que des biens du même type.");
        return prev;
      }

      if (prev.length >= MAX_ITEMS) {
        toast.error("Vous ne pouvez comparer que 3 biens à la fois.");
        return prev;
      }
      return [...prev, bien];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <ComparisonContext.Provider
      value={{ items, isSelected, toggle, remove, clear, isFull: items.length >= MAX_ITEMS }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison(): ComparisonContextValue {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error("useComparison must be used inside <ComparisonProvider>");
  return ctx;
}
