import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { ref, set, get, onValue } from 'firebase/database';

// localStorage keys for one-time migration
const LS = {
  RESERVATIONS: 'restaurant_reservations',
  SHIFTS:        'restaurant_shifts',
  BUSINESS_DAYS: 'restaurant_business_days',
  STAFF:         'restaurant_staff',
  SETTINGS:      'restaurant_settings',
  DAILY_HOURS:   'restaurant_daily_hours',
};
const lsGet = (key, def) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
};

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [loading, setLoading]         = useState(true);
  const [reservations, setReservations] = useState([]);
  const [staff, setStaff]             = useState([]);
  const [shifts, setShifts]           = useState([]);
  const [businessDays, setBusinessDays] = useState({});
  const [dailyHours, setDailyHours]   = useState({});
  const [settings, setSettings]       = useState({ gasUrl: '', settingsPassword: '' });

  useEffect(() => {
    let cleanup = () => {};

    const init = async () => {
      // 既存のlocalStorageデータをFirebaseに一度だけ移行
      const snap = await get(ref(db, '/'));
      if (!snap.exists()) {
        const migrated = {
          reservations: lsGet(LS.RESERVATIONS, []),
          staff:         lsGet(LS.STAFF, []),
          shifts:        lsGet(LS.SHIFTS, []),
          businessDays:  lsGet(LS.BUSINESS_DAYS, {}),
          dailyHours:    lsGet(LS.DAILY_HOURS, {}),
          settings:      lsGet(LS.SETTINGS, {}),
        };
        await set(ref(db, '/'), migrated);
      }

      // リアルタイムリスナー設定
      let ready = 0;
      const onReady = () => { if (++ready >= 6) setLoading(false); };

      const u1 = onValue(ref(db, 'reservations'), s => { setReservations(s.val() || []); onReady(); });
      const u2 = onValue(ref(db, 'staff'),        s => { setStaff(s.val() || []);        onReady(); });
      const u3 = onValue(ref(db, 'shifts'),       s => { setShifts(s.val() || []);       onReady(); });
      const u4 = onValue(ref(db, 'businessDays'), s => { setBusinessDays(s.val() || {}); onReady(); });
      const u5 = onValue(ref(db, 'dailyHours'),   s => { setDailyHours(s.val() || {});   onReady(); });
      const u6 = onValue(ref(db, 'settings'),     s => {
        setSettings({ gasUrl: '', settingsPassword: '', ...(s.val() || {}) });
        onReady();
      });

      cleanup = () => { u1(); u2(); u3(); u4(); u5(); u6(); };
    };

    init();
    return () => cleanup();
  }, []);

  // --- Reservations ---
  const addReservation = useCallback((r) => {
    const newR = { ...r, id: Date.now().toString() };
    set(ref(db, 'reservations'), [...reservations, newR]);
    return newR;
  }, [reservations]);

  const updateReservation = useCallback((id, updated) => {
    set(ref(db, 'reservations'), reservations.map(r => r.id === id ? { ...r, ...updated } : r));
  }, [reservations]);

  const deleteReservation = useCallback((id) => {
    set(ref(db, 'reservations'), reservations.filter(r => r.id !== id));
  }, [reservations]);

  // --- Staff ---
  const addStaff = useCallback((member) => {
    const newMember = { ...member, id: Date.now().toString() };
    set(ref(db, 'staff'), [...staff, newMember]);
    return newMember;
  }, [staff]);

  const updateStaff = useCallback((id, updated) => {
    set(ref(db, 'staff'), staff.map(s => s.id === id ? { ...s, ...updated } : s));
  }, [staff]);

  const deleteStaff = useCallback((id) => {
    set(ref(db, 'staff'), staff.filter(s => s.id !== id));
    // 今日以降のカレンダー記録からも削除
    const todayStr = new Date().toISOString().slice(0, 10);
    const updated = { ...dailyHours };
    let changed = false;
    Object.keys(updated).forEach(dateStr => {
      if (dateStr >= todayStr) {
        const filtered = updated[dateStr].filter(e => e.staffId !== id);
        if (filtered.length !== updated[dateStr].length) {
          changed = true;
          if (filtered.length === 0) delete updated[dateStr];
          else updated[dateStr] = filtered;
        }
      }
    });
    if (changed) set(ref(db, 'dailyHours'), updated);
  }, [staff, dailyHours]);

  // --- Shifts ---
  const addShift = useCallback((shift) => {
    const newShift = { ...shift, id: Date.now().toString() };
    set(ref(db, 'shifts'), [...shifts, newShift]);
    return newShift;
  }, [shifts]);

  const updateShift = useCallback((id, updated) => {
    set(ref(db, 'shifts'), shifts.map(s => s.id === id ? { ...s, ...updated } : s));
  }, [shifts]);

  const deleteShift = useCallback((id) => {
    set(ref(db, 'shifts'), shifts.filter(s => s.id !== id));
  }, [shifts]);

  // --- Business days ---
  const toggleBusinessDay = useCallback((dateStr) => {
    const cur = businessDays[dateStr];
    const newVal = cur === undefined ? false : !cur;
    set(ref(db, `businessDays/${dateStr}`), newVal);
  }, [businessDays]);

  // --- Daily hours ---
  const saveDayHours = useCallback((dateStr, entries) => {
    if (!entries || entries.length === 0) {
      const updated = { ...dailyHours };
      delete updated[dateStr];
      set(ref(db, 'dailyHours'), updated);
    } else {
      set(ref(db, `dailyHours/${dateStr}`), entries);
    }
  }, [dailyHours]);

  // --- Settings ---
  const saveSettings = useCallback((s) => {
    set(ref(db, 'settings'), s);
  }, []);

  return (
    <DataContext.Provider value={{
      loading,
      reservations, addReservation, updateReservation, deleteReservation,
      staff, addStaff, updateStaff, deleteStaff,
      shifts, addShift, updateShift, deleteShift,
      businessDays, toggleBusinessDay,
      dailyHours, saveDayHours,
      settings, saveSettings,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
