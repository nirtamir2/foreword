const names = new Set([
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
