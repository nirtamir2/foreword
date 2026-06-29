import type { Font } from "@takumi-rs/core";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { m } from "@/paraglide/messages.js";

const INTER_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap";
const FONT_FACE_BLOCK_REGEX = /@font-face\s*{[^}]*}/g;
const FONT_SRC_REGEX = /src:\s*url\((https:\/\/[^)]+)\)\s*format\('(truetype|woff2)'\)\s*;/;
const FONT_WEIGHT_REGEX = /font-weight:\s*(\d+)/;

const ogQuerySchema = z.object({
  title: z.string(),
  subtitle: z.string().nullable(),
});

let interFontsPromise: Promise<Array<Font>> | null = null;

async function getInterFonts() {
  interFontsPromise ??= loadInterFonts();

  return await interFontsPromise;
}

async function loadInterFonts() {
  const response = await fetch(INTER_CSS_URL);
  if (!response.ok) {
    return [];
  }

  const css = await response.text();
  const fontFaceBlocks = Array.from(css.matchAll(FONT_FACE_BLOCK_REGEX), ([block]) => block);
  const fonts = await Promise.all(
    fontFaceBlocks.map(async (block) => {
      const srcMatch = FONT_SRC_REGEX.exec(block);
      if (srcMatch == null) {
        return null;
      }

      const weightMatch = FONT_WEIGHT_REGEX.exec(block);
      const weight = weightMatch == null ? 400 : Number.parseInt(weightMatch[1], 10);
      const fontResponse = await fetch(srcMatch[1]);
      const data = await fontResponse.arrayBuffer();

      return {
        data,
        name: "Inter",
        style: "normal",
        weight,
      } satisfies Font;
    }),
  );

  return fonts.filter((font) => font != null);
}

async function handleGet({ request }: { request: Request }) {
  const { ImageResponse } = await import("@takumi-rs/image-response");
  const fonts = await getInterFonts();
  const { searchParams } = new URL(request.url);
  const ogQueryResult = ogQuerySchema.parse({
    title: searchParams.get("title") ?? "",
    subtitle: searchParams.get("subtitle"),
  });
  const ogQuery = {
    ...ogQueryResult,
    title: ogQueryResult.title.trim().length > 0 ? ogQueryResult.title : m.app_name(),
  };

  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0b1020 0%, #141a2f 55%, #10241f 100%)",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter",
        gap: "28px",
        height: "100%",
        justifyContent: "center",
        padding: "64px",
        width: "100%",
      }}
    >
      <div
        style={{
          color: "#2dd4bf",
          display: "flex",
          fontSize: "26px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {m.template_badge()}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: "76px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.04,
          maxWidth: "980px",
        }}
      >
        {ogQuery.title}
      </div>
      {ogQuery.subtitle == null ? null : (
        <div
          style={{
            color: "rgba(248,250,252,0.72)",
            display: "flex",
            fontSize: "30px",
            lineHeight: 1.35,
            maxWidth: "860px",
          }}
        >
          {ogQuery.subtitle}
        </div>
      )}
    </div>,
    {
      fonts,
      width: 1200,
      height: 630,
    },
  );
}

export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      GET: handleGet,
    },
  },
});
