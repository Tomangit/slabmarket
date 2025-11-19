import Head from "next/head";
import { useRouter } from "next/router";

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
  structuredData?: object;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

const defaultTitle = "Slab Market - Premium Marketplace for Graded Trading Cards";
const defaultDescription = "Buy and sell authenticated graded trading cards with confidence. Real-time certificate verification, escrow protection, and investment-grade analytics for serious collectors and investors.";
const defaultImage = "/og-image.jpg"; // You'll need to create this
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://slabmarket.com";

export function SEO({
  title,
  description = defaultDescription,
  image = defaultImage,
  type = "website",
  noindex = false,
  nofollow = false,
  canonical,
  structuredData,
  keywords = ["graded cards", "trading cards", "Pokemon cards", "PSA", "BGS", "CGC", "slab market", "card marketplace"],
  author = "Slab Market",
  publishedTime,
  modifiedTime,
  section,
  tags = [],
}: SEOProps) {
  const router = useRouter();
  const fullTitle = title ? `${title} | Slab Market` : defaultTitle;
  const canonicalUrl = canonical || `${siteUrl}${router.asPath}`;
  const imageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;

  // Default structured data for Organization
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Slab Market",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: defaultDescription,
    sameAs: [
      // Add your social media links here
      // "https://twitter.com/slabmarket",
      // "https://facebook.com/slabmarket",
    ],
  };

  // Merge with custom structured data
  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}
      <meta name="author" content={author} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {(noindex || nofollow) && (
        <meta
          name="robots"
          content={`${noindex ? "noindex" : "index"}, ${nofollow ? "nofollow" : "follow"}`}
        />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="Slab Market" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {section && <meta property="article:section" content={section} />}
      {tags.length > 0 && tags.map((tag, i) => <meta key={i} property="article:tag" content={tag} />)}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {/* <meta name="twitter:site" content="@slabmarket" /> */}
      {/* <meta name="twitter:creator" content="@slabmarket" /> */}

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Structured Data (JSON-LD) */}
      {finalStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(finalStructuredData) }}
        />
      )}

      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
  );
}

