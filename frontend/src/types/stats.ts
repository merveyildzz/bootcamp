export interface TopWornItem {
  id: number;
  category: string;
  color: string;
  thumbnail_url: string;
  wear_count: number;
}

export interface ColorUsage {
  color: string;
  wear_count: number;
}

export interface MonthlyOutfitCount {
  month: string;
  count: number;
}

export interface StatsOverview {
  total_items: number;
  worn_items: number;
  usage_rate: number;
  top_worn_items: TopWornItem[];
  color_usage: ColorUsage[];
  monthly_outfit_counts: MonthlyOutfitCount[];
  insights: string[];
}
