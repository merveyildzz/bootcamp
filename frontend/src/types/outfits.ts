export interface OutfitItem {
  id: number;
  role: string | null;
  photo_url: string;
  thumbnail_url: string;
  category: string;
  color: string;
}

export interface Outfit {
  id: number;
  name: string | null;
  ai_explanation: string | null;
  is_favorite: boolean;
  event_id: number | null;
  created_at: string;
  items: OutfitItem[];
}
