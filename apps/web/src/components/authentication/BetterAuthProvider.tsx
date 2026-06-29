import type { ReactNode } from "react";
import { AuthProvider } from "@better-auth-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { getAuthLocalization } from "@/i18n/getAuthLocalization";
import { authClient } from "@/lib/authClient";
import { authBasePaths, betterAuthViewPaths } from "@/lib/authPaths";

interface Props {
  children: ReactNode;
}

export function BetterAuthProvider({ children }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return (
    <AuthProvider
      authClient={authClient}
      queryClient={queryClient}
      navigate={({ to, replace }) => {
        void router.navigate({ href: to, replace });
      }}
      baseURL=""
      basePaths={authBasePaths}
      viewPaths={betterAuthViewPaths}
      emailAndPassword={{
        enabled: true,
        forgotPassword: true,
        confirmPassword: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
      }}
      localization={getAuthLocalization()}
      magicLink={false}
      socialProviders={["google"]}
      redirectTo="/"
      Link={({ href, children: linkChildren, ...props }) => (
        <Link to={href} {...props}>
          {linkChildren}
        </Link>
      )}
    >
      {children}
    </AuthProvider>
  );
}
