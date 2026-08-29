/**
 * GOOGLE APPS SCRIPT - BIKINPOLYGON REALTIME SPREADSHEET WEBHOOK (1-CLICK AUTO SETUP)
 * 
 * ==============================================================================
 * FITUR OTOMATIS:
 * 1. AUTO-SETUP HEADER & FORMAT: Tidak perlu ketik header manual. Script akan membuat
 *    12 kolom header + styling profesional (Dark Navy #0F172A & Neon Green #ADFA1D) otomatis!
 * 2. REALTIME BACKEND WEBHOOK: Langsung mencatat setiap submission data dari Form Web App.
 * 3. CUSTOM MENU GOOGLE SHEETS: Menyediakan menu "🚀 BikinPolygon -> ⚡ Auto Setup Header".
 * 
 * ==============================================================================
 * CARA SETUP HANYA 1X:
 * 1. Buka Google Sheets baru di Google Drive (https://sheets.google.com).
 * 2. Klik menu atas: Ekstensi -> Apps Script.
 * 3. Hapus semua kode default, lalu Paste SELURUH kode di bawah ini.
 * 4. Klik "Simpan" (Ctrl+S).
 * 5. Klik "Terapkan" (Deploy) -> "Pengaplikasian baru" (New deployment).
 *    - Tipe: Aplikasi Web (Web App)
 *    - Jalankan sebagai (Execute as): Saya (Me)
 *    - Yang memiliki akses (Who has access): Siapa saja (Anyone)  <-- WAJIB!
 * 6. Klik "Terapkan" & Salin URL Web App yang dihasilkan.
 * 7. Masukkan URL tersebut ke `.env`:
 *    VITE_GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
 *    GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
 * ==============================================================================
 */

// Kumpulan Header Kolom Standar
var HEADERS = [
  'TIMESTAMP',
  'PEMRAKARSA',
  'KEGIATAN',
  'NO_TELEPON',
  'MODE_AMDALNET',
  'TAHUN',
  'PROVINSI',
  'KOTA',
  'KECAMATAN',
  'ALAMAT',
  'KETERANGAN',
  'EXPORT_TYPE'
];

/**
 * FUNGSI OTOMATIS: Auto-Setup Spreadsheet (Membuat Header & Format Otomatis)
 */
function autoSetupSpreadsheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Jika baris pertama belum ada header, buatkan header & styling otomatis
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() === '') {
    sheet.clear();
    
    // Set Header Values
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setValues([HEADERS]);
    
    // Styling Header Premium
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#0F172A'); // Dark Navy slate
    headerRange.setFontColor('#ADFA1D');  // Neon Green accent
    headerRange.setFontSize(10);
    headerRange.setFontFamily('Roboto');
    headerRange.setAlignment('center', 'middle');
    sheet.setRowHeight(1, 38);
    
    // Freeze baris pertama agar header melayang saat scroll
    sheet.setFrozenRows(1);
    
    // Set Lebar Kolom Otomatis
    sheet.setColumnWidth(1, 160); // Timestamp
    sheet.setColumnWidth(2, 220); // Pemrakarsa
    sheet.setColumnWidth(3, 220); // Kegiatan
    sheet.setColumnWidth(4, 140); // No Telepon
    sheet.setColumnWidth(5, 140); // Mode Amdalnet
    sheet.setColumnWidth(6, 90);  // Tahun
    sheet.setColumnWidth(7, 160); // Provinsi
    sheet.setColumnWidth(8, 180); // Kota
    sheet.setColumnWidth(9, 160); // Kecamatan
    sheet.setColumnWidth(10, 250); // Alamat
    sheet.setColumnWidth(11, 250); // Keterangan
    sheet.setColumnWidth(12, 120); // Export Type
  }
}

/**
 * MENU kustom di Google Sheet saat dibuka
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 BikinPolygon')
    .addItem('⚡ Auto Setup Header & Format', 'autoSetupSpreadsheet')
    .addToUi();
}

/**
 * WEBHOOK REALTIME: Menerima POST request di balik layar
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Pastikan header & format spreadsheet sudah terpasang otomatis
    autoSetupSpreadsheet();

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var timestamp = new Date();
    var pemrakarsa = data.PEMRAKARSA || data.pemrakarsa || '';
    var kegiatan = data.KEGIATAN || data.kegiatan || '';
    var noTelepon = data.NO_TELEPON || data.no_telepon || data.whatsapp || '';
    var modeAmdal = data.isAmdalMode ? 'YA (AMDALNET)' : (data.mode_amdal || 'TIDAK (BIASA)');
    var tahun = data.TAHUN || data.tahun || '';
    var provinsi = data.PROVINSI || data.provinsi || '';
    var kota = data.KOTA || data.kota || '';
    var kecamatan = data.KECAMATAN || data.kecamatan || '';
    var alamat = data.ALAMAT || data.alamat || '';
    var keterangan = data.KETERANGAN || data.keterangan || '';
    var exportType = data.exportType || data.export_type || 'DOWNLOAD';

    // Append baris data baru ke paling bawah
    sheet.appendRow([
      timestamp,
      pemrakarsa,
      kegiatan,
      noTelepon,
      modeAmdal,
      tahun,
      provinsi,
      kota,
      kecamatan,
      alamat,
      keterangan,
      exportType
    ]);

    var lastRowIndex = sheet.getLastRow();
    var newRowRange = sheet.getRange(lastRowIndex, 1, 1, HEADERS.length);
    newRowRange.setFontFamily('Roboto');
    newRowRange.setFontSize(9);

    return ContentService
      .createTextOutput(JSON.stringify({
        "result": "success",
        "message": "Data realtime berhasil tersimpan di Google Sheet!",
        "row": lastRowIndex
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        "result": "error",
        "error": err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  autoSetupSpreadsheet();
  return ContentService
    .createTextOutput(JSON.stringify({
      "status": "online",
      "message": "Webhook BikinPolygon Realtime Active & Sheet Auto-Configured!"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
