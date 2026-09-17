import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { GlobalHeaderControls } from "@/components/layout/GlobalHeaderControls";
import { PageLayout } from "@/components/layout/PageLayout";
import { STUDY_SESSION_SIZE, StudySession } from "@/components/study/StudySession";
import { getUser } from "@/functions/getUser";
import { m } from "@/paraglide/messages.js";
import { buildSeo, withAppName } from "@/utils/buildSeo";
import { orpc } from "@/utils/orpc";

const searchSchema = z.object({
  scope: z.enum(["TO_LEARN", "KNOWN"]).default("TO_LEARN"),
});

export const Route = createFileRoute("/study/$bookId")({
  validateSearch: searchSchema,
  head: () =>
    buildSeo({
      title: withAppName({ title: m.study_title() }),
      description: m.study_seo_description(),
      pathname: "/study",
      noIndex: true,
    }),
  beforeLoad: async () => {
    const session = await getUser();
    if (session?.user == null) {
      throw redirect({ to: "/auth/login" });
    }
    return { session };
  },
  loaderDeps: ({ search }) => ({ scope: search.scope }),
  loader: async ({ context, params, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        orpc.books.get.queryOptions({ input: { bookId: params.bookId } }),
      ),
      context.queryClient.ensureQueryData(
        orpc.study.session.queryOptions({
          input: { bookId: params.bookId, limit: STUDY_SESSION_SIZE, scope: deps.scope },
        }),
      ),
    ]);
  },
  component: StudyComponent,
});

function StudyComponent() {
  const { bookId } = Route.useParams();
  const { scope } = Route.useSearch();
  const navigate = useNavigate();
  const bookQuery = useQuery(orpc.books.get.queryOptions({ input: { bookId } }));

  return (
    <PageLayout
      title={scope === "KNOWN" ? m.study_review_known_title() : m.study_title()}
      subtitle={bookQuery.data?.title}
      headerControls={<GlobalHeaderControls />}
      navigation={AppNavigation}
      onBack={() => {
        void navigate({ to: "/books/$bookId", params: { bookId } });
      }}
    >
      <StudySession key={scope} bookId={bookId} scope={scope} />
    </PageLayout>
  );
}
