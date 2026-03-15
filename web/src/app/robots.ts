import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/c/", "/u/"],
      disallow: ["/api/", "/dashboard/", "/collections/", "/shared/"],
    },
    sitemap: "https://yournightstand.com/sitemap.xml",
  };
}
