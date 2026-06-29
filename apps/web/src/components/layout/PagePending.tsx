import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  title: string;
  subtitle: string;
  onBack?: () => void;
}

export function PagePending({ title, subtitle, onBack }: Props) {
  return (
    <PageLayout title={title} subtitle={subtitle} onBack={onBack}>
      <div className="mx-auto grid max-w-3xl gap-4">
        <Skeleton style={{ height: "6rem" }} />
        <Skeleton style={{ height: "6rem" }} />
        <Skeleton style={{ height: "6rem" }} />
      </div>
    </PageLayout>
  );
}
