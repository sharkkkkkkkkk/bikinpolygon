export const BASEMAPS = [
  {
    id: 'satellite',
    name: 'Satelit / Hybrid',
    category: 'satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    fallbackUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Google Maps / Esri World Imagery',
    maxZoom: 22,
    maxNativeZoom: 20,
    requiresApiKey: false
  },
  {
    id: 'osm',
    name: 'OpenStreetMap Standard',
    category: 'street',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    requiresApiKey: false
  },
  {
    id: 'esri-imagery',
    name: 'Esri World Imagery',
    category: 'satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community',
    maxZoom: 19,
    requiresApiKey: false
  },
  {
    id: 'carto-light',
    name: 'CARTO Light (Positron)',
    category: 'light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    requiresApiKey: false
  },
  {
    id: 'carto-dark',
    name: 'CARTO Dark (Dark Matter)',
    category: 'dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    requiresApiKey: false
  },
  {
    id: 'opentopomap',
    name: 'OpenTopoMap (Topografi)',
    category: 'topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
    requiresApiKey: false
  }
];

export const DEFAULT_BASEMAP_ID = 'satellite';
