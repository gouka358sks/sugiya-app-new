import React, { useState, useCallback } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  getReservations, addReservation, updateReservation, deleteReservation,
} from '../utils/storage';
import ReservationModal from './ReservationModal';

export default function ReservationManagement() {
  const [reservations, setReservations] = useState(getReservations);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  const refresh = () => setReservations(getReservations());

  const handleSave = useCallback((form) => {
    if (modal?.reservation) {
      updateReservation(modal.reservation.id, form);
    } else {
      addReservation(form);
    }
    refresh();
    setModal(null);
  }, [modal]);

  const handleDelete = (id) => {
    if (window.confirm('この予約を削除しますか？')) {
      deleteReservation(id);
      refresh();
    }
  };

  const filtered = reservations
    .filter(r => {
      if (!search) return true;
      return r.name.includes(search) || r.date.includes(search) || r.phone.includes(search);
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const today = formatDate(new Date());

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>予約管理</h2>
        <button className="btn-primary" onClick={() => setModal({ reservation: null })}>
          ＋予約追加
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="名前・日付・電話番号で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="reservation-list">
        {filtered.length === 0 ? (
          <div className="empty-state">予約がありません。</div>
        ) : (
          filtered.map(r => (
            <div key={r.id} className={`reservation-item ${r.date < today ? 'past' : r.date === today ? 'today' : ''}`}>
              <div className="reservation-date">
                <span className="date-label">{r.date}</span>
                <span className="time-label">{r.time}</span>
              </div>
              <div className="reservation-info">
                <span className="res-name">{r.name}</span>
                <span className="res-people">{r.people}名</span>
                {r.phone && <span className="res-phone">📞 {r.phone}</span>}
                {r.note && <span className="res-note">📝 {r.note}</span>}
              </div>
              <div className="item-actions">
                <button className="btn-edit" onClick={() => setModal({ reservation: r })}>編集</button>
                <button className="btn-delete" onClick={() => handleDelete(r.id)}>削除</button>
              </div>
            </div>
          ))
        )}
      </div>

      {modal !== null && (
        <ReservationModal
          reservation={modal.reservation}
          defaultDate={today}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
