import { createFileRoute } from "@tanstack/react-router";
import { AuthenticationView } from "@/components/authentication/AuthenticationView";
import { BetterAuthProvider } from "@/components/authentication/BetterAuthProvider";
import { PageLayout } from "@/components/layout/PageLayout";
import { authViewPaths } from "@/lib/authPaths";
import { m } from "@/paraglide/messages.js";
import { buildSeo, withAppName } from "@/utils/buildSeo";

export const Route = createFileRoute("/auth/sign-up")({
  head: () =>
    buildSeo({
      title: withAppName({ title: m.sign_up() }),
      description: m.seo_sign_up_description(),
      pathname: "/auth/sign-up",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <BetterAuthProvider>
      <PageLayout title={m.sign_up()} subtitle={m.create_new_account()}>
        <AuthenticationView path={authViewPaths.signUp} token={undefined} />
      </PageLayout>
    </BetterAuthProvider>
  );
}
