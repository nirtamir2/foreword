import { UserMenu } from "@/components/authentication/UserMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function GlobalHeaderControls() {
  return (
    <>
      <UserMenu />
      <LanguageSwitcher />
    </>
  );
}
