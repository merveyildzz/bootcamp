import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input } from "@/shared/ui/Input";
import type { ClothingItem, WardrobeFilterState } from "@/types/wardrobe";

interface WardrobeFiltersProps {
  items: ClothingItem[];
  filters: WardrobeFilterState;
  onChange: (filters: WardrobeFilterState) => void;
}

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) =>
    a.localeCompare(b, "tr"),
  );
}

function FilterChipGroup({
  label,
  options,
  value,
  onToggle,
}: {
  label: string;
  options: string[];
  value: string | null;
  onToggle: (option: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-text-subtle">{label}:</span>
      {options.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150",
              isActive
                ? "border-accent bg-accent-muted text-accent"
                : "border-border bg-surface text-text-muted hover:border-border-hover hover:text-text",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function WardrobeFilters({ items, filters, onChange }: WardrobeFiltersProps) {
  const categories = uniqueSorted(items.map((i) => i.category));
  const seasons = uniqueSorted(items.map((i) => i.season));
  const colors = uniqueSorted(items.map((i) => i.color));

  const hasActiveFilters = filters.category || filters.color || filters.season || filters.search;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
          <Input
            placeholder="Marka, kategori veya renk ara..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
        {hasActiveFilters ? (
          <button
            onClick={() => onChange({ category: null, color: null, season: null, style: null, search: "" })}
            className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-text-muted hover:text-danger"
          >
            <X size={14} />
            Temizle
          </button>
        ) : null}
      </div>

      <FilterChipGroup
        label="Kategori"
        options={categories}
        value={filters.category}
        onToggle={(option) => onChange({ ...filters, category: filters.category === option ? null : option })}
      />
      <FilterChipGroup
        label="Mevsim"
        options={seasons}
        value={filters.season}
        onToggle={(option) => onChange({ ...filters, season: filters.season === option ? null : option })}
      />
      <FilterChipGroup
        label="Renk"
        options={colors}
        value={filters.color}
        onToggle={(option) => onChange({ ...filters, color: filters.color === option ? null : option })}
      />
    </div>
  );
}
