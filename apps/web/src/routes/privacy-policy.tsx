import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { buttonVariants } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { m } from "@/paraglide/messages.js";
import { buildSeo, withAppName } from "@/utils/buildSeo";

const contactEmail = "hello@example.com";

export const Route = createFileRoute("/privacy-policy")({
  head: () =>
    buildSeo({
      title: withAppName({ title: m.privacy_policy() }),
      description: m.privacy_policy_seo_description(),
      pathname: "/privacy-policy",
    }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const policySections = [
    {
      title: m.privacy_policy_information_we_collect_title(),
      body: m.privacy_policy_information_we_collect_body(),
    },
    {
      title: m.privacy_policy_how_we_use_information_title(),
      body: m.privacy_policy_how_we_use_information_body(),
    },
    {
      title: m.privacy_policy_service_providers_title(),
      body: m.privacy_policy_service_providers_body(),
    },
    {
      title: m.privacy_policy_your_choices_title(),
      body: m.privacy_policy_your_choices_body(),
    },
  ] as const;

  return (
    <PageLayout title={m.privacy_policy()} subtitle={m.privacy_policy_subtitle()}>
      <article className="mx-auto flex max-w-3xl flex-col gap-4">
        <p className="text-sm text-app-text-subtle">{m.privacy_policy_last_updated()}</p>
        <p className="text-base/7 text-app-text-muted">{m.privacy_policy_intro()}</p>

        {policySections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm/6 text-app-text-muted">{section.body}</p>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>{m.privacy_policy_contact_title()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <p className="text-sm/6 text-app-text-muted">{m.privacy_policy_contact_body()}</p>
              <a className={buttonVariants()} href={`mailto:${contactEmail}`} dir="ltr">
                <Mail className="size-4" />
                {contactEmail}
              </a>
            </div>
          </CardContent>
        </Card>
      </article>
    </PageLayout>
  );
}
