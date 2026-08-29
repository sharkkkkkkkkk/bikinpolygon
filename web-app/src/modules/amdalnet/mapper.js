import * as turf from '@turf/turf';
import { AMDALNET_LAYER_NAME } from './constants';

export const calculateAreas = (polygonGeoJSON) => {
  if (!polygonGeoJSON) {
    return { sqMeters: 0, hectares: 0, sqKm: 0 };
  }
  if (polygonGeoJSON.type === 'FeatureCollection' && (!polygonGeoJSON.features || polygonGeoJSON.features.length === 0)) {
    return { sqMeters: 0, hectares: 0, sqKm: 0 };
  }
  const areaSqMeters = turf.area(polygonGeoJSON);
  const hectares = areaSqMeters / 10000;
  const sqKm = areaSqMeters / 1000000;
  return { sqMeters: areaSqMeters, hectares, sqKm };
};

/**
 * Map polygon to AMDALNET-compliant GeoJSON Feature (8 DBF columns for KLHK).
 * Used when "Polygon untuk Peta Tapak Proyek AMDALNET" checkbox is checked.
 */
export const mapPolygonToAmdalnetFeature = (polygonGeoJSON, formData) => {
  const { sqMeters } = calculateAreas(polygonGeoJSON);
  
  let feature;
  if (polygonGeoJSON.type === 'FeatureCollection') {
    feature = polygonGeoJSON.features[0];
  } else {
    feature = polygonGeoJSON;
  }

  const geometry = JSON.parse(JSON.stringify(feature.geometry));

  const alamatLengkap = [
    formData.ALAMAT,
    formData.KECAMATAN ? `Kec. ${formData.KECAMATAN}` : '',
    formData.KOTA,
    formData.PROVINSI ? `Prov. ${formData.PROVINSI}` : ''
  ].filter(Boolean).join(', ');

  const pemrakarsa = (formData.PEMRAKARSA || formData.ALAMAT || "PT PEMRAKARSA PROYEK").substring(0, 100);
  const kegiatan = (formData.KEGIATAN || "PEMBANGUNAN TAPAK PROYEK AMDALNET").substring(0, 254);
  const keterangan = (formData.KETERANGAN || alamatLengkap).substring(0, 254);

  return {
    type: "Feature",
    geometry,
    properties: {
      OBJECTID_1: 1,
      PEMRAKARSA: pemrakarsa,
      KEGIATAN: kegiatan,
      TAHUN: parseInt(formData.TAHUN, 10) || new Date().getFullYear(),
      PROVINSI: (formData.PROVINSI || "").substring(0, 50),
      KETERANGAN: keterangan,
      LAYER: AMDALNET_LAYER_NAME,
      AREA: Number(sqMeters.toFixed(11))
    }
  };
};

/**
 * Map polygon to BASIC GeoJSON Feature (simplified, just Pemohon + Kegiatan).
 * Used when the AMDALNET checkbox is NOT checked (polygon biasa/OSS).
 */
export const mapPolygonToBasicFeature = (polygonGeoJSON, formData) => {
  const { sqMeters } = calculateAreas(polygonGeoJSON);
  
  let feature;
  if (polygonGeoJSON.type === 'FeatureCollection') {
    feature = polygonGeoJSON.features[0];
  } else {
    feature = polygonGeoJSON;
  }

  const geometry = JSON.parse(JSON.stringify(feature.geometry));

  const pemrakarsa = (formData.PEMRAKARSA || "PT PEMOHON").substring(0, 100);
  const kegiatan = (formData.KEGIATAN || "KEGIATAN USAHA").substring(0, 254);

  return {
    type: "Feature",
    geometry,
    properties: {
      PEMOHON: pemrakarsa,
      KEGIATAN: kegiatan,
      AREA_M2: Number(sqMeters.toFixed(2)),
      AREA_HA: Number((sqMeters / 10000).toFixed(4)),
      TANGGAL: new Date().toISOString().split('T')[0],
    }
  };
};
