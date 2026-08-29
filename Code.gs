/**
 * BIKINPOLYGON - GOOGLE APPS SCRIPT WEBHOOK (DI BALIK LAYAR)
 * Simpan file ini sebagai Code.gs atau Index.gs di Google Apps Script
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-setup header jika spreadsheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'TIMESTAMP', 'PEMRAKARSA', 'KEGIATAN', 'NO_TELEPON', 
        'MODE_AMDALNET', 'TAHUN', 'PROVINSI', 'KOTA', 
        'KECAMATAN', 'ALAMAT', 'KETERANGAN', 'EXPORT_TYPE'
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#0F172A').setFontColor('#ADFA1D');
      sheet.setFrozenRows(1);
    }

    // Parse data dari Web App
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Simpan baris data ke Google Sheet
    sheet.appendRow([
      new Date(),
      data.PEMRAKARSA || '',
      data.KEGIATAN || '',
      data.NO_TELEPON || '',
      data.isAmdalMode ? 'YA (AMDALNET)' : 'TIDAK (BIASA)',
      data.TAHUN || '',
      data.PROVINSI || '',
      data.KOTA || '',
      data.KECAMATAN || '',
      data.ALAMAT || '',
      data.KETERANGAN || '',
      data.exportType || 'DOWNLOAD'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'online' }))
    .setMimeType(ContentService.MimeType.JSON);
}
