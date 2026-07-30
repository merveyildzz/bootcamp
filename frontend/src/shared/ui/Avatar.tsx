import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts.length > 1 ? parts[parts.length - 1][0] : "").toUpperCase();
}

export function Avatar({ name, src, className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("h-9 w-9 rounded-full object-cover border border-border", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
