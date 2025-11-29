import { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://slabmarket.com";

// Static pages
const staticPages = [
  { url: "", changefreq: "daily", priority: 1.0 },
  { url: "/marketplace", changefreq: "hourly", priority: 0.9 },
  { url: "/trends", changefreq: "daily", priority: 0.8 },
  { url: "/help", changefreq: "weekly", priority: 0.7 },
  { url: "/help/faq", changefreq: "weekly", priority: 0.7 },
  { url: "/help/buying", changefreq: "monthly", priority: 0.6 },
  { url: "/help/selling", changefreq: "monthly", priority: 0.6 },
  { url: "/help/safety", changefreq: "monthly", priority: 0.6 },
  { url: "/pricing", changefreq: "monthly", priority: 0.7 },
  { url: "/contact", changefreq: "monthly", priority: 0.6 },
  { url: "/terms", changefreq: "monthly", priority: 0.5 },
  { url: "/privacy", changefreq: "monthly", priority: 0.5 },
  { url: "/about", changefreq: "monthly", priority: 0.6 },
];

function generateSitemap(pages: string[], cards: string[], slabs: string[]): string {
  const currentDate = new Date().toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
${pages
  .map(
    (url) => `  <url>
    <loc>${siteUrl}${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("\n")}
${cards
  .map(
    (url) => `  <url>
    <loc>${siteUrl}${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join("\n")}
${slabs
  .map(
    (url) => `  <url>
    <loc>${siteUrl}${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

export default function Sitemap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    // Return basic sitemap without dynamic content
    const sitemap = generateSitemap([], [], []);
    res.setHeader("Content-Type", "text/xml");
    res.write(sitemap);
    res.end();
    return { props: {} };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch cards with slugs
    const { data: cards } = await supabase
      .from("cards")
      .select("slug, id")
      .not("slug", "is", null)
      .limit(10000); // Limit to prevent huge sitemaps

    // Fetch slabs
    const { data: slabs } = await supabase
      .from("slabs")
      .select("id")
      .eq("status", "active")
      .limit(10000);

    const cardUrls =
      cards?.map((card) => `/card/${card.slug || card.id}`) || [];
    const slabUrls = slabs?.map((slab) => `/slab/${slab.id}`) || [];

    const sitemap = generateSitemap([], cardUrls, slabUrls);

    res.setHeader("Content-Type", "text/xml");
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return basic sitemap on error
    const sitemap = generateSitemap([], [], []);
    res.setHeader("Content-Type", "text/xml");
    res.write(sitemap);
    res.end();
  }

  return { props: {} };
};







