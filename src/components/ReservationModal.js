import React, { useState, useEffect } from 'react';

const INITIAL_FORM = {
  date: '',
  name: '',
  people: 1,
  time: '',
  phone: '',
  note: '',
};

export default function ReservationModal({ reservation, defaultDate, onSave, onClose, readOnly }) {
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (reservation) {
      setForm(reservation);
    } else if (defaultDate) {
      setForm({ ...INITIAL_FORM, date: defaultDate });
    }
  }, [reservation, defaultDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date || !form.name || !form.time) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{readOnly ? '予約詳細' : reservation ? '予約編集' : '予約追加'}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>日付 *</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>
          <div className="form-group">
            <label>お名前 *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="山田 太郎"
              required
              readOnly={readOnly}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>人数 *</label>
              <input
                type="number"
                name="people"
                value={form.people}
                onChange={handleChange}
                min="1"
                required
                readOnly={readOnly}
              />
            </div>
            <div className="form-group">
              <label>時間 *</label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                required
                readOnly={readOnly}
                disabled={readOnly}
              />
            </div>
          </div>
          <div className="form-group">
            <label>電話番号</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="090-0000-0000"
              readOnly={readOnly}
            />
          </div>
          <div className="form-group">
            <label>備考</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows="3"
              placeholder="アレルギー・席の希望など"
              readOnly={readOnly}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {readOnly ? '閉じる' : 'キャンセル'}
            </button>
            {!readOnly && (
              <button type="submit" className="btn-primary">
                {reservation ? '更新' : '追加'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
