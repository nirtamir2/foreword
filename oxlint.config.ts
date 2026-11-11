import oxlint from "@nirtamir2/eslint-config/oxlint";

export default oxlint(
  {
    ignores: [
      "packages/db/prisma/generated/**",
      "apps/web/.vercel/**",
      ".vercel/**",
      "apps/web/stuff/**",
      "apps/web/src/paraglide/**",
      "apps/web/public/register-service-worker.js",
      "apps/web/public/sw.js",
      "packages/db/backupDb.mjs",
    ],
    jsx: true,
    react: true,
    query: true,
    tailwindcss: {
      entryPoint: "./apps/web/src/index.css",
    },
    typescript: {
      typeAware: true,
    },
    rules: {
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      "react/only-export-components": "off",
      "sonarjs/cognitive-complexity": "off",
      // Helper components are declared below the component that renders them.
      // Function declarations are hoisted, so only variables need the check.
      "no-use-before-define": ["error", { classes: false, functions: false, variables: true }],
      // AGENTS.md requires component props to be named `Props`/`props`.
      "eslint-unicorn/name-replacements": "off",
      // `await promise.catch(() => fallback)` is the project idiom; try/catch
      // would need a mutable binding for each fallback value.
      "eslint-unicorn/prefer-await": "off",
      // Its fixer rewrites one-line JSDoc into `/**\ntext\n*/` without the
      // ` * ` gutter, contradicting the repo's existing one-line JSDoc style.
      "eslint-unicorn/single-line-block-comment-style": "off",
      // Its fixer rewrites `String.fromCodePoint` to `fromCharCode`, which the
      // native `unicorn/prefer-code-point` in the same preset then rejects.
      "e18e/prefer-string-fromcharcode": "off",
    },
  },
  {
    settings: {
      "better-tailwindcss": {
        cwd: "./apps/web",
        entryPoint: "./src/index.css",
      },
    },
    overrides: [
      {
        // `Link` comes from the better-auth-ui context (`useAuth()`); it is a
        // stable component reference, not a component created during render.
        files: ["apps/web/src/components/authentication/AuthenticationView.tsx"],
        rules: {
          "@eslint-react/static-components": "off",
        },
      },
    ],
  },
);
