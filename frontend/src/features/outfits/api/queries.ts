import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as outfitsApi from "@/features/outfits/api/outfitsApi";

const outfitsKey = (favoritesOnly?: boolean) => ["outfits", { favoritesOnly: Boolean(favoritesOnly) }] as const;

export function useOutfits(favoritesOnly?: boolean) {
  return useQuery({
    queryKey: outfitsKey(favoritesOnly),
    queryFn: () => outfitsApi.listOutfits(favoritesOnly),
  });
}

function useInvalidateOutfits() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["outfits"] });
}

export function useSetOutfitFavorite() {
  const invalidate = useInvalidateOutfits();
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: number; isFavorite: boolean }) => outfitsApi.setOutfitFavorite(id, isFavorite),
    onSuccess: invalidate,
  });
}

export function useDeleteOutfit() {
  const invalidate = useInvalidateOutfits();
  return useMutation({
    mutationFn: (id: number) => outfitsApi.deleteOutfit(id),
    onSuccess: invalidate,
  });
}
