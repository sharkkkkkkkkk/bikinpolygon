/**
 * Utility API Open-Source Data Wilayah Indonesia (38 Provinsi Stasis + API Regencies/Districts)
 * Primary source: emsifa.github.io / raw.githubusercontent.com
 */

export const STATIC_PROVINCES = [
  { id: "11", name: "ACEH" },
  { id: "12", name: "SUMATERA UTARA" },
  { id: "13", name: "SUMATERA BARAT" },
  { id: "14", name: "RIAU" },
  { id: "15", name: "JAMBI" },
  { id: "16", name: "SUMATERA SELATAN" },
  { id: "17", name: "BENGKULU" },
  { id: "18", name: "LAMPUNG" },
  { id: "19", name: "KEPULAUAN BANGKA BELITUNG" },
  { id: "21", name: "KEPULAUAN RIAU" },
  { id: "31", name: "DKI JAKARTA" },
  { id: "32", name: "JAWA BARAT" },
  { id: "33", name: "JAWA TENGAH" },
  { id: "34", name: "DI YOGYAKARTA" },
  { id: "35", name: "JAWA TIMUR" },
  { id: "36", name: "BANTEN" },
  { id: "51", name: "BALI" },
  { id: "52", name: "NUSA TENGGARA BARAT" },
  { id: "53", name: "NUSA TENGGARA TIMUR" },
  { id: "61", name: "KALIMANTAN BARAT" },
  { id: "62", name: "KALIMANTAN TENGAH" },
  { id: "63", name: "KALIMANTAN SELATAN" },
  { id: "64", name: "KALIMANTAN TIMUR" },
  { id: "65", name: "KALIMANTAN UTARA" },
  { id: "71", name: "SULAWESI UTARA" },
  { id: "72", name: "SULAWESI TENGAH" },
  { id: "73", name: "SULAWESI SELATAN" },
  { id: "74", name: "SULAWESI TENGGARA" },
  { id: "75", name: "GORONTALO" },
  { id: "76", name: "SULAWESI BARAT" },
  { id: "81", name: "MALUKU" },
  { id: "82", name: "MALUKU UTARA" },
  { id: "91", name: "PAPUA BARAT" },
  { id: "92", name: "PAPUA" },
  { id: "93", name: "PAPUA SELATAN" },
  { id: "94", name: "PAPUA TENGAH" },
  { id: "95", name: "PAPUA PEGUNUNGAN" },
  { id: "96", name: "PAPUA BARAT DAYA" }
];

export async function fetchProvinces() {
  const urls = [
    'https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json',
    'https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json',
    'https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/main/api/provinces.json'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(p => ({ id: String(p.id), name: String(p.name).toUpperCase() }));
        }
      }
    } catch (error) {
      // try next URL
    }
  }
  return STATIC_PROVINCES;
}

export async function fetchRegencies(provinceId) {
  if (!provinceId) return [];
  const cleanId = String(provinceId).trim();
  
  const urls = [
    `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${cleanId}.json`,
    `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${cleanId}.json`,
    `https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/main/api/regencies/${cleanId}.json`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(r => ({ id: String(r.id), province_id: String(r.province_id), name: String(r.name).toUpperCase() }));
        }
      }
    } catch (e) {
      // try next URL
    }
  }

  console.error('Failed to fetch regencies for province', provinceId);
  return [];
}

export async function fetchDistricts(regencyId) {
  if (!regencyId) return [];
  const cleanId = String(regencyId).trim();

  const urls = [
    `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cleanId}.json`,
    `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${cleanId}.json`,
    `https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/main/api/districts/${cleanId}.json`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(d => ({ id: String(d.id), regency_id: String(d.regency_id), name: String(d.name).toUpperCase() }));
        }
      }
    } catch (e) {
      // try next URL
    }
  }

  console.error('Failed to fetch districts for regency', regencyId);
  return [];
}
