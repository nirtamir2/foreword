import { paraglideVitePlugin } from "@inlang/paraglide-js";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["cookie", "preferredLanguage", "baseLocale"],
      emitTsDeclarations: true,
      emitReadme: false,
      emitPrettierIgnore: false,
      isServer: "import.meta.env.SSR",
    }),
    devtools(),
    nitro({
      preset: "vercel",
      traceDeps: [
        "@takumi-rs/image-response",
        "@takumi-rs/core",
        "@takumi-rs/helpers",
        "@takumi-rs/transformer-darwin-arm64",
        "@takumi-rs/transformer-darwin-x64",
        "@takumi-rs/transformer-linux-arm64-gnu",
        "@takumi-rs/transformer-linux-arm64-musl",
        "@takumi-rs/transformer-linux-x64-gnu",
        "@takumi-rs/transformer-linux-x64-musl",
      ],
    }),
    tanstackStart(),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3001,
    strictPort: true,
  },
});
