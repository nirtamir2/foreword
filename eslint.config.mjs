import nirtamir2 from "@nirtamir2/eslint-config";

// Keep parser/processor and type-service coverage that Oxlint cannot execute.
// Ordinary JS/TS rules run in Oxlint; Markdown's extracted code runs in ESLint.
const configs = await nirtamir2(
  {
    ignores: [
      "packages/db/prisma/generated/**",
      "apps/web/.vercel/**",
      ".vercel/**",
      "apps/web/stuff/**",
      "apps/web/src/paraglide/**",
      "apps/web/project.inlang/README.md",
      "apps/web/public/register-service-worker.js",
      "apps/web/public/sw.js",
      "packages/db/backupDb.mjs",
      ".oxfmtrc.json",
      "eslint.config.mjs",
    ],
    formatters: false,
    react: true,
    jsx: true,
    typescript: { tsconfigPath: "tsconfig.json" },
    tailwindcss: { entryPoint: "./apps/web/src/index.css" },
    gitignore: true,
    query: true,
  },
  {
    settings: {
      "better-tailwindcss": { cwd: "./apps/web", entryPoint: "./src/index.css" },
    },
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
);

// These React rules require parser services but do not advertise that in rule metadata.
const typedReactRules = new Set([
  "@eslint-react/no-unused-props",
  "@eslint-react/no-implicit-children",
  "@eslint-react/no-implicit-key",
  "@eslint-react/no-implicit-ref",
  "@eslint-react/no-leaked-conditional-rendering",
]);

export default [
  ...configs.flatMap((config) => {
    if (config.name === "nirtamir2/react/classname-components") {
      // The TypeScript producer already enables projectService. Using its nearest
      // tsconfig avoids combining that service with the classname producer's project option.
      config = {
        ...config,
        ignores: [...(config.ignores ?? []), "**/*.md/**"],
        languageOptions: {
          ...config.languageOptions,
          parserOptions: { ...config.languageOptions.parserOptions, project: false },
        },
      };
    }
    if (
      /^antfu\/(?:jsonc|yaml|toml|sort|pnpm|markdown)\//.test(config.name ?? "") ||
      config.rules == null
    ) {
      return [config];
    }

    const rules = Object.fromEntries(
      Object.entries(config.rules).filter(
        ([rule, value]) =>
          (Array.isArray(value) ? value[0] : value) === "off" ||
          (Array.isArray(value) ? value[0] : value) === 0 ||
          /^(?:eslint-plugin-classname-components|ssr-friendly|expect-type|eslint-plugin-sort-destructure-keys-typescript)\//.test(
            rule,
          ),
      ),
    );

    return [
      { ...config, rules },
      {
        ...config,
        name: `${config.name ?? "foreword"}/markdown-code`,
        files: config.files?.map((pattern) => ["**/*.md/**", pattern]) ?? ["**/*.md/**"],
      },
    ];
  }),
  {
    files: ["**/*.tsx"],
    ignores: ["**/*.md/**"],
    rules: Object.fromEntries(
      configs.flatMap((config) =>
        Object.entries(config.rules ?? {}).filter(([rule]) => typedReactRules.has(rule)),
      ),
    ),
  },
  {
    // Extracted Markdown examples are virtual files outside every TS project.
    files: ["**/*.md/**"],
    languageOptions: { parserOptions: { project: false, projectService: false } },
    rules: {
      "expect-type/expect": "off",
      ...Object.fromEntries([...typedReactRules].map((rule) => [rule, "off"])),
    },
  },
];
