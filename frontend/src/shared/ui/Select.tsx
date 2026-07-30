import { type SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  options: string[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, placeholder, options, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={id} className="text-sm font-medium text-text-muted">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              "h-10 w-full appearance-none rounded-lg border border-border bg-surface px-3 pr-9 text-sm text-text",
              "outline-none transition-colors duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              className,
            )}
            {...props}
          >
            {placeholder ? <option value="">{placeholder}</option> : null}
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle"
          />
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    );
  },
);
Select.displayName = "Select";
