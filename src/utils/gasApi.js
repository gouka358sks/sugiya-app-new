// Google Apps Script API integration

export const backupToGAS = async (gasUrl, type, data) => {
  if (!gasUrl) throw new Error('GAS URLが設定されていません');
  const response = await fetch(gasUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data, timestamp: new Date().toISOString() }),
  });
  return response;
};

export const backupReservations = (gasUrl, reservations) =>
  backupToGAS(gasUrl, 'reservations', reservations);

export const backupSalary = (gasUrl, salaryData) =>
  backupToGAS(gasUrl, 'salary', salaryData);
