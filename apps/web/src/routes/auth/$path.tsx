import { createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod";
import { AuthenticationView } from "@/components/authentication/AuthenticationView";
import { BetterAuthProvider } from "@/components/authentication/BetterAuthProvider";
import { PageLayout } from "@/components/layout/PageLayout";
import { authRoutePaths } from "@/lib/authPaths";
import { m } from "@/paraglide/messages.js";
import { buildSeo, withAppName } from "@/utils/buildSeo";

const searchSchema = z.object({
  token: z.string().nullish(),
});

export const Route = createFileRoute("/auth/$path")({
  validateSearch: searchSchema,
  beforeLoad: ({ params }) => {
    if (!authRoutePaths.has(params.path)) {
      throw redirect({
        to: "/auth/login",
      });
    }
  },
  head: ({ params }) =>
    buildSeo({
      title: withAppName({ title: m.sign_in() }),
      description: m.authentication_page_description({ view: params.path }),
      pathname: `/auth/${params.path}`,
      noIndex: true,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const { path } = Route.useParams();
  const search = Route.useSearch();

  return (
    <BetterAuthProvider>
      <PageLayout title={m.sign_in()} subtitle={m.welcome_back()}>
        <AuthenticationView path={path} token={search.token ?? undefined} />
      </PageLayout>
    </BetterAuthProvider>
  );
}
