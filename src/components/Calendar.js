import React, { useState, useCallback } from 'react';
import {
  formatDate, getMonthDays, isToday, WEEKDAYS_JP,
  formatMonthYear, getCurrentMonth,
} from '../utils/dateUtils';
import { useData } from '../contexts/DataContext';
import ReservationModal from './ReservationModal';
import StaffHoursModal from './StaffHoursModal';

function getPeriod(startTime) {
  return startTime < '12:00' ? '午前' : '午後';
}

export default function Calendar() {
  const current = getCurrentMonth();
  const [year, setYear] = useState(current.year);
  const [month, setMonth] = useState(current.month);
  const [modal, setModal] = useState(null);
  const [staffHoursDate, setStaffHoursDate] = useState(null);

  const {
    reservations, addReservation, updateReservation,
    businessDays, toggleBusinessDay,
    shifts,
    dailyHours, saveDayHours,
  } = useData();

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
    if (date < today) return [];
    return shifts.filter(s => s.dayOfWeek === date.getDay());
  };

  const isOpen = (date) => businessDays[formatDate(date)] !== false;

  const handleSaveReservation = useCallback((form) => {
    if (modal?.reservation) {
      updateReservation(modal.reservation.id, form);
    } else {
      addReservation(form);
    }
    setModal(null);
  }, [modal, addReservation, updateReservation]);

  const handleSaveStaffHours = useCallback((dateStr, entries) => {
    saveDayHours(dateStr, entries);
    setStaffHoursDate(null);
  }, [saveDayHours]);

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

          const dayEntries = Array.isArray(dailyHours[ds]) ? dailyHours[ds] : [];
          const hasHours = dayEntries.length > 0;
          const amEntries = dayEntries.filter(e => getPeriod(e.startTime) === '午前');
          const pmEntries = dayEntries.filter(e => getPeriod(e.startTime) === '午後');

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
                    onClick={() => toggleBusinessDay(ds)}
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

              {hasHours && (
                <div className="cell-daily-hours">
                  {amEntries.length > 0 && (
                    <div className="shift-group">
                      <span className="shift-period">午前:</span>
                      {amEntries.map(e => (
                        <span key={e.id} className="daily-hour-tag">{e.name}</span>
                      ))}
                    </div>
                  )}
                  {pmEntries.length > 0 && (
                    <div className="shift-group">
                      <span className="shift-period">午後:</span>
                      {pmEntries.map(e => (
                        <span key={e.id} className="daily-hour-tag">{e.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {open && !hasHours && dayShifts.length > 0 && (
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

              <div className="cell-actions">
                <button
                  className={`hours-btn ${hasHours ? 'has-hours' : ''}`}
                  onClick={() => setStaffHoursDate(ds)}
                  title="勤務時間を入力・編集"
                >
                  ⏱
                </button>
                {editable && open && (
                  <button
                    className="add-reservation-btn"
                    onClick={() => setModal({ type: 'add', date: ds, reservation: null })}
                  >
                    ＋予約
                  </button>
                )}
              </div>
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

      {staffHoursDate && (
        <StaffHoursModal
          dateStr={staffHoursDate}
          dayHours={dailyHours[staffHoursDate]}
          onSave={handleSaveStaffHours}
          onClose={() => setStaffHoursDate(null)}
        />
      )}
    </div>
  );
}
