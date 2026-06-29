import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSettingsPath } from "@/lib/authPaths";

export const Route = createFileRoute("/account/$accountView")({
  beforeLoad: ({ params }) => {
    const nextPath: "account" | "security" =
      params.accountView === "sessions" || params.accountView === "security"
        ? "security"
        : "account";

    throw redirect({
      to: getSettingsPath({ view: nextPath }),
    });
  },
});
