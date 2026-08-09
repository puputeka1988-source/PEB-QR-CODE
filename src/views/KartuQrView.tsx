import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import QRCode from 'qrcode';
import { Printer, Search, Filter, Download, GraduationCap, Sparkles, User, RefreshCw } from 'lucide-react';

export const KartuQrView: React.FC = () => {
  const { students, settings, selectedStudentForCard, setSelectedStudentForCard } = useApp();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('SEMUA');
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});

  const classes = ['SEMUA', ...Array.from(new Set(students.map(s => s.class))).sort()];

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search);
    const matchClass = selectedClass === 'SEMUA' || s.class === selectedClass;
    return matchSearch && matchClass;
  });

  // Generate QR code data URLs for students
  useEffect(() => {
    const generateAllQrs = async () => {
      const mapping: Record<string, string> = {};
      for (const s of filteredStudents) {
        try {
          // Encode NISN as QR content
          const url = await QRCode.toDataURL(s.nisn, {
            width: 200,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          mapping[s.id] = url;
        } catch (err) {
          console.error('Failed to generate QR for', s.name, err);
        }
      }
      setQrUrls(mapping);
    };

    generateAllQrs();
  }, [students, search, selectedClass]);

  const handlePrint = () => {
    if (filteredStudents.length === 0) return;

    const schoolName = settings.sekolah || 'SEKOLAH DIGITAL';
    
    const cardsHtml = filteredStudents.map(s => `
      <div style="border: 2px solid #0f172a; border-radius: 12px; padding: 12px; width: 240px; height: 140px; background: #ffffff; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; margin: 8px;">
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 9px; font-weight: bold; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">KARTU PRESENSI</span>
          <span style="font-size: 8px; font-weight: bold; background: #0f172a; color: #ffffff; padding: 1px 6px; border-radius: 4px;">${s.class}</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
          <div style="width: 130px;">
            <p style="font-size: 11px; font-weight: bold; margin: 0; color: #0f172a; line-height: 1.2;">${s.name}</p>
            <p style="font-size: 9px; font-family: monospace; color: #475569; margin: 2px 0 0 0;">NISN: ${s.nisn}</p>
            <p style="font-size: 8px; color: #64748b; margin: 2px 0 0 0;">${schoolName}</p>
          </div>
          <div style="width: 65px; height: 65px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px; background: white;">
            ${qrUrls[s.id] ? `<img src="${qrUrls[s.id]}" style="width:100%; height:100%; object-fit:contain;" />` : ''}
          </div>
        </div>
        <div style="border-top: 1px dashed #cbd5e1; pt: 4px; font-size: 7px; color: #94a3b8; text-align: center;">
          Pindai QR saat masuk/pulang sekolah
        </div>
      </div>
    `).join('');

    const printableHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Cetak Kartu QR Siswa - ${schoolName}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 10px; background: #fff; }
            .grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-start; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h3 style="margin: 0 0 10px 0; font-size: 14px; text-align: center; font-family: sans-serif;">
            KARTU PRESENSI QR CODE SISWA - ${schoolName} (${filteredStudents.length} Siswa)
          </h3>
          <div class="grid">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            };
          </script>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printableHtml);
      printWin.document.close();
      printWin.focus();
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(printableHtml);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 2000);
        }, 500);
      } else {
        window.print();
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Kartu Identitas QR Code Siswa
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cetak kartu pelajar resmi dengan QR Code NISN unik untuk pemindaian cepat
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Semua Kartu ({filteredStudents.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama siswa atau NISN..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            {classes.map(c => (
              <option key={c} value={c}>Kelas: {c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Printable Card Grid */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-500 text-xs">
          Tidak ada siswa ditemukan. Silakan sesuaikan pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
          {filteredStudents.map(s => (
            <div
              key={s.id}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/50 transition-all group print:border-black print:text-black print:bg-white print:shadow-none"
            >
              {/* Card Top Accent Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 print:border-gray-300">
                <div className="flex items-center gap-2 min-w-0">
                  {settings.logoUrl ? (
                    <div className="w-8 h-8 rounded-xl bg-white p-1 border border-slate-700 flex items-center justify-center shrink-0 print:border-gray-300">
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs print:bg-emerald-100 print:text-emerald-800 shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider print:text-black truncate">
                      {settings.sekolah}
                    </h4>
                    <p className="text-[10px] text-slate-400 print:text-gray-600 truncate">
                      {settings.mataPelajaran ? `Kartu Presensi: ${settings.mataPelajaran}` : 'Kartu Presensi Siswa'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 print:bg-gray-100 print:text-black shrink-0">
                  {s.class}
                </span>
              </div>

              {/* Student Details & QR Code */}
              <div className="my-4 flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 print:text-gray-500">Nama Siswa</p>
                    <p className="text-sm font-black text-white truncate print:text-black">{s.name}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 print:text-gray-500">NISN / ID</p>
                    <p className="text-xs font-mono font-bold text-emerald-400 tracking-wider print:text-black">
                      {s.nisn}
                    </p>
                  </div>

                  {s.gender && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 print:text-gray-500">Gender:</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border print:border-gray-400 ${
                        s.gender === 'P'
                          ? 'bg-pink-500/15 text-pink-400 border-pink-500/30 print:bg-pink-100 print:text-pink-800'
                          : 'bg-sky-500/15 text-sky-400 border-sky-500/30 print:bg-sky-100 print:text-sky-800'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${s.gender === 'P' ? 'bg-pink-400' : 'bg-sky-400'}`}></span>
                        {s.gender}
                      </span>
                    </div>
                  )}
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-2 rounded-2xl shadow-md shrink-0 border border-slate-200">
                  {qrUrls[s.id] ? (
                    <img
                      src={qrUrls[s.id]}
                      alt={`QR ${s.name}`}
                      className="w-24 h-24 object-contain"
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 print:border-gray-200 print:text-gray-600">
                <span>Tempelkan pada Pemindai Presensi</span>
                <span className="font-mono font-bold text-slate-400 print:text-black">OFFICIAL</span>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
