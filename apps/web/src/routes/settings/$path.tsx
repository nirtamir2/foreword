import { createFileRoute, redirect } from "@tanstack/react-router";
import { BetterAuthProvider } from "@/components/authentication/BetterAuthProvider";
import { SettingsView } from "@/components/authentication/SettingsView";
import { PageLayout } from "@/components/layout/PageLayout";
import { getSettingsPath, settingsViewPaths } from "@/lib/authPaths";
import { m } from "@/paraglide/messages.js";
import { buildSeo, withAppName } from "@/utils/buildSeo";

export const Route = createFileRoute("/settings/$path")({
  beforeLoad: ({ params }) => {
    if (params.path !== settingsViewPaths.account && params.path !== settingsViewPaths.security) {
      throw redirect({
        to: getSettingsPath({ view: "account" }),
      });
    }
  },
  head: ({ params }) =>
    buildSeo({
      title: withAppName({
        title: params.path === settingsViewPaths.security ? m.security() : m.account(),
      }),
      description: m.settings_page_description(),
      pathname: `/settings/${params.path}`,
      noIndex: true,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const { path } = Route.useParams();

  return (
    <BetterAuthProvider>
      <PageLayout
        title={path === settingsViewPaths.security ? m.security() : m.account()}
        subtitle={m.settings_page_subtitle()}
      >
        <SettingsView path={path} />
      </PageLayout>
    </BetterAuthProvider>
  );
}
