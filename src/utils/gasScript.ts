export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT UNTUK SYNC QR-PRESENSI SINKRONISASI REALTIME & HAPUS OTOMATIS
 * 
 * Fitur:
 * - Sync Presensi (Insert / Overwrite): Jika ID Presensi sudah ada, data ditimpa.
 * - Hapus Presensi (Delete): Jika action == "delete", baris presensi dengan ID tersebut dihapus.
 * - Hapus Siswa (Delete Student): Jika action == "deleteStudent", seluruh baris presensi siswa dengan NISN tersebut dihapus.
 * 
 * Petunjuk Pemasangan:
 * 1. Buka Google Sheets Anda
 * 2. Klik Ekstensi > Apps Script
 * 3. Hapus semua kode bawaan dan tempelkan seluruh kode di bawah ini
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
    var action = data.action || "sync";
    
    // ACTION: Hapus 1 catatan presensi berdasarkan ID Presensi
    if (action === "delete") {
      var targetId = String(data.id || "").trim();
      var deletedCount = 0;
      if (targetId && sheet.getLastRow() > 1) {
        var idValues = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
        for (var i = idValues.length - 1; i >= 0; i--) {
          if (String(idValues[i][0]).trim() === targetId) {
            sheet.deleteRow(i + 2); // +2 karena header baris 1 & 0-based index
            deletedCount++;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "action": "delete", "deleted": deletedCount }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ACTION: Hapus seluruh presensi siswa berdasarkan NISN ketika siswa dihapus
    if (action === "deleteStudent") {
      var targetNisn = String(data.nisn || "").trim();
      var deletedStudentRows = 0;
      if (targetNisn && sheet.getLastRow() > 1) {
        var nisnValues = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
        for (var j = nisnValues.length - 1; j >= 0; j--) {
          var cellNisn = String(nisnValues[j][0]).replace(/^'/, '').trim();
          if (cellNisn === targetNisn) {
            sheet.deleteRow(j + 2);
            deletedStudentRows++;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "action": "deleteStudent", "deleted": deletedStudentRows }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ACTION DEFAULT: Insert or Overwrite Presensi
    var targetId = data.id || "";
    var lastRow = sheet.getLastRow();
    var rowIndexToUpdate = -1;
    
    // Cari apakah ID Presensi sudah ada di kolom 1
    if (targetId && lastRow > 1) {
      var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var k = 0; k < idValues.length; k++) {
        if (String(idValues[k][0]).trim() === String(targetId).trim()) {
          rowIndexToUpdate = k + 2; // +2 karena header di baris 1 dan index 0-based
          break;
        }
      }
    }
    
    var rowData = [
      data.id || "",
      "'" + (data.nisn || ""), // tanda petik agar NISN tidak terpotong nol depan
      data.studentName || "",
      data.class || "",
      data.date || "",
      data.time || "",
      data.status || "",
      data.method || "QR Code",
      data.note || ""
    ];
    
    if (rowIndexToUpdate > 0) {
      // TIMPA data pada baris yang sudah ada (TIDAK MEMBUAT BARIS BARU)
      sheet.getRange(rowIndexToUpdate, 1, 1, 9).setValues([rowData]);
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "action": "update", "message": "Data presensi berhasil diperbarui (baris ditimpa)" }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      // Tambah baris baru jika ID belum ada
      sheet.appendRow(rowData);
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "action": "insert", "message": "Data presensi baru berhasil tersimpan" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
    var records = [];
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (row[0] || row[1] || row[2]) {
        records.push({
          id: String(row[0] || "").trim(),
          nisn: String(row[1] || "").replace(/^'/, "").trim(),
          studentName: String(row[2] || "").trim(),
          class: String(row[3] || "").trim(),
          date: String(row[4] || "").trim(),
          time: String(row[5] || "").trim(),
          status: String(row[6] || "Hadir").trim(),
          method: String(row[7] || "QR Code").trim(),
          note: String(row[8] || "").trim()
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: records, count: records.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

