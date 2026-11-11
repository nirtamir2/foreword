const names = new Set([
  // pg-protocol names PostgreSQL ErrorResponse objects with lowercase "error".
  "error",
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "AggregateError",
  "ReferenceError",
  "SystemError",
]);

/** @param {unknown} error */
export function diagnosticErrorClass(error) {
  if (
    error != null &&
    typeof error === "object" &&
    "name" in error &&
    typeof error.name === "string" &&
    names.has(error.name)
  )
    return error.name;
  return "UnknownError";
}
