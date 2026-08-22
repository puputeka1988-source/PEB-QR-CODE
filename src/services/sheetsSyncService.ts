import { Student, AttendanceRecord, AppSettings, TeachingScheduleItem, TeachingJournal } from '../types';

export interface SyncPayload {
  action: 'sync' | 'syncSettings' | 'syncStudents' | 'syncAttendance' | 'ping';
  students?: Student[];
  attendance?: AttendanceRecord[];
  settings?: AppSettings;
  schedules?: TeachingScheduleItem[];
  journals?: TeachingJournal[];
}

export interface SyncResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

/**
 * Service to handle Google Apps Script endpoint calls cleanly with timeout and error handling.
 */
export const sendGasPayload = async (
  gasUrl: string,
  payload: SyncPayload,
  timeoutMs: number = 20000
): Promise<SyncResponse> => {
  if (!gasUrl || !gasUrl.startsWith('https://script.google.com')) {
    return {
      status: 'error',
      message: 'URL Google Apps Script tidak valid atau belum diatur.'
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = { status: 'success', raw: text };
    }

    return {
      status: 'success',
      data: json
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return {
        status: 'error',
        message: 'Koneksi ke Google Sheets timeout (melebihi batas waktu).'
      };
    }
    return {
      status: 'error',
      message: error.message || 'Terjadi kesalahan saat sinkronisasi Google Sheets.'
    };
  }
};
