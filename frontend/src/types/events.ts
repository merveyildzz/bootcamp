export const EVENT_TYPES = [
  "iş görüşmesi",
  "toplantı",
  "düğün",
  "nişan",
  "doğum günü",
  "kahve",
  "yemek daveti",
  "konser",
  "spor etkinliği",
  "seyahat",
  "tatil",
  "mezuniyet",
  "resmi tören",
  "diğer",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface Event {
  id: number;
  title: string;
  event_type: string;
  event_date: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  title: string;
  event_type: EventType;
  event_date: string;
  location?: string | null;
  notes?: string | null;
}
