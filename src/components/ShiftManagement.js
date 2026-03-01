import React, { useState } from 'react';
import { WEEKDAYS_JP } from '../utils/dateUtils';
import { getShifts, addShift, updateShift, deleteShift } from '../utils/storage';

const INITIAL_FORM = {
  staffName: '',
  dayOfWeek: 0,
  period: '午前',
  startTime: '09:00',
  endTime: '13:00',
};

export default function ShiftManagement() {
  const [shifts, setShifts] = useState(getShifts);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = () => setShifts(getShifts());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'dayOfWeek' ? Number(value) : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.staffName) return;
    if (editingId) {
      updateShift(editingId, form);
    } else {
      addShift(form);
    }
    refresh();
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (shift) => {
    setForm({ ...shift });
    setEditingId(shift.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('このシフトを削除しますか？')) {
      deleteShift(id);
      refresh();
    }
  };

  const handleCancel = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  // Group shifts by dayOfWeek
  const grouped = WEEKDAYS_JP.map((day, i) => ({
    day,
    index: i,
    shifts: shifts.filter(s => s.dayOfWeek === i),
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>シフト管理</h2>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(INITIAL_FORM); }}>
          ＋シフト追加
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>{editingId ? 'シフト編集' : 'シフト追加'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>スタッフ名 *</label>
                <input
                  type="text"
                  name="staffName"
                  value={form.staffName}
                  onChange={handleChange}
                  placeholder="田中 花子"
                  required
                />
              </div>
              <div className="form-group">
                <label>曜日 *</label>
                <select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange}>
                  {WEEKDAYS_JP.map((day, i) => (
                    <option key={i} value={i}>{day}曜日</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>時間帯 *</label>
                <select name="period" value={form.period} onChange={handleChange}>
                  <option value="午前">午前</option>
                  <option value="午後">午後</option>
                </select>
              </div>
              <div className="form-group">
                <label>開始時間 *</label>
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>終了時間 *</label>
                <input type="time" name="endTime" value={form.endTime} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={handleCancel}>キャンセル</button>
              <button type="submit" className="btn-primary">{editingId ? '更新' : '追加'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="shift-list">
        {grouped.map(({ day, index, shifts: dayShifts }) => dayShifts.length > 0 && (
          <div key={index} className="shift-day-group">
            <h3 className="shift-day-header">{day}曜日</h3>
            {dayShifts.map(shift => (
              <div key={shift.id} className="shift-item">
                <div className="shift-info">
                  <span className="shift-staff">{shift.staffName}</span>
                  <span className={`shift-period-badge ${shift.period === '午前' ? 'am' : 'pm'}`}>
                    {shift.period}
                  </span>
                  <span className="shift-time">{shift.startTime} 〜 {shift.endTime}</span>
                </div>
                <div className="item-actions">
                  <button className="btn-edit" onClick={() => handleEdit(shift)}>編集</button>
                  <button className="btn-delete" onClick={() => handleDelete(shift.id)}>削除</button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {shifts.length === 0 && (
          <div className="empty-state">シフトが登録されていません。上のボタンから追加してください。</div>
        )}
      </div>
    </div>
  );
}
