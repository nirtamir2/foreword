import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { clsx } from "clsx";

type ProgressTone = "accent" | "success" | "ink";
type ProgressSize = "sm" | "default" | "lg";

interface Props {
  value: number;
  max?: number;
  tone?: ProgressTone;
  size?: ProgressSize;
  label: string;
  /** Show segments for known / learning inside a single track. */
  secondaryValue?: number;
}

export function Progress({
  value,
  max = 100,
  tone = "accent",
  size = "default",
  label,
  secondaryValue = 0,
}: Props) {
  const safeMax = max <= 0 ? 1 : max;
  const primaryPercent = Math.min(100, Math.max(0, (value / safeMax) * 100));
  const secondaryPercent = Math.min(
    100 - primaryPercent,
    Math.max(0, (secondaryValue / safeMax) * 100),
  );

  return (
    <ProgressPrimitive.Root value={value} max={safeMax} aria-label={label}>
      <ProgressPrimitive.Track
        className={clsx(
          "relative flex w-full overflow-hidden rounded-full bg-app-surface-muted",
          size === "sm" && "h-1.5",
          size === "default" && "h-2.5",
          size === "lg" && "h-3.5",
        )}
      >
        <ProgressPrimitive.Indicator
          className={clsx(
            "h-full rounded-full transition-[width] duration-500 ease-(--ease-app-out)",
            tone === "accent" && "bg-app-accent",
            tone === "success" && "bg-app-success",
            tone === "ink" && "bg-app-ink",
          )}
          style={{ width: `${String(primaryPercent)}%` }}
        />
        {secondaryPercent > 0 ? (
          <span
            aria-hidden="true"
            className="h-full bg-app-warning/70 transition-[width] duration-500 ease-(--ease-app-out)"
            style={{ width: `${String(secondaryPercent)}%` }}
          />
        ) : null}
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}
