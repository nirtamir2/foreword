Build a new vocabulary-learning application inspired by ../vocabulary-book.

First inspect:

- ../vocabulary-book
- The current repository architecture, conventions, scripts, and existing UI
- Existing authentication, database, i18n, routing, and component patterns

Do not copy the React implementation directly. Adapt the product to this repository’s existing stack and conventions. Please change the styles completely. The ui does not look good at the moment at all and the colors are not good at the moment - replace them. You can take inspiration from shadcn, or https://21st.dev/ if you want.

## Product goal

Users upload an EPUB or text-based PDF in order to prepare vocabulary before reading a book in another language.

The application should:

1. Parse the book locally in the browser.
2. Detect the book language and extract metadata.
3. Rank useful words and phrases based on:
   - difficulty
   - frequency in the book
   - occurrence early in the book
   - usefulness
   - phrases and idioms
4. Generate vocabulary cards with:
   - headword
   - display form
   - lemma
   - translation
   - part of speech
   - explanation
   - example sentences from the book
   - difficulty
   - frequency
5. Let users study cards using:
   - flashcards
   - multiple-choice questions
   - recall questions
6. Track learning progress:
   - New
   - Learning
   - Known
7. Allow users to edit, delete, filter, sort, and export cards.
8. Support adding more vocabulary later without re-uploading unless the browser no longer has the original file.
9. Support English and Hebrew, including RTL layout.
10. Keep the full uploaded book private: never persist the complete book text on the server.

## Main routes

Implement these user flows:

- `/`
  - Product landing page
  - Explain upload → vocabulary preparation → study workflow
  - Show sign-in/sign-up actions for unauthenticated users
  - Show “Add a book” and “Open library” for authenticated users

- `/library`
  - Authenticated user’s books
  - Empty state when no books exist
  - Book cards showing title, author, language, and progress

- `/books/new`
  - Upload EPUB or text-based PDF
  - Parse file locally
  - Display detected title, author, format, chapters, word count, and language
  - Ask for:
    - book language
    - native language
    - learner level: beginner, intermediate, advanced
    - starting position in the book
  - Show progress while vocabulary is prepared
  - Warn before leaving while processing

- `/books/:bookId`
  - Book overview
  - Number of words remaining to learn
  - Known, learning, and new counts
  - Progress bar
  - Vocabulary table
  - Filters: To learn, New, Learning, Known, All
  - Sort options: Priority, Alphabetical, Recent
  - Add more words
  - Review known words
  - Export CSV
  - Edit and delete cards
  - Handle pending, interrupted, and resumable analysis states

- `/study/:bookId`
  - Study session for the selected book
  - Flashcard mode
  - Multiple-choice mode
  - Recall mode
  - Record every answer
  - Update card review state
  - Show session progress and completion feedback

## Data model

Create equivalent persistence for:

### Book

- id
- userId
- title
- author
- bookLanguage
- nativeLanguage
- level
- sourceFormat
- contentHash
- totalChapters
- totalWords
- starting position
- analysis status
- timestamps

### VocabularyCandidate

Stores ranked candidate metadata and short snippets only:

- surface form
- normalized form
- word or phrase kind
- snippets
- local difficulty
- book frequency
- first chapter index
- usefulness
- story importance
- priority score
- pending/refined/skipped/deleted status

Ensure all user-owned records are protected by user ownership checks.

Then you can generate a video that help teach the word using fal ai.
Use tanstack ai for it too.

If you think we can improve the product goal, please suggest improvements.

## Privacy and processing requirements

- Parse EPUB and PDF in the browser.
- Never store the complete uploaded file or complete book text on the server.
- Only send ranked candidates and short contextual snippets to the server/AI layer.
- Validate uploaded file type and size.
- Use content hashes to verify that a re-uploaded file is the same book.
- Do not expose another user’s books, cards, candidates, or study history.

## Analysis behavior

Implement analysis as a resumable pipeline:

1. Parse the document.
2. Extract chapters and normalized text.
3. Detect language.
4. Generate local vocabulary candidates.
5. Rank candidates locally.
6. Persist candidates in bounded batches.
7. Refine candidates into vocabulary cards using the existing AI/API conventions.
8. Report progress to the UI.
9. Allow the user to resume after interruption.
10. Mark the book READY only when preparation is complete.

## UI requirements

Follow the current repository’s design system and component conventions.

- Reuse existing layout, button, card, dialog, table, toast, loading, and form primitives.
- Use responsive layouts for mobile and desktop.
- Support RTL correctly, not just translated text.
- Use accessible labels, keyboard navigation, focus management, and semantic HTML.
- Avoid introducing a second styling system.
- Avoid unnecessary global state.
- Keep route components focused and extract feature components where appropriate.
- Preserve existing application functionality.

## Dont test the code at all or create tests

Make it impressive and beautiful. Make it look like a product that is ready to be used by users. This is for hackathon so we want to impress the judges. Goal is to make it look like a product that is ready to be used by users.
