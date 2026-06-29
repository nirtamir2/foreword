import type { ReactNode, SyntheticEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  providerIcons,
  useAuth,
  useRequestPasswordReset,
  useResetPassword,
  useSignInEmail,
  useSignInSocial,
  useSignOut,
  useSignUpEmail,
} from "@better-auth-ui/react";
import type { AuthView } from "@better-auth-ui/react/core";
import { getProviderName } from "@better-auth-ui/react/core";
import type { SocialProvider } from "better-auth/social-providers";
import { Globe, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getAuthErrorMessage } from "@/components/authentication/getAuthErrorMessage";
import { Loader } from "@/components/layout/Loader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { authViewPaths, getAuthPath } from "@/lib/authPaths";
import { m } from "@/paraglide/messages.js";

interface Props {
  path: string;
  token: string | undefined;
}

const authPathViews = Object.fromEntries(
  Object.entries(authViewPaths).map(([view, currentPath]) => [currentPath, view]),
) as Record<string, AuthView>;

export function AuthenticationView({ path, token }: Props) {
  const currentView = authPathViews[path];

  switch (currentView) {
    case "signIn": {
      return <SignInView />;
    }
    case "signUp": {
      return <SignUpView />;
    }
    case "forgotPassword": {
      return <ForgotPasswordView />;
    }
    case "resetPassword": {
      return <ResetPasswordView token={token} />;
    }
    case "signOut": {
      return <SignOutView />;
    }
    case "magicLink": {
      return null;
    }
    default: {
      return null;
    }
  }
}

function AuthenticationCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-app-text-muted">{description}</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">{children}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function PendingIcon({ isPending }: { isPending: boolean }) {
  return isPending ? <Loader2 className="size-4 animate-spin" /> : null;
}

function AuthenticationDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-app-border" />
      <span className="text-xs font-semibold text-app-text-muted uppercase">{label}</span>
      <div className="h-px flex-1 bg-app-border" />
    </div>
  );
}

function SocialProviderButtons({ isDisabled }: { isDisabled: boolean }) {
  const { socialProviders } = useAuth();

  return socialProviders != null && socialProviders.length > 0 ? (
    <div className="flex flex-col gap-3">
      {socialProviders.map((provider) => (
        <SocialProviderButton key={provider} provider={provider} isDisabled={isDisabled} />
      ))}
    </div>
  ) : null;
}

function SocialProviderButton({
  provider,
  isDisabled,
}: {
  provider: SocialProvider;
  isDisabled: boolean;
}) {
  const { baseURL, localization, redirectTo } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { mutate: signInSocial, isPending } = useSignInSocial({
    onError: (error) => {
      toast.error(getAuthErrorMessage({ error }));
      setIsRedirecting(false);
    },
    onSuccess: () => {
      setIsRedirecting(true);
    },
  });

  const ProviderIcon = providerIcons[provider] ?? Globe;
  const isBusy = isDisabled || isPending || isRedirecting;
  const continueWithLabel = localization.auth.continueWith.replace(
    "{{provider}}",
    getProviderName(provider),
  );

  return (
    <Button
      type="button"
      variant="secondary"
      fullWidth
      disabled={isBusy}
      onClick={() => {
        const callbackBaseURL = baseURL.length > 0 ? baseURL : globalThis.location.origin;

        signInSocial({
          provider,
          callbackURL: `${callbackBaseURL}${redirectTo}`,
        });
      }}
    >
      {isBusy ? <Loader2 className="size-4 animate-spin" /> : <ProviderIcon className="size-4" />}
      {continueWithLabel}
    </Button>
  );
}

function SignInView() {
  const { Link: AuthLink, localization, navigate, redirectTo, socialProviders } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: signInEmail, isPending } = useSignInEmail({
    onError: (error) => {
      toast.error(getAuthErrorMessage({ error }));
      setPassword("");
    },
    onSuccess: () => {
      navigate({ to: redirectTo });
      toast.success(m.sign_in_successful());
    },
  });

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    signInEmail({ email, password });
  }

  return (
    <AuthenticationCard title={localization.auth.signIn} description={m.auth_sign_in_description()}>
      {socialProviders != null && socialProviders.length > 0 ? (
        <>
          <SocialProviderButtons isDisabled={isPending} />
          <AuthenticationDivider label={localization.auth.or} />
        </>
      ) : null}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sign-in-email">{localization.auth.email}</Label>
          <Input
            id="sign-in-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={localization.auth.emailPlaceholder}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sign-in-password">{localization.auth.password}</Label>
          <Input
            id="sign-in-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={localization.auth.passwordPlaceholder}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            required
            minLength={8}
            disabled={isPending}
          />
        </div>

        <Button type="submit" fullWidth disabled={isPending}>
          <PendingIcon isPending={isPending} />
          {localization.auth.signIn}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 pt-1 text-sm text-app-text-muted">
        <AuthLink href={getAuthPath({ view: "forgotPassword" })} className="hover:text-app-text">
          {localization.auth.forgotPassword}
        </AuthLink>
        <AuthLink href={getAuthPath({ view: "signUp" })} className="hover:text-app-text">
          {localization.auth.needToCreateAnAccount} {localization.auth.signUp}
        </AuthLink>
      </div>
    </AuthenticationCard>
  );
}

function SignUpView() {
  const {
    Link: AuthLink,
    emailAndPassword,
    localization,
    navigate,
    redirectTo,
    socialProviders,
  } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { mutate: signUpEmail, isPending } = useSignUpEmail({
    onError: (error) => {
      toast.error(getAuthErrorMessage({ error }));
      setPassword("");
      setConfirmPassword("");
    },
    onSuccess: () => {
      if (emailAndPassword.requireEmailVerification === true) {
        toast.success(localization.auth.verifyYourEmail);
        navigate({ to: getAuthPath({ view: "signIn" }) });
        return;
      }

      navigate({ to: redirectTo });
      toast.success(m.sign_up_successful());
    },
  });

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error(localization.auth.passwordsDoNotMatch);
      setPassword("");
      setConfirmPassword("");
      return;
    }

    signUpEmail({ name, email, password });
  }

  return (
    <AuthenticationCard title={localization.auth.signUp} description={m.auth_sign_up_description()}>
      {socialProviders != null && socialProviders.length > 0 ? (
        <>
          <SocialProviderButtons isDisabled={isPending} />
          <AuthenticationDivider label={localization.auth.or} />
        </>
      ) : null}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sign-up-name">{localization.auth.name}</Label>
          <Input
            id="sign-up-name"
            name="name"
            autoComplete="name"
            placeholder={localization.auth.namePlaceholder}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sign-up-email">{localization.auth.email}</Label>
          <Input
            id="sign-up-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={localization.auth.emailPlaceholder}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sign-up-password">{localization.auth.password}</Label>
          <Input
            id="sign-up-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={localization.auth.passwordPlaceholder}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            required
            minLength={8}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sign-up-confirm-password">{localization.auth.confirmPassword}</Label>
          <Input
            id="sign-up-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={localization.auth.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
            }}
            required
            minLength={8}
            disabled={isPending}
          />
        </div>

        <Button type="submit" fullWidth disabled={isPending}>
          <PendingIcon isPending={isPending} />
          {localization.auth.signUp}
        </Button>
      </form>

      <div className="flex items-center justify-center pt-1 text-sm text-app-text-muted">
        <AuthLink href={getAuthPath({ view: "signIn" })} className="hover:text-app-text">
          {localization.auth.alreadyHaveAnAccount} {localization.auth.signIn}
        </AuthLink>
      </div>
    </AuthenticationCard>
  );
}

function ForgotPasswordView() {
  const { Link: AuthLink, baseURL, localization } = useAuth();
  const [email, setEmail] = useState("");
  const { mutate: requestPasswordReset, isPending } = useRequestPasswordReset({
    onError: (error) => {
      toast.error(getAuthErrorMessage({ error }));
    },
    onSuccess: () => {
      toast.success(localization.auth.passwordResetEmailSent);
    },
  });

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const callbackBaseURL = baseURL.length > 0 ? baseURL : globalThis.location.origin;

    requestPasswordReset({
      email,
      redirectTo: `${callbackBaseURL}${getAuthPath({ view: "resetPassword" })}`,
    });
  }

  return (
    <AuthenticationCard
      title={localization.auth.forgotPassword}
      description={m.auth_forgot_password_description()}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="forgot-password-email">{localization.auth.email}</Label>
          <Input
            id="forgot-password-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={localization.auth.emailPlaceholder}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            required
            disabled={isPending}
          />
        </div>

        <Button type="submit" fullWidth disabled={isPending}>
          <PendingIcon isPending={isPending} />
          {localization.auth.sendResetLink}
        </Button>
      </form>

      <div className="flex items-center justify-center pt-1 text-sm text-app-text-muted">
        <AuthLink href={getAuthPath({ view: "signIn" })} className="hover:text-app-text">
          {localization.auth.rememberYourPassword} {localization.auth.signIn}
        </AuthLink>
      </div>
    </AuthenticationCard>
  );
}

function ResetPasswordView({ token }: { token: string | undefined }) {
  const { Link: AuthLink, localization, navigate } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { mutate: resetPassword, isPending } = useResetPassword({
    onError: (error) => {
      toast.error(getAuthErrorMessage({ error }));
      setPassword("");
      setConfirmPassword("");
    },
    onSuccess: () => {
      toast.success(m.auth_password_reset_success());
      navigate({ to: getAuthPath({ view: "signIn" }), replace: true });
    },
  });

  if (token == null) {
    return (
      <AuthenticationCard
        title={localization.auth.resetPassword}
        description={m.auth_invalid_reset_password_token()}
      >
        <div className="rounded-lg border border-app-red/25 bg-app-red/10 p-4 text-sm text-app-text">
          {m.auth_reset_password_invalid_help()}
        </div>
        <AuthLink
          href={getAuthPath({ view: "forgotPassword" })}
          className="text-sm text-app-text-muted hover:text-app-text"
        >
          {localization.auth.sendResetLink}
        </AuthLink>
      </AuthenticationCard>
    );
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error(localization.auth.passwordsDoNotMatch);
      setPassword("");
      setConfirmPassword("");
      return;
    }

    resetPassword({ newPassword: password, token });
  }

  return (
    <AuthenticationCard
      title={localization.auth.resetPassword}
      description={m.auth_reset_password_description()}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reset-password">{localization.auth.newPassword}</Label>
          <Input
            id="reset-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={localization.auth.newPasswordPlaceholder}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            required
            minLength={8}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reset-confirm-password">{localization.auth.confirmPassword}</Label>
          <Input
            id="reset-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={localization.auth.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
            }}
            required
            minLength={8}
            disabled={isPending}
          />
        </div>

        <Button type="submit" fullWidth disabled={isPending}>
          <PendingIcon isPending={isPending} />
          {localization.settings.updatePassword}
        </Button>
      </form>
    </AuthenticationCard>
  );
}

function SignOutView() {
  const { localization, navigate } = useAuth();
  const { mutate: signOut, isPending } = useSignOut({
    onError: (error) => {
      toast.error(getAuthErrorMessage({ error }));
    },
    onSuccess: () => {
      navigate({ to: getAuthPath({ view: "signIn" }), replace: true });
    },
  });
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (hasTriggeredRef.current) {
      return;
    }

    hasTriggeredRef.current = true;
    signOut({});
  }, [signOut]);

  return (
    <AuthenticationCard
      title={localization.auth.signOut}
      description={m.auth_sign_out_description()}
    >
      {isPending ? <Loader /> : null}
      <div className="flex items-center justify-center gap-2 text-sm text-app-text-muted">
        <ShieldCheck className="size-4" />
        <span>{m.auth_redirecting_to_sign_in()}</span>
      </div>
    </AuthenticationCard>
  );
}
