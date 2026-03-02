// Google Apps Script - すぎやシフト・予約アプリ バックアップスクリプト
// このファイルをGoogle Apps ScriptでWebアプリとしてデプロイしてください

const SPREADSHEET_ID = ''; // ← あなたのスプレッドシートIDを入力
const SHEET_RESERVATIONS = '予約データ';
const SHEET_SALARY = '給料データ';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { type, data: payload, timestamp } = data;

    if (type === 'reservations') {
      saveReservations(payload, timestamp);
    } else if (type === 'salary') {
      saveSalary(payload, timestamp);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function saveReservations(reservations, timestamp) {
  const sheet = getOrCreateSheet(SHEET_RESERVATIONS);
  sheet.clearContents();

  // Header
  sheet.appendRow(['ID', '日付', '名前', '人数', '時間', '電話番号', '備考', '記録日時']);

  // Data rows
  reservations.forEach(r => {
    sheet.appendRow([r.id, r.date, r.name, r.people, r.time, r.phone || '', r.note || '', timestamp]);
  });
}

function saveSalary(salaryData, timestamp) {
  const sheet = getOrCreateSheet(SHEET_SALARY);

  // Find next empty row
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.appendRow(['記録日時', 'スタッフ名', '時給', '勤務時間(h)', '給料']);
  }

  // Add separator row
  sheet.appendRow(['--- ' + timestamp + ' ---', '', '', '', '']);

  // Data rows
  salaryData.forEach(s => {
    sheet.appendRow([timestamp, s.name, s.hourlyWage, s.hours, s.salary]);
  });
}

function doGet(e) {
  return ContentService
    .createTextOutput('すぎやシフト・予約アプリ バックアップAPI')
    .setMimeType(ContentService.MimeType.TEXT);
}
