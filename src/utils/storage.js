// localStorage utility functions

const KEYS = {
  RESERVATIONS: 'restaurant_reservations',
  SHIFTS: 'restaurant_shifts',
  BUSINESS_DAYS: 'restaurant_business_days',
  STAFF: 'restaurant_staff',
  SETTINGS: 'restaurant_settings',
  DAILY_HOURS: 'restaurant_daily_hours',
};

export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  },
};

// Reservations
export const getReservations = () => storage.get(KEYS.RESERVATIONS) || [];
export const saveReservations = (reservations) => storage.set(KEYS.RESERVATIONS, reservations);
export const addReservation = (reservation) => {
  const reservations = getReservations();
  const newReservation = { ...reservation, id: Date.now().toString() };
  saveReservations([...reservations, newReservation]);
  return newReservation;
};
export const updateReservation = (id, updated) => {
  const reservations = getReservations();
  saveReservations(reservations.map(r => r.id === id ? { ...r, ...updated } : r));
};
export const deleteReservation = (id) => {
  const reservations = getReservations();
  saveReservations(reservations.filter(r => r.id !== id));
};

// Shifts
export const getShifts = () => storage.get(KEYS.SHIFTS) || [];
export const saveShifts = (shifts) => storage.set(KEYS.SHIFTS, shifts);
export const addShift = (shift) => {
  const shifts = getShifts();
  const newShift = { ...shift, id: Date.now().toString() };
  saveShifts([...shifts, newShift]);
  return newShift;
};
export const updateShift = (id, updated) => {
  const shifts = getShifts();
  saveShifts(shifts.map(s => s.id === id ? { ...s, ...updated } : s));
};
export const deleteShift = (id) => {
  const shifts = getShifts();
  saveShifts(shifts.filter(s => s.id !== id));
};

// Business days (open/closed per date)
export const getBusinessDays = () => storage.get(KEYS.BUSINESS_DAYS) || {};
export const setBusinessDay = (dateStr, isOpen) => {
  const days = getBusinessDays();
  days[dateStr] = isOpen;
  storage.set(KEYS.BUSINESS_DAYS, days);
};

// Staff
export const getStaff = () => storage.get(KEYS.STAFF) || [];
export const saveStaff = (staff) => storage.set(KEYS.STAFF, staff);
export const addStaff = (member) => {
  const staff = getStaff();
  const newMember = { ...member, id: Date.now().toString() };
  saveStaff([...staff, newMember]);
  return newMember;
};
export const updateStaff = (id, updated) => {
  const staff = getStaff();
  saveStaff(staff.map(s => s.id === id ? { ...s, ...updated } : s));
};
export const deleteStaff = (id) => {
  const staff = getStaff();
  saveStaff(staff.filter(s => s.id !== id));

  // 今日以降のカレンダー記録からそのスタッフのエントリを削除
  const todayStr = new Date().toISOString().slice(0, 10);
  const all = getDailyHours();
  let changed = false;
  Object.keys(all).forEach(dateStr => {
    if (dateStr >= todayStr) {
      const filtered = all[dateStr].filter(e => e.staffId !== id);
      if (filtered.length !== all[dateStr].length) {
        changed = true;
        if (filtered.length === 0) {
          delete all[dateStr];
        } else {
          all[dateStr] = filtered;
        }
      }
    }
  });
  if (changed) storage.set(KEYS.DAILY_HOURS, all);
};

// Settings
export const getSettings = () => {
  const saved = storage.get(KEYS.SETTINGS) || {};
  return { gasUrl: '', settingsPassword: '', ...saved };
};
export const saveSettings = (settings) => storage.set(KEYS.SETTINGS, settings);

// Daily staff hours (array per date, supports multiple slots per person):
// { "2026-03-01": [{ id, staffId, name, startTime, endTime }] }
export const getDailyHours = () => storage.get(KEYS.DAILY_HOURS) || {};
export const setDayHours = (dateStr, entries) => {
  const all = getDailyHours();
  if (!entries || entries.length === 0) {
    delete all[dateStr];
  } else {
    all[dateStr] = entries;
  }
  storage.set(KEYS.DAILY_HOURS, all);
};
