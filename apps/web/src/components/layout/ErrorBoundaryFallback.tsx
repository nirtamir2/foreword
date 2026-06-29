import type { ErrorComponentProps } from "@tanstack/react-router";
import { ErrorComponent, Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { m } from "@/paraglide/messages.js";

export function ErrorBoundaryFallback({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  if (import.meta.env.DEV) {
    return <ErrorComponent error={error} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card>
        <CardHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-app-red/10">
            <AlertTriangle className="size-6 text-app-red" />
          </div>
          <div className="text-center">
            <CardTitle>{m.something_went_wrong()}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex max-w-sm flex-col gap-4 text-center">
            <p className="text-sm text-app-text-muted">{m.unexpected_error_occurred()}</p>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => {
                  reset();
                  void router.invalidate();
                }}
              >
                <RotateCcw className="size-4" />
                {m.try_again()}
              </Button>
              <Link to="/">
                <Button size="sm" variant="ghost" fullWidth>
                  <Home className="size-4" />
                  {m.go_home()}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
