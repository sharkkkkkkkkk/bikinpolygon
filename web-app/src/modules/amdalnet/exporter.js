import shpWrite from '@mapbox/shp-write';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { AMDALNET_PRJ, AMDALNET_CPG, AMDALNET_LAYER_NAME } from './constants';
import { mapPolygonToAmdalnetFeature, mapPolygonToBasicFeature } from './mapper';

/**
 * Export AMDALNET-compliant Shapefile (.zip) with 8 DBF columns (KLHK standard).
 * Output: Tapak_proyek.zip containing Tapak_proyek.shp/.shx/.dbf/.prj/.cpg
 */
export const exportAmdalnetSHP = async (polygonGeoJSON, formData) => {
  if (!polygonGeoJSON) {
    throw new Error("Silakan gambar tapak proyek terlebih dahulu.");
  }
  if (polygonGeoJSON.type === 'FeatureCollection' && (!polygonGeoJSON.features || polygonGeoJSON.features.length === 0)) {
    throw new Error("Silakan gambar tapak proyek terlebih dahulu.");
  }

  const feature = mapPolygonToAmdalnetFeature(polygonGeoJSON, formData);

  const shpBuffer = await shpWrite.zip({
    type: 'FeatureCollection',
    features: [feature]
  }, {
    folder: AMDALNET_LAYER_NAME,
    types: {
      point: 'Tapak_proyek_point',
      polygon: AMDALNET_LAYER_NAME,
      line: 'Tapak_proyek_line'
    }
  });

  const isBase64 = typeof shpBuffer === 'string';
  const zip = await JSZip.loadAsync(shpBuffer, { base64: isBase64 });
  
  const folder = zip.folder(AMDALNET_LAYER_NAME);
  
  if (folder) {
    folder.file(`${AMDALNET_LAYER_NAME}.prj`, AMDALNET_PRJ);
    folder.file(`${AMDALNET_LAYER_NAME}.cpg`, AMDALNET_CPG);
  } else {
    zip.file(`${AMDALNET_LAYER_NAME}.prj`, AMDALNET_PRJ);
    zip.file(`${AMDALNET_LAYER_NAME}.cpg`, AMDALNET_CPG);
  }

  const finalZip = await zip.generateAsync({ type: 'blob' });
  saveAs(finalZip, `${AMDALNET_LAYER_NAME}.zip`);
};

/**
 * Export BASIC Polygon Shapefile (.zip) — simplified attributes (Pemohon + Kegiatan).
 * Output: Polygon_Lahan.zip containing Polygon_Lahan.shp/.shx/.dbf/.prj/.cpg
 */
export const exportBasicSHP = async (polygonGeoJSON, formData) => {
  if (!polygonGeoJSON) {
    throw new Error("Silakan gambar polygon terlebih dahulu.");
  }
  if (polygonGeoJSON.type === 'FeatureCollection' && (!polygonGeoJSON.features || polygonGeoJSON.features.length === 0)) {
    throw new Error("Silakan gambar polygon terlebih dahulu.");
  }

  const BASIC_LAYER = 'Polygon_Lahan';
  const feature = mapPolygonToBasicFeature(polygonGeoJSON, formData);

  const shpBuffer = await shpWrite.zip({
    type: 'FeatureCollection',
    features: [feature]
  }, {
    folder: BASIC_LAYER,
    types: {
      point: `${BASIC_LAYER}_point`,
      polygon: BASIC_LAYER,
      line: `${BASIC_LAYER}_line`
    }
  });

  const isBase64 = typeof shpBuffer === 'string';
  const zip = await JSZip.loadAsync(shpBuffer, { base64: isBase64 });
  
  // Use standard WGS84 PRJ for basic polygon
  const WGS84_PRJ = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';

  const folder = zip.folder(BASIC_LAYER);
  if (folder) {
    folder.file(`${BASIC_LAYER}.prj`, WGS84_PRJ);
    folder.file(`${BASIC_LAYER}.cpg`, 'UTF-8');
  } else {
    zip.file(`${BASIC_LAYER}.prj`, WGS84_PRJ);
    zip.file(`${BASIC_LAYER}.cpg`, 'UTF-8');
  }

  const finalZip = await zip.generateAsync({ type: 'blob' });
  saveAs(finalZip, `${BASIC_LAYER}.zip`);
};
