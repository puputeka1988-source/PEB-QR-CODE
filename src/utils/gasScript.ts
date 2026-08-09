export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT UNTUK SYNC QR-PRESENSI SINKRONISASI REALTIME
 * 
 * Petunjuk Pemasangan:
 * 1. Buka Google Sheets Anda
 * 2. Klik Ekstensi > Apps Script
 * 3. Hapus kode bawaan dan tempelkan seluruh kode di bawah ini
 * 4. Klik "Terapkan" (Deploy) > "Penerapan Baru" (New Deployment)
 * 5. Pilih Jenis: "Aplikasi Web" (Web app)
 * 6. Akses (Who has access): "Siapa saja" (Anyone) -> SANGAT PENTING!
 * 7. Klik "Terapkan", salin Web App URL, lalu tempel di aplikasi QR-Presensi!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Buat Header jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["ID Presensi", "NISN", "Nama Siswa", "Kelas", "Tanggal", "Jam Scan", "Status", "Metode", "Catatan"]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
    }
    
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.id || "",
      "'" + (data.nisn || ""), // tanda petik agar NISN tidak terpotong nol depan
      data.studentName || "",
      data.class || "",
      data.date || "",
      data.time || "",
      data.status || "",
      data.method || "QR Code",
      data.note || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Data berhasil tersimpan" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Service QR-Presensi Google Sheets API aktif!");
}
`;
