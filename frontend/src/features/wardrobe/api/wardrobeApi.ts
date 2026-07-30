import { apiClient } from "@/lib/apiClient";
import type {
  AnalyzePhotoResponse,
  ClothingItem,
  ClothingItemInput,
  Taxonomy,
  WardrobeFilterState,
} from "@/types/wardrobe";

export async function getTaxonomy() {
  const { data } = await apiClient.get<Taxonomy>("/wardrobe/taxonomy");
  return data;
}

export async function analyzePhoto(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<AnalyzePhotoResponse>("/wardrobe/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function createClothingItem(stagingToken: string, payload: ClothingItemInput) {
  const { data } = await apiClient.post<ClothingItem>("/wardrobe/items", {
    staging_token: stagingToken,
    ...payload,
  });
  return data;
}

export async function listClothingItems(filters?: Partial<WardrobeFilterState>) {
  const params: Record<string, string> = {};
  if (filters?.category) params.category = filters.category;
  if (filters?.color) params.color = filters.color;
  if (filters?.season) params.season = filters.season;
  if (filters?.style) params.style = filters.style;
  if (filters?.search) params.search = filters.search;

  const { data } = await apiClient.get<ClothingItem[]>("/wardrobe/items", { params });
  return data;
}

export async function updateClothingItem(id: number, payload: Partial<ClothingItemInput>) {
  const { data } = await apiClient.patch<ClothingItem>(`/wardrobe/items/${id}`, payload);
  return data;
}

export async function deleteClothingItem(id: number) {
  await apiClient.delete(`/wardrobe/items/${id}`);
}

export async function markWorn(id: number) {
  const { data } = await apiClient.post<ClothingItem>(`/wardrobe/items/${id}/wear`);
  return data;
}
