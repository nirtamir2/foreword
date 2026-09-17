import { Layers, ListChecks, PenLine } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { m } from "@/paraglide/messages.js";

export type StudyMode = "FLASHCARD" | "MCQ" | "RECALL";

export const STUDY_MODES: ReadonlyArray<StudyMode> = ["FLASHCARD", "MCQ", "RECALL"];

export function studyModeLabel({ mode }: { mode: StudyMode }): string {
  switch (mode) {
    case "FLASHCARD": {
      return m.mode_flashcards();
    }
    case "MCQ": {
      return m.mode_multiple_choice();
    }
    case "RECALL": {
      return m.mode_recall();
    }
  }
}

interface Props {
  mode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
}

export function StudyModeTabs({ mode, onModeChange }: Props) {
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => {
        onModeChange(value as StudyMode);
      }}
    >
      <TabsList aria-label={m.study_mode_label()}>
        <TabsTrigger value="FLASHCARD">
          <Layers />
          {studyModeLabel({ mode: "FLASHCARD" })}
        </TabsTrigger>
        <TabsTrigger value="MCQ">
          <ListChecks />
          {studyModeLabel({ mode: "MCQ" })}
        </TabsTrigger>
        <TabsTrigger value="RECALL">
          <PenLine />
          {studyModeLabel({ mode: "RECALL" })}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
