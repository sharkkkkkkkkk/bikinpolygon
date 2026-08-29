import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import domtoimage from 'dom-to-image-more';
import { saveAs } from 'file-saver';
import { calculateAreas } from './mapper';

/**
 * Capture map element as PNG bytes using dom-to-image-more.
 */
const captureMapImage = async (mapElementId) => {
  const mapElement = document.querySelector('.leaflet-container') || (mapElementId ? document.getElementById(mapElementId) : null);
  if (!mapElement) return { bytes: null, dims: { width: 0, height: 0 } };

  const controls = mapElement.querySelector('.leaflet-control-container');
  const prevDisplay = controls ? controls.style.display : '';
  if (controls) controls.style.display = 'none';

  await new Promise(res => setTimeout(res, 100));

  try {
    const imgData = await domtoimage.toPng(mapElement, {
      width: mapElement.clientWidth,
      height: mapElement.clientHeight,
      cacheBust: true,
      imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    });

    const base64Data = imgData.replace(/^data:image\/png;base64,/, "");
    const binaryStr = window.atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return { bytes, dims: { width: mapElement.clientWidth, height: mapElement.clientHeight } };
  } catch (err) {
    console.warn("Gagal mengambil tangkapan layar peta:", err);
    return { bytes: null, dims: { width: 0, height: 0 } };
  } finally {
    if (controls) controls.style.display = prevDisplay;
  }
};

/**
 * Embed map image in PDF page and return the Y position below the image.
 */
const embedMapImage = async (pdfDoc, page, mapImageBytes, mapImageDims) => {
  const { width, height } = page.getSize();
  let imageBottomY = height - 100;

  if (mapImageBytes && mapImageDims.width > 0) {
    const pngImage = await pdfDoc.embedPng(mapImageBytes);
    let imgWidth = 495;
    let imgHeight = (mapImageDims.height / mapImageDims.width) * imgWidth;
    
    if (imgHeight > 450) {
       imgHeight = 450;
       imgWidth = (mapImageDims.width / mapImageDims.height) * imgHeight;
    }
    
    const imgX = (width - imgWidth) / 2;
    imageBottomY = height - 100 - imgHeight;
    
    page.drawImage(pngImage, {
      x: imgX,
      y: imageBottomY,
      width: imgWidth,
      height: imgHeight,
    });
  }

  return imageBottomY;
};

/**
 * Export AMDALNET-compliant PDF Report (Peta Tapak Proyek AMDALNET).
 * Contains all 8 KLHK metadata fields.
 */
export const exportAmdalnetPDF = async (polygonGeoJSON, formData, mapElementId = 'map-container') => {
  if (!polygonGeoJSON) {
    throw new Error("Silakan gambar tapak proyek terlebih dahulu.");
  }
  if (polygonGeoJSON.type === 'FeatureCollection' && (!polygonGeoJSON.features || polygonGeoJSON.features.length === 0)) {
    throw new Error("Silakan gambar tapak proyek terlebih dahulu.");
  }

  const { sqMeters, hectares, sqKm } = calculateAreas(polygonGeoJSON);
  const { bytes: mapImageBytes, dims: mapImageDims } = await captureMapImage(mapElementId);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  
  // Title
  page.drawText('PETA TAPAK PROYEK AMDALNET', {
    x: 50,
    y: height - 50,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Subtitle
  page.drawText('Laporan Kompatibel Standar Kementerian LHK (KLHK)', {
    x: 50,
    y: height - 68,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const imageBottomY = await embedMapImage(pdfDoc, page, mapImageBytes, mapImageDims);

  // North Arrow
  if (mapImageBytes) {
    page.drawText('N (Utara)', {
      x: width - 115,
      y: imageBottomY - 20,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
  }

  // Dynamic Table
  const startY = imageBottomY - 40;
  const lineHeight = 18;

  const alamatLengkap = [
    formData.ALAMAT,
    formData.KECAMATAN ? `Kec. ${formData.KECAMATAN}` : '',
    formData.KOTA,
    formData.PROVINSI ? `Prov. ${formData.PROVINSI}` : ''
  ].filter(Boolean).join(', ');

  const details = [
    { label: 'Pemrakarsa', value: formData.PEMRAKARSA || formData.ALAMAT || 'PT Pemrakarsa Proyek' },
    { label: 'Kegiatan', value: formData.KEGIATAN || 'Pembangunan Tapak Proyek AMDALNET' },
    { label: 'Tahun', value: formData.TAHUN ? formData.TAHUN.toString() : '-' },
    { label: 'Provinsi', value: formData.PROVINSI || '-' },
    { label: 'Kota/Kabupaten', value: formData.KOTA || '-' },
    { label: 'Kecamatan', value: formData.KECAMATAN || '-' },
    { label: 'Alamat Lengkap', value: alamatLengkap || '-' },
    { label: 'Luas Polygon', value: `${sqMeters.toFixed(2)} m2 / ${hectares.toFixed(4)} Ha / ${sqKm.toFixed(6)} Km2` },
    { label: 'Keterangan', value: formData.KETERANGAN || '-' },
    { label: 'Tanggal Cetak', value: new Date().toLocaleDateString('id-ID') },
  ];

  details.forEach((item, index) => {
    page.drawText(`${item.label}:`, {
      x: 50,
      y: startY - (index * lineHeight),
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(String(item.value).substring(0, 75), {
      x: 160,
      y: startY - (index * lineHeight),
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, 'Tapak_proyek.pdf');
};

/**
 * Export BASIC Polygon PDF Report (Laporan Polygon Lahan).
 * Contains only Pemohon + Kegiatan + Area — no AMDALNET-specific fields.
 */
export const exportBasicPDF = async (polygonGeoJSON, formData, mapElementId = 'map-container') => {
  if (!polygonGeoJSON) {
    throw new Error("Silakan gambar polygon terlebih dahulu.");
  }
  if (polygonGeoJSON.type === 'FeatureCollection' && (!polygonGeoJSON.features || polygonGeoJSON.features.length === 0)) {
    throw new Error("Silakan gambar polygon terlebih dahulu.");
  }

  const { sqMeters, hectares, sqKm } = calculateAreas(polygonGeoJSON);
  const { bytes: mapImageBytes, dims: mapImageDims } = await captureMapImage(mapElementId);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  
  // Title
  page.drawText('LAPORAN POLYGON LAHAN', {
    x: 50,
    y: height - 50,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Subtitle
  page.drawText('Generated by BikinPolygon - Polygon Maker & Land Scaler', {
    x: 50,
    y: height - 68,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const imageBottomY = await embedMapImage(pdfDoc, page, mapImageBytes, mapImageDims);

  // Dynamic Table
  const startY = imageBottomY - 40;
  const lineHeight = 18;

  const details = [
    { label: 'Pemohon', value: formData.PEMRAKARSA || 'PT Pemohon' },
    { label: 'Kegiatan', value: formData.KEGIATAN || 'Kegiatan Usaha' },
    { label: 'Luas (m2)', value: `${sqMeters.toFixed(2)} m2` },
    { label: 'Luas (Ha)', value: `${hectares.toFixed(4)} Ha` },
    { label: 'Luas (Km2)', value: `${sqKm.toFixed(6)} Km2` },
    { label: 'Tanggal Cetak', value: new Date().toLocaleDateString('id-ID') },
  ];

  details.forEach((item, index) => {
    page.drawText(`${item.label}:`, {
      x: 50,
      y: startY - (index * lineHeight),
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(String(item.value).substring(0, 75), {
      x: 160,
      y: startY - (index * lineHeight),
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, 'Polygon_Lahan.pdf');
};
