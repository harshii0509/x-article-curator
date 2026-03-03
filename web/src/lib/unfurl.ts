import unfurl from "unfurl.js";

export interface ArticleMetadata {
  title?: string;
  author?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
}

export async function unfurlUrl(url: string): Promise<ArticleMetadata> {
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

  const imageUrl =
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

  return {
    title,
    author,
    description,
    imageUrl,
    siteName,
  };
}

