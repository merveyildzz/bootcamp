import { apiClient } from "@/lib/apiClient";
import type { Outfit } from "@/types/outfits";

export async function listOutfits(favoritesOnly?: boolean) {
  const { data } = await apiClient.get<Outfit[]>("/outfits", {
    params: favoritesOnly ? { favorite: true } : undefined,
  });
  return data;
}

export async function setOutfitFavorite(id: number, isFavorite: boolean) {
  const { data } = await apiClient.patch<Outfit>(`/outfits/${id}`, { is_favorite: isFavorite });
  return data;
}

export async function deleteOutfit(id: number) {
  await apiClient.delete(`/outfits/${id}`);
}
