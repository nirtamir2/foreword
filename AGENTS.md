# TailwindCSS & Styling Standards

## Conditional Classes

- Use `clsx` every time you write className conditionally
- Do NOT use `tailwind-merge` or `cn` functions
- Use `clsx` only for conditional className logic

## Component Variants

- `cva` (class-variance-authority) is fine for UI design system components
- Do NOT inject external `className` props into `cva` components
- Export `cva` variables from their files (single export preference applies but variants are okay)

## Component Structure

- Component file names: PascalCase (e.g., `ComponentName.tsx`)
- Function names: camelCase with matching file name
- Route files: kebab-case following framework conventions
- Each file should export one thing only (compound components can export related items)

## Anti-Patterns to Avoid

- 🚨 NEVER accept `className` props in custom components
- Replace `className` props with meaningful variant props
- Inject className logic inside component using `clsx`
- Only allow `className` for primitive/3rd party BaseUI components without styles
- Avoid `clsx("base-styles", className)` patterns

## Layout & Spacing

- Use padding instead of margins
- Use flex and gap instead of margin or space-y utilities
- Margins are harmful - only `auto` is acceptable
- Use `flex-wrap` regularly
- Practice defensive CSS: add gaps, design for insufficient space scenarios

## Type Safety

- Use `export type OmitClassName<T> = Omit<T, "className">` when needed to prevent className prop passing

# Files & Organization

## File Structure

- Each `ComponentName.tsx` should export `function ComponentName(props: Props)`
- Functions extracted to separate files should be `functionName.ts` with camelCase naming
- utils folder: optional, contains general utility functions (date.ts, i18n.ts, formatting, url handling...)
- Core UI elements in `ui` folder
- Feature components in `components/[featureName]/` folders

## Export Principles

- One export per file when possible
- Never export default, use named exports only
- Prefer immediate export like export function ComponentName() {} over separate export statements
- Compound components can export multiple related components from same file
- No index.ts barrel files for re-exports
- Small, single-use components can stay in their parent file
- Feature-based organization: components grouped by domain

# JSX

- I prefer to have ternary operator in JSX `isVisible ? <ComponentA /> : null` instead of `isVisible && <ComponentA />` because it is more explicit.
- Props type name is `Props`. Use interface Props {} instead of type Props = {} if possible. Sometimes you can use `type-fest` library for advanced types and do some & intersections and use a type instead of interface.

# TypeScript

- Component styles are named functions.
- File name should match the export. For functions camelCase, for components PascalCase.
- Compare with empty string with `a.length === 0` or `a.length > 0` instead of `a === ""` or `a !== ""`.
- I check null with `a != null` instead of `a !== null && a !== undefined`, or `a` if nullable.
- I prefer to have a function with a single object parameter instead of multiple parameters. Sometimes it's okay to have multiple parameters like in comparator functions, but generally I prefer single object parameter.
- Prefer using null instead of undefined.
- Try to avoid optional props. Prefer required props with null. It depends on how important is to have this prop. It's fine to have optional props in some cases. Especially if you have a lot of usages of the component and the prop is not always needed.

# Tanstack Start

- I use `context.queryClient.ensureQueryData` on the page loader.
- For tanstack-query renders I prefer to use `{query.isSuccess ? <Component data={query.data} /> : null}` and `{query.isLoading ? <Loader /> : null} ` instead of nested ternary checks. It is more explicit in JSX what is rendered in each state.
