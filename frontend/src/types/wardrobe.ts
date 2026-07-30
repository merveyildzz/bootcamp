export interface ClothingItem {
  id: number;
  photo_url: string;
  thumbnail_url: string;
  category: string;
  color: string;
  fabric: string | null;
  style: string | null;
  season: string | null;
  brand: string | null;
  last_worn_date: string | null;
  wear_count: number;
  created_at: string;
  updated_at: string;
}

export interface Taxonomy {
  category: string[];
  style: string[];
  season: string[];
  color: string[];
}

export interface DetectedAttributes {
  category: string | null;
  color: string | null;
  fabric: string | null;
  style: string | null;
  season: string | null;
}

export interface AnalyzePhotoResponse {
  staging_token: string;
  photo_url: string;
  thumbnail_url: string;
  detected: DetectedAttributes;
}

export interface ClothingItemInput {
  category: string;
  color: string;
  fabric?: string | null;
  style?: string | null;
  season?: string | null;
  brand?: string | null;
}

export interface WardrobeFilterState {
  category: string | null;
  color: string | null;
  season: string | null;
  style: string | null;
  search: string;
}
