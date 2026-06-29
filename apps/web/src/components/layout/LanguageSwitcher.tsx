import { Languages } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { m } from "@/paraglide/messages.js";
import { getLocale, isLocale, setLocale } from "@/paraglide/runtime.js";

function handleLocaleChange({ nextLocale }: { nextLocale: string }) {
  if (!isLocale(nextLocale)) {
    return;
  }

  void setLocale(nextLocale);
}

function getLocaleLabel({ locale }: { locale: string }) {
  return locale === "he" ? m.language_hebrew() : m.language_english();
}

export function LanguageSwitcher() {
  const currentLocale = getLocale();
  const currentLocaleLabel = getLocaleLabel({ locale: currentLocale });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button aria-label={m.language()} variant="secondary" size="sm" />}
      >
        <Languages className="size-4" />
        <span>{currentLocaleLabel}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{m.language()}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={currentLocale}
            onValueChange={(nextLocale: string) => {
              handleLocaleChange({ nextLocale });
            }}
          >
            <DropdownMenuRadioItem value="en">{m.language_english()}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="he">{m.language_hebrew()}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
