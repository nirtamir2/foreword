import type * as React from "react";

interface Props {
  label?: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, helperText, children }: Props) {
  function renderAdditionalText() {
    if (error != null && error.length > 0) {
      return (
        <p className="text-xs text-app-red" role="alert">
          {error}
        </p>
      );
    }

    return helperText != null && helperText.length > 0 ? (
      <p className="text-xs/relaxed text-app-text-subtle">{helperText}</p>
    ) : null;
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label != null && label.length > 0 ? (
        <label htmlFor={htmlFor} className="text-sm font-medium text-app-text">
          {label}
        </label>
      ) : null}
      {children}
      {renderAdditionalText()}
    </div>
  );
}
