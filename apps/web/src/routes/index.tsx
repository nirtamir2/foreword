import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Database, Lock, Route as RouteIcon, ShieldCheck, Sparkles } from "lucide-react";
import { GlobalHeaderControls } from "@/components/layout/GlobalHeaderControls";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getUser } from "@/functions/getUser";
import { m } from "@/paraglide/messages.js";
import { appName } from "@/utils/appName";
import { buildSeo } from "@/utils/buildSeo";
import { orpc } from "@/utils/orpc";

const stackItems = [
  {
    icon: RouteIcon,
    title: "TanStack Start",
    description: "File routes, SSR, server functions, and typed navigation.",
  },
  {
    icon: ShieldCheck,
    title: "Better Auth",
    description: "Email/password auth wired to Prisma and PostgreSQL.",
  },
  {
    icon: Database,
    title: "Prisma",
    description: "Generated database client in a shared workspace package.",
  },
  {
    icon: Sparkles,
    title: "oRPC",
    description: "End-to-end typed API calls with TanStack Query helpers.",
  },
] as const;

export const Route = createFileRoute("/")({
  head: () =>
    buildSeo({
      title: appName(),
      description: m.seo_root_description(),
      pathname: "/",
    }),
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  component: HomeComponent,
});

function HomeComponent() {
  const { session } = Route.useRouteContext();
  const healthQuery = useQuery(orpc.healthCheck.queryOptions());
  const privateDataQuery = useQuery({
    ...orpc.privateData.queryOptions(),
    enabled: session?.user != null,
  });

  return (
    <PageLayout title={appName()} subtitle={m.seo_root_description()} headerControls={<GlobalHeaderControls />}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="grid gap-6 py-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold tracking-wider text-app-accent uppercase">
              {m.template_badge()}
            </p>
            <h2 className="max-w-3xl text-4xl/tight font-semibold tracking-tight md:text-6xl/tight">
              {m.home_title()}
            </h2>
            <p className="max-w-2xl text-base/7 text-app-text-muted md:text-lg/8">
              {m.home_subtitle()}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            {session?.user == null ? (
              <>
                <Link to="/auth/login">
                  <Button variant="secondary">
                    <Lock className="size-4" />
                    {m.sign_in()}
                  </Button>
                </Link>
                <Link to="/auth/sign-up">
                  <Button>
                    {m.sign_up()}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/settings/$path" params={{ path: "account" }}>
                <Button>
                  {m.account()}
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stackItems.map((item) => (
            <Card key={item.title} size="sm">
              <CardHeader>
                <item.icon className="size-5 text-app-accent" />
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-app-text-muted">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <StatusCard
            title={m.public_rpc_status()}
            value={healthQuery.data ?? m.loading()}
            description={m.public_rpc_description()}
          />
          <StatusCard
            title={m.protected_rpc_status()}
            value={
              session?.user == null
                ? m.sign_in_required()
                : (privateDataQuery.data?.user.email ?? m.loading())
            }
            description={m.protected_rpc_description()}
          />
        </section>
      </div>
    </PageLayout>
  );
}

function StatusCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-sm text-app-accent">{value}</p>
          <p className="text-sm text-app-text-muted">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
