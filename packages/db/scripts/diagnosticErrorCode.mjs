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
  "08007",
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
  "EAI_AGAIN",
  "ENETUNREACH",
  "ESOCKETTIMEDOUT",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "CERT_HAS_EXPIRED",
  "CERT_NOT_YET_VALID",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "ERR_TLS_CERT_SIGNATURE_ALGORITHM_UNSUPPORTED",
  "ERR_SSL_WRONG_VERSION_NUMBER",
  "ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION",
  "ERR_MODULE_NOT_FOUND",
  "MODULE_NOT_FOUND",
  "ERR_PACKAGE_PATH_NOT_EXPORTED",
  "ERR_DLOPEN_FAILED",
  "ERR_INVALID_URL",
  "ERR_INVALID_ARG_TYPE",
  "42704",
  "22023",
  "0A000",
  "55P02",
  "F0000",
  "XX000",
  "READ_ONLY_DISABLED",
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
