import { getLocale } from "@/paraglide/runtime.js";
import { appName } from "@/utils/appName";

interface BuildSeoParams {
  description: string;
  noIndex?: boolean;
  pathname: string;
  title: string;
}

function buildOgImageUrl({ description, title }: { description: string; title: string }) {
  const params = new URLSearchParams();
  params.set("locale", getLocale());
  params.set("title", title);
  params.set("subtitle", description);

  return `/api/og?${params.toString()}`;
}

export function withAppName({ title }: { title: string }) {
  const localizedAppName = appName();

  if (title.length === 0) {
    return localizedAppName;
  }
  return `${title} | ${localizedAppName}`;
}

export function buildSeo({ description, noIndex = false, pathname, title }: BuildSeoParams) {
  const locale = getLocale();
  const imageUrl = buildOgImageUrl({ description, title });

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: locale },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: imageUrl },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:url", content: pathname },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: imageUrl },
      {
        name: "robots",
        content: noIndex ? "noindex,nofollow" : "index,follow",
      },
    ],
  };
}
