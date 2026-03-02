// Date utility functions

export const WEEKDAYS_JP = ['日', '月', '火', '水', '木', '金', '土'];

// 定休曜日: 0=日曜, 3=水曜
export const REGULAR_HOLIDAY_DAYS = [0, 3];

export const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const parseDate = (dateStr) => new Date(dateStr + 'T00:00:00');

export const getMonthDays = (year, month) => {
  const days = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Fill leading empty days
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
};

export const isToday = (date) => {
  const today = new Date();
  return formatDate(date) === formatDate(today);
};

export const isPast = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const isSameMonth = (date, year, month) => {
  return date.getFullYear() === year && date.getMonth() === month;
};

export const getCurrentMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
};

// Get shifts for a specific date based on weekday
export const getShiftsForDate = (date, shifts) => {
  const dayOfWeek = date.getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return [];
  return shifts.filter(s => s.dayOfWeek === dayOfWeek);
};

// Pay period: 26th of previous month to 25th of current month
export const getPayPeriod = (year, month) => {
  const start = new Date(year, month - 1, 26);
  const end = new Date(year, month, 25);
  return { start, end };
};

export const formatMonthYear = (year, month) => {
  return `${year}年${month + 1}月`;
};
