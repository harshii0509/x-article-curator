import { unfurl } from "unfurl.js";

import { assertPublicHostname, validateHttpUrl } from "@/lib/url-validation";

export interface ArticleMetadata {
  title?: string;
  author?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  favicon?: string;
}

function sanitizeUrl(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw) return undefined;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return raw;
    }
  } catch {
    // invalid URL
  }
  return undefined;
}

export async function unfurlUrl(url: string): Promise<ArticleMetadata> {
  const check = validateHttpUrl(url);
  if (!check.valid) {
    throw new Error(check.reason);
  }

  await assertPublicHostname(check.parsed.hostname);

  const data = (await unfurl(url, {
    oembed: false,
    timeout: 5000,
  })) as any;

  const openGraph = data?.open_graph ?? {};
  const twitterCard = data?.twitter_card ?? {};

  const title =
    openGraph.title ??
    twitterCard.title ??
    data?.title ??
    data?.metadata?.title;

  const description =
    openGraph.description ??
    twitterCard.description ??
    data?.description ??
    data?.metadata?.description;

  const rawImageUrl =
    openGraph.images?.[0]?.url ??
    openGraph.image?.url ??
    twitterCard.images?.[0]?.url ??
    twitterCard.image?.url ??
    data?.open_graph?.image?.url;

  const siteName =
    openGraph.site_name ??
    twitterCard.site ??
    data?.site_name ??
    data?.metadata?.ogSiteName;

  const author =
    openGraph.article?.author ??
    twitterCard.creator ??
    twitterCard.creator_id ??
    data?.metadata?.author;

  const rawFavicon =
    data?.favicon ??
    data?.icons?.[0]?.url ??
    data?.metadata?.favicon ??
    data?.metadata?.icon;

  return {
    title,
    author,
    description,
    imageUrl: sanitizeUrl(rawImageUrl),
    siteName,
    favicon: sanitizeUrl(rawFavicon),
  };
}
