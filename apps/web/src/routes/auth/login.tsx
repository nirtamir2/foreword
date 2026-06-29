import { createFileRoute } from "@tanstack/react-router";
import { AuthenticationView } from "@/components/authentication/AuthenticationView";
import { BetterAuthProvider } from "@/components/authentication/BetterAuthProvider";
import { PageLayout } from "@/components/layout/PageLayout";
import { authViewPaths } from "@/lib/authPaths";
import { m } from "@/paraglide/messages.js";
import { buildSeo, withAppName } from "@/utils/buildSeo";

export const Route = createFileRoute("/auth/login")({
  head: () =>
    buildSeo({
      title: withAppName({ title: m.sign_in() }),
      description: m.seo_sign_in_description(),
      pathname: "/auth/login",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <BetterAuthProvider>
      <PageLayout title={m.sign_in()} subtitle={m.welcome_back()}>
        <AuthenticationView path={authViewPaths.signIn} token={undefined} />
      </PageLayout>
    </BetterAuthProvider>
  );
}
