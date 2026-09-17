# Foreword

Learn the words before you open the book.

Foreword takes an EPUB or a text-based PDF, parses it entirely in the browser, ranks the vocabulary a
reader at a given level is most likely to stumble on, and turns that shortlist into study cards with
translations, explanations and real sentences from the book. Cards are studied with flashcards,
multiple-choice questions and recall prompts, and every answer moves a card between New, Learning and
Known. Hard words can get a five-second generated scene that shows their meaning.

The full book never reaches the server. Only ranked candidates, short example snippets and your
progress are stored.

## Stack

- TypeScript monorepo with `pnpm` workspaces
- React + TanStack Start + TanStack Router
- Better Auth with Prisma/PostgreSQL and Google OAuth
- oRPC with TanStack Query helpers
- TanStack AI with the Gemini adapter (card text) and the fal.ai adapter (teaching clips)
- Tailwind CSS v4 with Base UI primitives
- Paraglide i18n with English and Hebrew, including full RTL layouts
- Browser parsing with `jszip` + `htmlparser2` (EPUB), `pdfjs-dist` (PDF), `franc-min` (language detection), and a Comlink Web Worker for ranking

## Workspace layout

| Path                     | Purpose                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `apps/web`               | TanStack Start app: routes, feature components, browser parsing and analysis pipeline   |
| `packages/api`           | oRPC routers (books, analysis, cards, study, export, media) and the AI refinement layer |
| `packages/text-analysis` | Pure, dependency-free candidate extraction and ranking                                  |
| `packages/db`            | Prisma schema and client                                                                |
| `packages/auth`          | Better Auth configuration                                                               |
| `packages/env`           | Typed environment variables                                                             |

## How preparation works

1. **Parse** – the file is hashed (SHA-256) and parsed in the browser. EPUB chapters follow the spine;
   PDF pages are folded into ten-page sections.
2. **Detect** – language is detected from the text and reconciled with file metadata.
3. **Rank** – a Web Worker scores words, bigrams and trigrams by difficulty for the learner's level
   (frequency-list rank), in-book frequency, how early they appear relative to the starting position,
   usefulness, and story importance. A curated phrase lexicon surfaces phrasal verbs and idioms.
4. **Save** – the top candidates are persisted in bounded batches as `VocabularyCandidate` rows with
   short snippets only.
5. **Refine** – the server turns the highest-priority pending candidates into `VocabCard` rows through
   TanStack AI + Gemini, in small serial batches with retry, split-on-failure and partial-result
   handling. Without an `AI_API_KEY` the app falls back to placeholder cards so the flow stays
   demonstrable.
6. **Ready** – the book is marked READY once cards exist or the backlog is exhausted. If the tab is
   closed midway, the book page offers to resume from the saved backlog, from the file kept in
   IndexedDB, or from a re-upload that is verified against the content hash.

"Add more words" refines the next backlog batch; when the backlog is empty it re-analyses the saved file
while excluding everything already known or stored, so the next 600 candidates are genuinely new.

## Setup

1. Copy `apps/web/.env.example` to `apps/web/.env` and fill in the values.
   - `AI_API_KEY` (Gemini) enables real translations and explanations.
   - `FAL_KEY` enables generated teaching clips. `FAL_VIDEO_MODEL` defaults to a fast LTX model.
2. Install and generate the Prisma client:

```bash
pnpm install
pnpm run db:generate
```

3. Push the schema:

```bash
pnpm run db:push
```

4. Start the web app:

```bash
pnpm run dev:web
```

Open [http://localhost:3001](http://localhost:3001).

## Scripts

- `pnpm run dev:web` – run the TanStack Start app
- `pnpm run build` – build all workspaces
- `pnpm run type-check` – type-check all workspaces
- `pnpm run lint` – run ESLint
- `pnpm run format` – run oxfmt
- `pnpm run db:generate` / `db:push` / `db:migrate` / `db:studio` – Prisma

## Privacy model

- Uploaded files are validated by type and size and parsed locally.
- The server receives only: book metadata, a content hash, ranked candidate forms with up to two short
  snippets each, and study answers.
- Every book-scoped procedure checks ownership; users can only read or change their own books, cards,
  candidates and study history.
- The original file may be kept in the browser's IndexedDB so more vocabulary can be prepared later
  without re-uploading. Deleting a book also removes that local copy.
