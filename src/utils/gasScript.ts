export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT QR-PRESENSI (SINKRONISASI MASTER SISWA, PRESENSI & PENGATURAN LOGO REALTIME)
 * 
 * Fitur Utama:
 * 1. Sheet "Presensi": Otomatis mencatat, memperbarui, dan menghapus riwayat presensi tanpa data ganda.
 * 2. Sheet "Data Siswa": Otomatis menyimpan, memperbarui, dan menghapus master data siswa.
 * 3. Sheet "Pengaturan": Otomatis menyimpan profil sekolah, nama guru, NIP, serta Logo.
 * 4. Sinkronisasi 2 Arah: Menghapus/mengedit di aplikasi akan memperbarui spreadsheet, dan sebaliknya!
 * 
 * PETUNJUK PEMBARUAN SANGAT PENTING:
 * 1. Buka Google Sheets Anda.
 * 2. Klik menu Ekstensi > Apps Script.
 * 3. Hapus semua kode lama dan tempel seluruh kode baru ini.
 * 4. Klik tombol simpan (ikon Disket).
 * 5. WAJIB: Klik "Terapkan" (Deploy) > "Kelola Penerapan" (Manage Deployments).
 * 6. Klik ikon PENSIL (Edit) pada penerapan aktif Anda.
 * 7. Pada bagian "Versi" (Version), pilih "VERSI BARU" (New Version).
 * 8. Klik tombol "Terapkan" (Deploy).
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var action = data.action || "sync";

    // --- ACTION: SYNC SETTINGS ---
    if (action === "syncSettings") {
      var settingsSheet = ss.getSheetByName("Pengaturan");
      if (!settingsSheet) {
        settingsSheet = ss.insertSheet("Pengaturan");
      }
      settingsSheet.clearContents();
      settingsSheet.appendRow(["Kunci", "Nilai"]);
      settingsSheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");

      var settingsObj = data.settings || {};
      var sRows = [];
      var CHUNK_SIZE = 35000;

      for (var key in settingsObj) {
        if (settingsObj.hasOwnProperty(key)) {
          var val = String(settingsObj[key] !== undefined && settingsObj[key] !== null ? settingsObj[key] : "");
          if (val.length > CHUNK_SIZE) {
            var totalChunks = Math.ceil(val.length / CHUNK_SIZE);
            for (var c = 0; c < totalChunks; c++) {
              var chunkVal = val.substring(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
              sRows.push([key + "__chunk_" + c, chunkVal]);
            }
          } else {
            sRows.push([key, val]);
          }
        }
      }

      if (sRows.length > 0) {
        settingsSheet.getRange(2, 1, sRows.length, 2).setValues(sRows);
      }
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "action": "syncSettings" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- ACTION: SYNC BULK STUDENTS ---
    if (action === "syncStudents") {
      var studentSheet = ss.getSheetByName("Data Siswa");
      if (!studentSheet) {
        studentSheet = ss.insertSheet("Data Siswa");
      }
      studentSheet.clearContents();
      studentSheet.appendRow(["ID Siswa", "NISN", "Nama Siswa", "Kelas", "Jenis Kelamin", "No Telepon / WA"]);
      studentSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");

      var studentList = data.students || [];
      if (studentList.length > 0) {
        var rows = studentList.map(function(s) {
          return [
            s.id || "",
            "'" + (s.nisn || ""),
            s.name || "",
            s.class || "",
            s.gender || "L",
            "'" + (s.phone || "")
          ];
        });
        studentSheet.getRange(2, 1, rows.length, 6).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "action": "syncStudents", "count": studentList.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- ACTION: DELETE STUDENT ---
    if (action === "deleteStudent") {
      var targetNisn = String(data.nisn || "").replace(/^'/, '').trim();
      
      var studentSheet = ss.getSheetByName("Data Siswa");
      if (studentSheet && studentSheet.getLastRow() > 1 && targetNisn) {
        var sValues = studentSheet.getRange(2, 2, studentSheet.getLastRow() - 1, 1).getValues();
        for (var i = sValues.length - 1; i >= 0; i--) {
          var cellNisn = String(sValues[i][0]).replace(/^'/, '').trim();
          if (cellNisn === targetNisn) {
            studentSheet.deleteRow(i + 2);
          }
        }
      }

      var presensiSheet = ss.getSheetByName("Presensi") || ss.getActiveSheet();
      if (presensiSheet && presensiSheet.getLastRow() > 1 && targetNisn) {
        var pValues = presensiSheet.getRange(2, 2, presensiSheet.getLastRow() - 1, 1).getValues();
        for (var j = pValues.length - 1; j >= 0; j--) {
          var pNisn = String(pValues[j][0]).replace(/^'/, '').trim();
          if (pNisn === targetNisn) {
            presensiSheet.deleteRow(j + 2);
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "action": "deleteStudent" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- ACTION: DELETE PRESENSI ---
    var presensiSheet = ss.getSheetByName("Presensi");
    if (!presensiSheet) {
      presensiSheet = ss.getSheets()[0];
      presensiSheet.setName("Presensi");
    }

    if (action === "delete") {
      var targetId = String(data.id || "").trim();
      var cleanTargetNisn = String(data.nisn || "").replace(/^'/, '').trim();
      var targetDate = formatDateString(data.date);

      if (presensiSheet.getLastRow() > 1) {
        var pValues = presensiSheet.getRange(2, 1, presensiSheet.getLastRow() - 1, 5).getValues();
        for (var k = pValues.length - 1; k >= 0; k--) {
          var rId = String(pValues[k][0]).trim();
          var rNisn = String(pValues[k][1]).replace(/^'/, '').trim();
          var rDate = formatDateString(pValues[k][4]);

          if ((targetId && rId === targetId) || (cleanTargetNisn && targetDate && rNisn === cleanTargetNisn && rDate === targetDate)) {
            presensiSheet.deleteRow(k + 2);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "action": "delete" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- ACTION DEFAULT / RECORD: INSERT OR OVERWRITE PRESENSI ---
    if (presensiSheet.getLastRow() === 0) {
      presensiSheet.appendRow(["ID Presensi", "NISN", "Nama Siswa", "Kelas", "Tanggal", "Jam Scan", "Status", "Metode", "Catatan"]);
      presensiSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
    }

    var cleanTargetNisn = String(data.nisn || "").replace(/^'/, '').trim();
    var targetDate = formatDateString(data.date);

    // Format ID Presensi murni: NISN-Tanggal (Contoh: 20261001-2026-08-10)
    var recordId = (cleanTargetNisn && targetDate) 
      ? (cleanTargetNisn + "-" + targetDate) 
      : String(data.id || "").replace(/^id-|^att-/, '').trim();

    var lastRow = presensiSheet.getLastRow();
    var matchingRowIndices = [];

    if (lastRow > 1) {
      var pValues = presensiSheet.getRange(2, 1, lastRow - 1, 5).getValues();
      for (var m = 0; m < pValues.length; m++) {
        var rowId = String(pValues[m][0]).trim();
        var rowNisn = String(pValues[m][1]).replace(/^'/, '').trim();
        var rowDate = formatDateString(pValues[m][4]);

        var isMatch = false;
        // Cocokkan berdasarkan NISN + Tanggal ATAU ID Presensi
        if (cleanTargetNisn && targetDate && rowNisn === cleanTargetNisn && rowDate === targetDate) {
          isMatch = true;
        } else if (recordId && (rowId === recordId || rowId === ("id-" + recordId) || rowId === ("att-" + recordId))) {
          isMatch = true;
        } else if (data.id && (rowId === String(data.id).trim() || rowId === ("id-" + String(data.id).trim()))) {
          isMatch = true;
        }

        if (isMatch) {
          matchingRowIndices.push(m + 2);
        }
      }
    }

    var rowData = [
      recordId,
      "'" + (data.nisn || ""),
      data.studentName || "",
      data.class || "",
      "'" + (data.date || ""),
      data.time || "",
      data.status || "Hadir",
      data.method || "QR Code",
      data.note || ""
    ];

    if (matchingRowIndices.length > 0) {
      // Overwrite baris pertama yang cocok dengan data scan terbaru
      var firstRow = matchingRowIndices[0];
      presensiSheet.getRange(firstRow, 1, 1, 9).setValues([rowData]);

      // Hapus baris duplikat jika ada dari bawah ke atas
      for (var d = matchingRowIndices.length - 1; d > 0; d--) {
        presensiSheet.deleteRow(matchingRowIndices[d]);
      }
    } else {
      // Tambah baris baru jika siswa belum presensi pada tanggal tersebut
      presensiSheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "action": "record" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function formatDateString(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ("0" + (val.getMonth() + 1)).slice(-2);
    var d = ("0" + val.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }
  var str = String(val).replace(/^'/, '').trim();
  if (str.indexOf("T") !== -1) {
    str = str.split("T")[0];
  }
  var parts = str.split(/[\\/\\-\\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      var y2 = parts[0];
      var m2 = ("0" + parts[1]).slice(-2);
      var d2 = ("0" + parts[2]).slice(-2);
      return y2 + "-" + m2 + "-" + d2;
    } else if (parts[2].length === 4) {
      var y3 = parts[2];
      var m3 = ("0" + parts[1]).slice(-2);
      var d3 = ("0" + parts[0]).slice(-2);
      return y3 + "-" + m3 + "-" + d3;
    }
  }
  return str;
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Ambil Data Presensi
    var presensiSheet = ss.getSheetByName("Presensi") || ss.getSheets()[0];
    var attendanceRecords = [];
    if (presensiSheet && presensiSheet.getLastRow() > 1) {
      var pValues = presensiSheet.getRange(2, 1, presensiSheet.getLastRow() - 1, 9).getValues();
      for (var i = 0; i < pValues.length; i++) {
        var pRow = pValues[i];
        if (pRow[0] || pRow[1] || pRow[2]) {
          var rowNisn = String(pRow[1] || "").replace(/^'/, "").trim();
          var rowDate = formatDateString(pRow[4]);
          var rowId = (rowNisn && rowDate) ? (rowNisn + "-" + rowDate) : String(pRow[0] || "").trim();

          attendanceRecords.push({
            id: rowId,
            nisn: rowNisn,
            studentName: String(pRow[2] || "").trim(),
            class: String(pRow[3] || "").trim(),
            date: rowDate,
            time: String(pRow[5] || "").trim(),
            status: String(pRow[6] || "Hadir").trim(),
            method: String(pRow[7] || "QR Code").trim(),
            note: String(pRow[8] || "").trim()
          });
        }
      }
    }

    // 2. Ambil Data Master Siswa
    var studentSheet = ss.getSheetByName("Data Siswa");
    var studentRecords = [];
    if (studentSheet && studentSheet.getLastRow() > 1) {
      var sValues = studentSheet.getRange(2, 1, studentSheet.getLastRow() - 1, 6).getValues();
      for (var j = 0; j < sValues.length; j++) {
        var sRow = sValues[j];
        if (sRow[0] || sRow[1] || sRow[2]) {
          studentRecords.push({
            id: String(sRow[0] || ("std-" + (j + 1))).trim(),
            nisn: String(sRow[1] || "").replace(/^'/, "").trim(),
            name: String(sRow[2] || "").trim(),
            class: String(sRow[3] || "").trim(),
            gender: (String(sRow[4] || "L").toUpperCase().startsWith("P") ? "P" : "L"),
            phone: String(sRow[5] || "").replace(/^'/, "").trim()
          });
        }
      }
    }

    // 3. Ambil Data Pengaturan & Logo
    var settingsSheet = ss.getSheetByName("Pengaturan");
    var settingsRecord = {};
    if (settingsSheet && settingsSheet.getLastRow() > 1) {
      var setValues = settingsSheet.getRange(2, 1, settingsSheet.getLastRow() - 1, 2).getValues();
      var chunkMap = {};

      for (var k = 0; k < setValues.length; k++) {
        var setKey = String(setValues[k][0] || "").trim();
        var setVal = String(setValues[k][1] || "").trim();
        if (setKey) {
          if (setKey.indexOf("__chunk_") !== -1) {
            var parts = setKey.split("__chunk_");
            var mainKey = parts[0];
            var cIdx = parseInt(parts[1], 10);
            if (!chunkMap[mainKey]) chunkMap[mainKey] = [];
            chunkMap[mainKey][cIdx] = setVal;
          } else {
            if (setVal === "true") setVal = true;
            else if (setVal === "false") setVal = false;
            settingsRecord[setKey] = setVal;
          }
        }
      }

      for (var cKey in chunkMap) {
        if (chunkMap.hasOwnProperty(cKey)) {
          settingsRecord[cKey] = chunkMap[cKey].join("");
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: attendanceRecords,
      students: studentRecords,
      settings: settingsRecord,
      countAttendance: attendanceRecords.length,
      countStudents: studentRecords.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
