// localStorage utility functions

const KEYS = {
  RESERVATIONS: 'restaurant_reservations',
  SHIFTS: 'restaurant_shifts',
  BUSINESS_DAYS: 'restaurant_business_days',
  STAFF: 'restaurant_staff',
  SETTINGS: 'restaurant_settings',
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
};

// Settings
export const getSettings = () => storage.get(KEYS.SETTINGS) || { gasUrl: '' };
export const saveSettings = (settings) => storage.set(KEYS.SETTINGS, settings);
