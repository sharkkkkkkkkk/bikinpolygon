/**
 * BikinPolygon Keyword Clusters & Search Intelligence Database
 * Digunakan untuk SEO automation, dynamic landing pages, dan structured data
 */

export const KEYWORD_CLUSTERS = [
    {
        clusterId: "core-landing-tool",
        name: "Core GIS Workspace & Generator",
        targetPage: "/",
        targetUrl: "https://bikinpolygon.xyz/",
        primaryKeyword: "buat polygon oss rba online",
        secondaryKeywords: [
            "upload peta polygon nib oss",
            "generator shapefile online indonesia",
            "bikin polygon tanpa qgis",
            "polygon koordinat nib oss",
            "peta tapak proyek amdalnet"
        ],
        intent: "transactional",
        priority: "P1",
        metaTitle: "BikinPolygon — Buat Peta Polygon OSS RBA & AMDALNET Online | Tanpa QGIS",
        metaDescription: "Generator Shapefile (.shp) Polygon Lahan NIB OSS RBA & Peta Tapak Proyek AMDALNET KLHK online instan. Output WGS84 EPSG:4326 lolos verifikasi BKPM."
    },
    {
        clusterId: "troubleshooting-error-oss",
        name: "Solusi Upload Polygon OSS Gagal & Ditolak",
        targetPage: "/blog/kenapa-upload-polygon-oss-gagal-dan-solusinya",
        targetUrl: "https://bikinpolygon.xyz/blog/kenapa-upload-polygon-oss-gagal-dan-solusinya",
        primaryKeyword: "kenapa upload polygon oss gagal",
        secondaryKeywords: [
            "penyebab polygon kkpr ditolak",
            "luas polygon tidak cocok dengan sertifikat",
            "format file shp untuk oss rba",
            "polygon oss wajib wgs84 epsg 4326",
            "cara kompres shapefile zip oss"
        ],
        intent: "informational",
        priority: "P1",
        metaTitle: "Kenapa Upload Polygon OSS Gagal? 5 Penyebab & Solusinya | BikinPolygon",
        metaDescription: "Pelajari penyebab gagal upload file polygon SHP di OSS RBA BKPM dan cara mudah mengatasinya dengan kalibrasi CRS WGS84 & koreksi luas otomatis."
    },
    {
        clusterId: "mobile-digitization",
        name: "Digitasi Polygon via HP / Smartphone",
        targetPage: "/blog/cara-membuat-polygon-oss-di-hp",
        targetUrl: "https://bikinpolygon.xyz/blog/cara-membuat-polygon-oss-di-hp",
        primaryKeyword: "cara buat polygon oss di hp",
        secondaryKeywords: [
            "cara membuat polygon oss di hp android",
            "gambar polygon nib di iphone",
            "digitasi peta oss lewat smartphone",
            "bikin polygon lahan tanpa laptop"
        ],
        intent: "how-to",
        priority: "P1",
        metaTitle: "Cara Membuat Polygon OSS di HP Android & iPhone Tanpa GIS | BikinPolygon",
        metaDescription: "Panduan praktis menggambar polygon lahan NIB OSS RBA langsung dari browser HP Android & iPhone tanpa perlu aplikasi berat."
    },
    {
        clusterId: "qgis-alternative-komparasi",
        name: "Alternatif QGIS & ArcGIS Tanpa Software Berat",
        targetPage: "/blog/cara-membuat-polygon-nib-dan-amdalnet-tanpa-gis",
        targetUrl: "https://bikinpolygon.xyz/blog/cara-membuat-polygon-nib-dan-amdalnet-tanpa-gis",
        primaryKeyword: "cara membuat polygon tanpa qgis",
        secondaryKeywords: [
            "alternatif qgis untuk oss rba",
            "cara buat polygon di bhumi atrbpn",
            "generator shapefile instan browser",
            "ekspor shp shx dbf prj otomatis"
        ],
        intent: "comparative",
        priority: "P1",
        metaTitle: "Cara Membuat Polygon NIB & AMDALNET Tanpa Software GIS | BikinPolygon",
        metaDescription: "Trik mudah membuat berkas Shapefile 4 file lengkap (.shp, .shx, .dbf, .prj) tanpa perlu menginstal aplikasi berat seperti ArcGIS atau QGIS."
    },
    {
        clusterId: "regulasi-tata-ruang-kkpr",
        name: "Pemahaman Regulasi Spasial OSS & AMDALNET",
        targetPage: "/blog/apa-itu-peta-polygon-oss-rba-dan-tapak-proyek-amdalnet",
        targetUrl: "https://bikinpolygon.xyz/blog/apa-itu-peta-polygon-oss-rba-dan-tapak-proyek-amdalnet",
        primaryKeyword: "apa itu peta polygon oss rba",
        secondaryKeywords: [
            "fungsi shapefile kkpr oss",
            "peta tapak proyek amdalnet klhk",
            "standar geospasial bkpm tata ruang",
            "verifikasi persil tanah bpn"
        ],
        intent: "educational",
        priority: "P2",
        metaTitle: "Apa Itu Peta Polygon OSS RBA & Tapak Proyek AMDALNET? | BikinPolygon",
        metaDescription: "Penjelasan lengkap fungsi data geospasial Polygon Shapefile dalam Perizinan Berusaha Berbasis Risiko (OSS RBA) dan AMDALNET KLHK."
    },
    {
        clusterId: "alur-lengkap-nib-oss",
        name: "Panduan Alur Pengurusan NIB Pelaku Usaha",
        targetPage: "/blog/cara-mendapatkan-nib-pelaku-usaha-di-oss-rba",
        targetUrl: "https://bikinpolygon.xyz/blog/cara-mendapatkan-nib-pelaku-usaha-di-oss-rba",
        primaryKeyword: "cara mendapatkan nib di oss rba",
        secondaryKeywords: [
            "tahap upload lokasi usaha oss",
            "persyaratan polygon non umk oss",
            "terbit nib instan",
            "kbli izin tata ruang"
        ],
        intent: "tutorial",
        priority: "P2",
        metaTitle: "Cara Mendapatkan NIB Pelaku Usaha di OSS RBA Terbaru | BikinPolygon",
        metaDescription: "Langkah demi langkah mengurus Nomor Induk Berusaha (NIB) lengkap hingga tahap upload lokasi lahan dan terbitnya izin berusaha."
    }
];

export const generateSEOMeta = (clusterId) => {
    const cluster = KEYWORD_CLUSTERS.find(c => c.clusterId === clusterId);
    if (!cluster) return null;
    return {
        title: cluster.metaTitle,
        description: cluster.metaDescription,
        canonical: cluster.targetUrl,
        keywords: [cluster.primaryKeyword, ...cluster.secondaryKeywords].join(", ")
    };
};
