import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Yükleniyor"
      className={cn(
        "h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent",
        className,
      )}
    />
  );
}
