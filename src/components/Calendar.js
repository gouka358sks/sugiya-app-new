import React, { useState, useCallback } from 'react';
import {
  formatDate, getMonthDays, isToday, WEEKDAYS_JP,
  formatMonthYear, getCurrentMonth,
} from '../utils/dateUtils';
import {
  getReservations, addReservation, updateReservation,
  getBusinessDays, setBusinessDay, getShifts,
} from '../utils/storage';
import ReservationModal from './ReservationModal';

export default function Calendar() {
  const current = getCurrentMonth();
  const [year, setYear] = useState(current.year);
  const [month, setMonth] = useState(current.month);
  const [reservations, setReservations] = useState(getReservations);
  const [businessDays, setBusinessDays] = useState(getBusinessDays);
  const [shifts] = useState(getShifts);
  const [modal, setModal] = useState(null); // { type: 'view'|'add', date, reservation }

  const isCurrentMonth = year === current.year && month === current.month;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const days = getMonthDays(year, month);

  const getDateReservations = (date) => {
    const ds = formatDate(date);
    return reservations.filter(r => r.date === ds);
  };

  const getDateShifts = (date) => {
    const d = date < today ? [] : shifts.filter(s => s.dayOfWeek === date.getDay());
    return d;
  };

  const handleToggleBusiness = (date) => {
    const ds = formatDate(date);
    const current = businessDays[ds];
    const newVal = current === undefined ? false : !current; // default open -> close on first click
    setBusinessDay(ds, newVal);
    setBusinessDays(getBusinessDays());
  };

  const isOpen = (date) => {
    const ds = formatDate(date);
    return businessDays[ds] !== false; // default open
  };

  const handleSaveReservation = useCallback((form) => {
    if (modal?.reservation) {
      updateReservation(modal.reservation.id, form);
    } else {
      addReservation(form);
    }
    setReservations(getReservations());
    setModal(null);
  }, [modal]);

  const isEditable = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return isCurrentMonth && d >= today;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="nav-btn" onClick={prevMonth}>&#8249;</button>
        <h2>{formatMonthYear(year, month)}</h2>
        <button className="nav-btn" onClick={nextMonth}>&#8250;</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS_JP.map((wd, i) => (
          <div key={wd} className={`calendar-weekday ${i === 0 ? 'sunday' : i === 6 ? 'saturday' : ''}`}>
            {wd}
          </div>
        ))}

        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="calendar-cell empty" />;

          const ds = formatDate(date);
          const dayRes = getDateReservations(date);
          const dayShifts = getDateShifts(date);
          const open = isOpen(date);
          const today_ = isToday(date);
          const editable = isEditable(date);
          const dayOfWeek = date.getDay();

          return (
            <div
              key={ds}
              className={`calendar-cell ${today_ ? 'today' : ''} ${!open ? 'closed' : ''} ${dayOfWeek === 0 ? 'sunday' : dayOfWeek === 6 ? 'saturday' : ''}`}
            >
              <div className="cell-header">
                <span className="cell-date">{date.getDate()}</span>
                {editable && (
                  <button
                    className={`business-toggle ${open ? 'open' : 'closed'}`}
                    onClick={() => handleToggleBusiness(date)}
                    title={open ? '営業日' : '定休日'}
                  >
                    {open ? '営業' : '定休'}
                  </button>
                )}
                {!editable && (
                  <span className={`business-label ${open ? 'open' : 'closed'}`}>
                    {open ? '営業' : '定休'}
                  </span>
                )}
              </div>

              {/* Shifts */}
              {open && dayShifts.length > 0 && (
                <div className="cell-shifts">
                  {dayShifts.filter(s => s.period === '午前').length > 0 && (
                    <div className="shift-group">
                      <span className="shift-period">午前:</span>
                      {dayShifts.filter(s => s.period === '午前').map(s => (
                        <span key={s.id} className="shift-tag">{s.staffName}</span>
                      ))}
                    </div>
                  )}
                  {dayShifts.filter(s => s.period === '午後').length > 0 && (
                    <div className="shift-group">
                      <span className="shift-period">午後:</span>
                      {dayShifts.filter(s => s.period === '午後').map(s => (
                        <span key={s.id} className="shift-tag">{s.staffName}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reservations */}
              {open && dayRes.length > 0 && (
                <div className="cell-reservations">
                  {dayRes.map(r => (
                    <button
                      key={r.id}
                      className="reservation-chip"
                      onClick={() => setModal({ type: editable ? 'edit' : 'view', date: ds, reservation: r })}
                    >
                      {r.time} {r.name}({r.people}名)
                    </button>
                  ))}
                </div>
              )}

              {/* Add reservation button */}
              {editable && open && (
                <button
                  className="add-reservation-btn"
                  onClick={() => setModal({ type: 'add', date: ds, reservation: null })}
                >
                  ＋予約
                </button>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <ReservationModal
          reservation={modal.reservation}
          defaultDate={modal.date}
          readOnly={modal.type === 'view'}
          onSave={handleSaveReservation}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
