/**
 * Renders JSON-LD structured data for SEO and rich results.
 * Pass one or more schema.org objects; they are emitted as application/ld+json script tags.
 */

export const SITE_URL = "https://yournightstand.com";

type JsonLdSchema = Record<string, unknown>;

function JsonLdScript({ data }: { data: JsonLdSchema }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function JsonLd({ data }: { data: JsonLdSchema | JsonLdSchema[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((schema, i) => (
        <JsonLdScript key={i} data={schema} />
      ))}
    </>
  );
}

/** Landing page: WebSite + Organization + WebApplication */
export function LandingJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nightstand",
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
    sameAs: ["https://x.com/harshii04"],
  };

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nightstand",
    url: SITE_URL,
    description:
      "Save articles you discover into a quiet weekly reading list for the weekend. A reading list that gives you weekly recap of things to read.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-US",
  };

  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Nightstand",
    url: SITE_URL,
    applicationCategory: "LifestyleApplication",
    description:
      "Your reading pile, but it actually works. Save articles and get a weekly recap of things to read.",
    operatingSystem: "Web",
  };

  // Give organization an @id so WebSite can reference it
  const organizationWithId = {
    ...organization,
    "@id": `${SITE_URL}/#organization`,
  };

  return (
    <JsonLd data={[organizationWithId, webSite, webApplication]} />
  );
}

type PublicWeekJsonLdProps = {
  name: string;
  username: string;
  weekLabel: string;
  linkCount: number;
  pageUrl: string;
  links: Array<{ url: string; title: string | null }>;
};

/** Public week page: ItemList with author (Person) */
export function PublicWeekJsonLd({
  name,
  username,
  weekLabel,
  linkCount,
  pageUrl,
  links,
}: PublicWeekJsonLdProps) {
  const person = {
    "@type": "Person",
    name,
    url: `${SITE_URL}/u/${username}`,
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${name}'s reading — ${weekLabel}`,
    description: `${linkCount} article${linkCount === 1 ? "" : "s"} saved this week on Nightstand`,
    url: pageUrl,
    numberOfItems: linkCount,
    author: person,
    itemListElement: links.slice(0, 10).map((link, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: link.url,
      name: link.title || link.url,
    })),
  };

  return <JsonLd data={itemList} />;
}

type PublicCollectionJsonLdProps = {
  title: string;
  description: string | null;
  linkCount: number;
  pageUrl: string;
};

/** Public collection page: CollectionPage with Collection */
export function PublicCollectionJsonLd({
  title,
  description,
  linkCount,
  pageUrl,
}: PublicCollectionJsonLdProps) {
  const collection = {
    "@type": "Collection",
    name: title,
    description:
      description ||
      `${linkCount} link${linkCount === 1 ? "" : "s"} shared on Nightstand`,
    numberOfItems: linkCount,
    url: pageUrl,
  };

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${title} - Nightstand Collection`,
    description:
      description ||
      `${linkCount} link${linkCount === 1 ? "" : "s"} in this collection`,
    url: pageUrl,
    mainEntity: collection,
    isPartOf: {
      "@type": "WebSite",
      name: "Nightstand",
      url: SITE_URL,
    },
  };

  return <JsonLd data={collectionPage} />;
}
