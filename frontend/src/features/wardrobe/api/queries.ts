import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as wardrobeApi from "@/features/wardrobe/api/wardrobeApi";
import type { ClothingItemInput } from "@/types/wardrobe";

const itemsKey = ["wardrobe", "items"] as const;
const taxonomyKey = ["wardrobe", "taxonomy"] as const;

export function useWardrobeItems() {
  return useQuery({ queryKey: itemsKey, queryFn: () => wardrobeApi.listClothingItems() });
}

export function useTaxonomy() {
  return useQuery({ queryKey: taxonomyKey, queryFn: wardrobeApi.getTaxonomy, staleTime: Infinity });
}

export function useAnalyzePhoto() {
  return useMutation({ mutationFn: wardrobeApi.analyzePhoto });
}

export function useCreateClothingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stagingToken, payload }: { stagingToken: string; payload: ClothingItemInput }) =>
      wardrobeApi.createClothingItem(stagingToken, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsKey }),
  });
}

export function useUpdateClothingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ClothingItemInput> }) =>
      wardrobeApi.updateClothingItem(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsKey }),
  });
}

export function useDeleteClothingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => wardrobeApi.deleteClothingItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsKey }),
  });
}

export function useMarkWorn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => wardrobeApi.markWorn(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsKey }),
  });
}
