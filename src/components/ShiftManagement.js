import React, { useState } from 'react';
import { WEEKDAYS_JP } from '../utils/dateUtils';
import { useData } from '../contexts/DataContext';

const INITIAL_FORM = {
  staffName: '',
  dayOfWeek: 0,
  period: '午前',
  startTime: '09:00',
  endTime: '13:00',
};

export default function ShiftManagement() {
  const { shifts, addShift, updateShift, deleteShift, staff } = useData();
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
    }
  };

  const handleCancel = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const grouped = WEEKDAYS_JP.map((day, i) => ({
    day,
    index: i,
    shifts: shifts.filter(s => s.dayOfWeek === i),
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>シフト管理</h2>
          <span className="shift-subtitle">レギュラーのみ</span>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(INITIAL_FORM); }}>
          ＋シフト追加
        </button>
      </div>

      <div className="shift-notice">
        <span className="shift-notice-icon">📅</span>
        <span>当日の変更・追加はカレンダーから行ってください。カレンダーの記録が最終決定です。</span>
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
                  list="shift-staff-list"
                  value={form.staffName}
                  onChange={handleChange}
                  placeholder="スタッフを選択または入力"
                  required
                />
                <datalist id="shift-staff-list">
                  {staff.map(s => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
                {staff.length > 0 && (
                  <span className="input-hint">設定のスタッフから選択できます</span>
                )}
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
          <div className="empty-state">レギュラーシフトが登録されていません。<br />毎週同じ人がいる場合は上のボタンから追加してください。</div>
        )}
      </div>
    </div>
  );
}
