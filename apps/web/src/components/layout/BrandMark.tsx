import { clsx } from "clsx";

interface Props {
  size?: "sm" | "default" | "lg";
}

/** The Foreword mark: an open book with a marker-pen stroke. Pure CSS/SVG, no assets. */
export function BrandMark({ size = "default" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "relative inline-flex shrink-0 items-center justify-center rounded-xl bg-app-ink text-app-canvas shadow-(--app-shadow-raised)",
        size === "sm" && "size-7 rounded-lg",
        size === "default" && "size-9",
        size === "lg" && "size-14 rounded-2xl",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={clsx(
          size === "sm" && "size-4",
          size === "default" && "size-5",
          size === "lg" && "size-8",
        )}
      >
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 15.5z" />
        <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h4.5a1.5 1.5 0 0 0 1.5-1.5z" />
        <path d="M14.5 9.5h3" className="text-app-highlight" strokeWidth="2.6" />
      </svg>
      <span
        className={clsx(
          "absolute -inset-e-0.5 -bottom-0.5 rounded-full bg-app-highlight ring-2 ring-app-canvas",
          size === "sm" ? "size-2" : "size-2.5",
        )}
      />
    </span>
  );
}
