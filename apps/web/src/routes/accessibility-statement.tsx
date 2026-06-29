import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { buttonVariants } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { m } from "@/paraglide/messages.js";
import { buildSeo, withAppName } from "@/utils/buildSeo";

const contactEmail = "hello@example.com";

export const Route = createFileRoute("/accessibility-statement")({
  head: () =>
    buildSeo({
      title: withAppName({ title: m.accessibility_statement() }),
      description: m.accessibility_statement_seo_description(),
      pathname: "/accessibility-statement",
    }),
  component: AccessibilityStatementPage,
});

function AccessibilityStatementPage() {
  const accessibilitySections = [
    {
      title: m.accessibility_statement_commitment_title(),
      body: m.accessibility_statement_commitment_body(),
    },
    {
      title: m.accessibility_statement_adjustments_title(),
      body: m.accessibility_statement_adjustments_body(),
    },
    {
      title: m.accessibility_statement_limitations_title(),
      body: m.accessibility_statement_limitations_body(),
    },
  ] as const;

  return (
    <PageLayout
      title={m.accessibility_statement()}
      subtitle={m.accessibility_statement_subtitle()}
    >
      <article className="mx-auto flex max-w-3xl flex-col gap-4">
        <p className="text-sm text-app-text-subtle">{m.accessibility_statement_last_updated()}</p>
        <p className="text-base/7 text-app-text-muted">{m.accessibility_statement_intro()}</p>

        {accessibilitySections.map((section) => (
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
            <CardTitle>{m.accessibility_statement_contact_title()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <p className="text-sm/6 text-app-text-muted">
                {m.accessibility_statement_contact_body()}
              </p>
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
