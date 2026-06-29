import { m } from "@/paraglide/messages.js";

export function getAuthErrorMessage({ error }: { error: unknown }) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error != null) {
    const errorObject = error as {
      error?: {
        message?: string | null;
      };
      message?: string | null;
    };

    return errorObject.error?.message ?? errorObject.message ?? m.something_went_wrong();
  }

  return m.something_went_wrong();
}
