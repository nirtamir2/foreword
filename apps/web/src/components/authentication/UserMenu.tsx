import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Skeleton } from "@/components/ui/Skeleton";
import { authClient } from "@/lib/authClient";
import { getSettingsPath } from "@/lib/authPaths";
import { m } from "@/paraglide/messages.js";

export function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton style={{ height: "2rem", width: "6rem" }} />;
  }

  if (session == null) {
    return (
      <Link to="/auth/login">
        <Button variant="secondary" size="sm">
          <User className="size-4" />
          {m.sign_in()}
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
        <User className="size-4" />
        <span className="max-w-24 truncate sm:max-w-40" dir="auto" title={session.user.name}>
          {session.user.name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{m.account()}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void navigate({ to: getSettingsPath({ view: "account" }) });
            }}
          >
            <Settings className="size-4" />
            {m.account()}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    void navigate({ to: "/" });
                  },
                },
              });
            }}
          >
            <LogOut className="size-4" />
            {m.sign_out()}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
