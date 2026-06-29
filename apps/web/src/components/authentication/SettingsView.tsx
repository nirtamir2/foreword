import type { SyntheticEvent } from "react";
import { useState } from "react";
import { useAuthenticate, useChangeEmail, useSignOut, useUpdateUser } from "@better-auth-ui/react";
import { Link } from "@tanstack/react-router";
import { LogOut, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { getAuthErrorMessage } from "@/components/authentication/getAuthErrorMessage";
import { Loader } from "@/components/layout/Loader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getAuthPath, getSettingsPath, settingsViewPaths } from "@/lib/authPaths";
import { m } from "@/paraglide/messages.js";

interface Props {
  path: string;
}

export function SettingsView({ path }: Props) {
  const session = useAuthenticate();
  const currentView = path === settingsViewPaths.security ? "security" : "account";

  if (session.isPending || session.data == null) {
    return <Loader />;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <Link to="/settings/$path" params={{ path: "account" }}>
          <Button variant={currentView === "account" ? "default" : "secondary"}>
            <User className="size-4" />
            {m.account()}
          </Button>
        </Link>
        <Link to="/settings/$path" params={{ path: "security" }}>
          <Button variant={currentView === "security" ? "default" : "secondary"}>
            <Mail className="size-4" />
            {m.security()}
          </Button>
        </Link>
      </div>

      {currentView === "security" ? (
        <SecuritySettingsView />
      ) : (
        <AccountSettingsView
          currentEmail={session.data.user.email}
          currentName={session.data.user.name}
        />
      )}
    </div>
  );
}

function AccountSettingsView({
  currentEmail,
  currentName,
}: {
  currentEmail: string;
  currentName: string;
}) {
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const { mutate: updateUser, isPending: isUpdatingProfile } = useUpdateUser({
    onError: (error) => {
      toast.error(getAuthErrorMessage({ error }));
    },
    onSuccess: () => {
      toast.success(m.profile_updated_success());
    },
  });
  const { mutate: changeEmail, isPending: isUpdatingEmail } = useChangeEmail({
    onError: (error) => {
      toast.error(getAuthErrorMessage({ error }));
    },
    onSuccess: () => {
      toast.success(m.change_email_success());
    },
  });

  function handleProfileSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUser({ name });
  }

  function handleEmailSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    changeEmail({
      newEmail: email,
      callbackURL: globalThis.location.origin + getSettingsPath({ view: "account" }),
    });
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{m.profile()}</CardTitle>
          <p className="text-sm text-app-text-muted">{m.settings_profile_description()}</p>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleProfileSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-name">{m.auth_name()}</Label>
              <Input
                id="settings-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                required
                disabled={isUpdatingProfile}
              />
            </div>
            <Button type="submit" disabled={name === currentName || isUpdatingProfile}>
              {m.save_changes()}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m.change_email()}</CardTitle>
          <p className="text-sm text-app-text-muted">{m.settings_change_email_description()}</p>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-email">{m.auth_email()}</Label>
              <Input
                id="settings-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                required
                disabled={isUpdatingEmail}
              />
            </div>
            <Button type="submit" disabled={email === currentEmail || isUpdatingEmail}>
              {m.update_email()}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SecuritySettingsView() {
  const { mutate: signOut, isPending } = useSignOut({
    onError: (error) => {
      toast.error(getAuthErrorMessage({ error }));
    },
    onSuccess: () => {
      globalThis.location.href = getAuthPath({ view: "signIn" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.security()}</CardTitle>
        <p className="text-sm text-app-text-muted">{m.settings_security_description()}</p>
      </CardHeader>
      <CardContent>
        <Button
          variant="secondary"
          disabled={isPending}
          onClick={() => {
            signOut({});
          }}
        >
          <LogOut className="size-4" />
          {m.sign_out()}
        </Button>
      </CardContent>
    </Card>
  );
}
