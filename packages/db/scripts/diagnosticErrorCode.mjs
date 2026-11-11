const codes = new Set([
  "28P01",
  "28000",
  "3D000",
  "42501",
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "08P01",
  "57P01",
  "57P02",
  "57P03",
  "53300",
  "53400",
  "57014",
  "25006",
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "EHOSTUNREACH",
]);

/** @param {unknown} error */
export function diagnosticErrorCode(error) {
  if (
    error != null &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string" &&
    codes.has(error.code)
  )
    return error.code;
  return "UNCLASSIFIED";
}
