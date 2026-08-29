import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://bikinpolygon.xyz';

export default function SEOHead({ 
  title = "Buat Polygon NIB OSS & AMDALNET KLHK Online | BikinPolygon", 
  description = "Aplikasi GIS Workspace online untuk pembuatan Polygon Shapefile (.shp) NIB OSS RBA & Peta Tapak Proyek AMDALNET KLHK instan. Hasil ekspor EPSG:4326 & EPSG:3857 tanpa software ArcGIS/QGIS.",
  canonicalUrl = `${SITE_URL}/`,
  ogImage = `${SITE_URL}/assets/og-cover.jpg`,
  type = "website",
  schemaData = null
}) {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="BikinPolygon" />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Inject page-specific structured data if provided */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
}
