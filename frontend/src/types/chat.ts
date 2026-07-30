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
  ai_explanation: string | null;
  items: OutfitItem[];
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  outfit: Outfit | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}
