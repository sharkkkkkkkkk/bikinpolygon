export const MONEY_KEYWORDS = [
    {
        keyword: "cara buat polygon untuk oss",
        searchVolume: "high",
        intent: "tutorial",
        difficulty: "medium",
        geo: ["jakarta", "surabaya", "bandung", "semarang", "medan"],
        relatedTerms: ["oss rba", "izin usaha", "nib online"],
        localVariant: "cara buat polygon oss {city}"
    },
    {
        keyword: "upload peta polygon nib oss",
        searchVolume: "high",
        intent: "transactional",
        difficulty: "low",
        geo: ["jakarta", "tangerang", "bekasi", "bogor", "depok"],
        relatedTerms: ["perizinan berusaha", "sistem oss"],
        localVariant: "jasa upload polygon nib {city}"
    }
];

export const generateSEOMeta = (keyword, city = null) => {
    const location = city ? ` ${city}` : " Indonesia";
    return {
        title: `${keyword}${location} | BikinPolygon GIS Workspace`,
        description: `Pembuatan polygon Shapefile (.shp) NIB OSS RBA & AMDALNET KLHK presisi tinggi${location}. Hasil ekspor WGS84 & Web Mercator instan tanpa software GIS.`,
        keywords: `${keyword}, polygon NIB OSS, shapefile OSS, buat SHP online, AMDALNET KLHK, peta tapak proyek`,
        canonical: `https://bikinpolygon.xyz/`
    };
};

export const generateSchemaMarkup = (keyword, city = null) => {
    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "BikinPolygon GIS Land Scaler",
        "description": "Aplikasi Pembuatan Polygon Shapefile NIB OSS RBA & AMDALNET",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "IDR"
        }
    };
};
