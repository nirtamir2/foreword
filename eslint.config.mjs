// @ts-check
import nirtamir2 from "@nirtamir2/eslint-config";

export default nirtamir2(
  {
    ignores: [
      "packages/db/prisma/generated/**",
      "apps/web/.vercel/**",
      ".vercel/**",
      "apps/web/stuff/**",
      "apps/web/project.inlang/README.md",
      "apps/web/public/register-service-worker.js",
      "apps/web/public/sw.js",
      "packages/db/backupDb.mjs",
      ".oxfmtrc.json",
    ],
    formatters: false,
    react: true,
    jsx: true,
    typescript: {
      tsconfigPath: "tsconfig.json",
    },
    tailwindcss: {
      entryPoint: "./apps/web/src/index.css",
    },
    gitignore: true,
    query: true,
  },
  [{ ignores: ["eslint.config.mjs"] }],
  [
    {
      settings: {
        "better-tailwindcss": {
          cwd: "./apps/web",
          entryPoint: "./src/index.css",
        },
      },
    },
    {
      rules: {
        "react-refresh/only-export-components": "off",
        "func-style": ["error", "declaration", { allowArrowFunctions: true }],
        "react/no-unknown-property": "off",
        "jsonc/sort-keys": "off",
        "sonarjs/cognitive-complexity": "off",
        "eslint-plugin-sort-destructure-keys-typescript/sort-destructure-keys-by-type": "off",
        "eslint-plugin-sort-destructure-keys-typescript/sort-jsx-attributes-by-type": "off",
      },
    },
  ],
);
