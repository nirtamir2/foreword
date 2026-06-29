import { createFileRoute } from "@tanstack/react-router";
import { AuthenticationView } from "@/components/authentication/AuthenticationView";
import { BetterAuthProvider } from "@/components/authentication/BetterAuthProvider";
import { PageLayout } from "@/components/layout/PageLayout";
import { authViewPaths } from "@/lib/authPaths";
import { m } from "@/paraglide/messages.js";
import { buildSeo, withAppName } from "@/utils/buildSeo";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () =>
    buildSeo({
      title: withAppName({ title: m.forgot_password() }),
      description: m.seo_forgot_password_description(),
      pathname: "/auth/forgot-password",
      noIndex: true,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <BetterAuthProvider>
      <PageLayout title={m.forgot_password()} subtitle={m.reset_your_password()}>
        <AuthenticationView path={authViewPaths.forgotPassword} token={undefined} />
      </PageLayout>
    </BetterAuthProvider>
  );
}
