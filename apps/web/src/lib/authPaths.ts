import type {
  AuthView,
  AuthViewPaths,
  BasePaths,
  SettingsView,
  SettingsViewPaths,
  ViewPaths,
} from "@better-auth-ui/react/core";

export const authBasePaths = {
  auth: "/auth",
  settings: "/settings",
  organization: "/organization",
} satisfies BasePaths;

export const authViewPaths = {
  signIn: "login",
  signUp: "sign-up",
  // Better Auth UI expects a magic-link path even when the feature is disabled.
  magicLink: "__magic-link-disabled__",
  // eslint-disable-next-line sonarjs/no-hardcoded-passwords
  forgotPassword: "forgot-password",
  // eslint-disable-next-line sonarjs/no-hardcoded-passwords
  resetPassword: "reset-password",
  signOut: "sign-out",
} satisfies AuthViewPaths;

export const settingsViewPaths = {
  account: "account",
  security: "security",
} satisfies SettingsViewPaths;

export const betterAuthViewPaths = {
  auth: authViewPaths,
  settings: settingsViewPaths,
} satisfies ViewPaths;

export const authRoutePaths = new Set<string>([
  authViewPaths.signIn,
  authViewPaths.signUp,
  authViewPaths.forgotPassword,
  authViewPaths.resetPassword,
  authViewPaths.signOut,
]);

export function getAuthPath({ view }: { view: AuthView }) {
  return `${authBasePaths.auth}/${authViewPaths[view]}`;
}

export function getSettingsPath({ view }: { view: SettingsView }) {
  return `${authBasePaths.settings}/${settingsViewPaths[view]}`;
}
