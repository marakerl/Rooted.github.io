import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  max?: number;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export const StarRating = ({ value, onChange, max = 10, readOnly, size = "md" }: Props) => {
  const sz = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn(
            "transition-transform hover:scale-110 disabled:hover:scale-100 disabled:cursor-default",
            n <= value ? "text-primary" : "text-muted-foreground/40",
          )}
          aria-label={`${n} of ${max}`}
        >
          <Leaf className={cn(sz, n <= value && "fill-primary")} />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium text-foreground/70 self-center">{value || "–"}/{max}</span>
    </div>
  );
};
