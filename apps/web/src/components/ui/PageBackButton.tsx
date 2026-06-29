import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { m } from "@/paraglide/messages.js";
import { getTextDirection } from "@/paraglide/runtime.js";

interface Props {
  onBack: () => void;
}

export function PageBackButton({ onBack }: Props) {
  const textDirection = getTextDirection();
  const BackIcon = textDirection === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <Button aria-label={m.back()} variant="ghost" size="sm" onClick={onBack}>
      <BackIcon className="size-5" />
    </Button>
  );
}
