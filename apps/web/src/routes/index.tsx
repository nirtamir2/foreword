import { createFileRoute } from "@tanstack/react-router";
import { ClosingCallToAction } from "@/components/landing/ClosingCallToAction";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { LandingHero } from "@/components/landing/LandingHero";
import { WorkflowSteps } from "@/components/landing/WorkflowSteps";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { GlobalHeaderControls } from "@/components/layout/GlobalHeaderControls";
import { PageLayout } from "@/components/layout/PageLayout";
import { getUser } from "@/functions/getUser";
import { m } from "@/paraglide/messages.js";
import { appName } from "@/utils/appName";
import { buildSeo } from "@/utils/buildSeo";

export const Route = createFileRoute("/")({
  head: () =>
    buildSeo({
      title: `${appName()} — ${m.seo_root_title()}`,
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
  const isSignedIn = session?.user != null;

  return (
    <PageLayout
      headerControls={<GlobalHeaderControls />}
      navigation={isSignedIn ? AppNavigation : null}
      bleed
    >
      <LandingHero isSignedIn={isSignedIn} />
      <WorkflowSteps />
      <FeatureGrid />
      <ClosingCallToAction isSignedIn={isSignedIn} />
    </PageLayout>
  );
}
