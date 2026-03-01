import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';

function calcHours(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
}

const EMPTY_ADD = { staffId: '', name: '', startTime: '09:00', endTime: '18:00' };

export default function StaffHoursModal({ dateStr, dayHours, onSave, onClose }) {
  const { staff, shifts } = useData();

  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();

  // 現在のエントリリスト（配列形式）
  const [entries, setEntries] = useState(() =>
    Array.isArray(dayHours) ? dayHours.map(e => ({ ...e })) : []
  );

  // 追加フォーム
  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [showAddForm, setShowAddForm] = useState(false);

  const dateLabel = dateObj.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  // スタッフを選択したときにデフォルト時間を設定
  const handleSelectStaff = (staffId, name) => {
    const regularShift = shifts.find(
      sh => sh.staffName === name && sh.dayOfWeek === dayOfWeek
    );
    setAddForm({
      staffId,
      name,
      startTime: regularShift?.startTime || '09:00',
      endTime: regularShift?.endTime || '18:00',
    });
    setShowAddForm(true);
  };

  // 追加フォームからエントリを追加
  const handleAdd = () => {
    if (!addForm.name) return;
    const newEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      staffId: addForm.staffId,
      name: addForm.name,
      startTime: addForm.startTime,
      endTime: addForm.endTime,
    };
    setEntries(prev => [...prev, newEntry]);
    setAddForm(EMPTY_ADD);
    setShowAddForm(false);
  };

  // エントリ削除
  const handleDelete = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  // エントリの時間変更
  const handleTimeChange = (id, field, val) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const handleSave = () => {
    onSave(dateStr, entries);
  };

  // 各スタッフの合計時間
  const totalByStaff = {};
  entries.forEach(e => {
    const key = e.staffId || e.name;
    totalByStaff[key] = (totalByStaff[key] || 0) + calcHours(e.startTime, e.endTime);
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sh-modal" onClick={ev => ev.stopPropagation()}>
        <div className="modal-header">
          <h3>⏱ {dateLabel} 勤務時間</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 現在の勤務エントリ */}
        <div className="sh-body">
          {entries.length === 0 ? (
            <p className="sh-empty">まだ勤務が入力されていません</p>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="sh-entry sh-active">
                <div className="sh-entry-top">
                  <span className="sh-name">{entry.name}</span>
                  <button
                    className="sh-delete-btn"
                    onClick={() => handleDelete(entry.id)}
                    title="削除"
                  >
                    ✕
                  </button>
                </div>
                <div className="sh-times">
                  <input
                    type="time"
                    value={entry.startTime}
                    onChange={e => handleTimeChange(entry.id, 'startTime', e.target.value)}
                  />
                  <span className="sh-sep">〜</span>
                  <input
                    type="time"
                    value={entry.endTime}
                    onChange={e => handleTimeChange(entry.id, 'endTime', e.target.value)}
                  />
                  <span className="sh-hrs">
                    {calcHours(entry.startTime, entry.endTime).toFixed(1)}h
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* スタッフ追加エリア */}
        <div className="sh-add-area">
          {!showAddForm ? (
            <>
              <p className="sh-add-label">スタッフを追加:</p>
              <div className="sh-staff-buttons">
                {staff.map(s => (
                  <button
                    key={s.id}
                    className="sh-staff-btn"
                    onClick={() => handleSelectStaff(s.id, s.name)}
                  >
                    ＋ {s.name}
                  </button>
                ))}
                {staff.length === 0 && (
                  <button
                    className="sh-staff-btn sh-manual-btn"
                    onClick={() => { setAddForm(EMPTY_ADD); setShowAddForm(true); }}
                  >
                    ＋ 手動で追加
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="sh-add-form">
              {!addForm.name && (
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label>スタッフ名</label>
                  <input
                    type="text"
                    list="sh-staff-datalist"
                    value={addForm.name}
                    onChange={e => setAddForm(p => ({ ...p, name: e.target.value, staffId: '' }))}
                    placeholder="名前を入力"
                    autoFocus
                  />
                  <datalist id="sh-staff-datalist">
                    {staff.map(s => <option key={s.id} value={s.name} />)}
                  </datalist>
                </div>
              )}
              {addForm.name && (
                <p className="sh-add-who">
                  <strong>{addForm.name}</strong> の時間帯を入力:
                </p>
              )}
              <div className="sh-times">
                <input
                  type="time"
                  value={addForm.startTime}
                  onChange={e => setAddForm(p => ({ ...p, startTime: e.target.value }))}
                />
                <span className="sh-sep">〜</span>
                <input
                  type="time"
                  value={addForm.endTime}
                  onChange={e => setAddForm(p => ({ ...p, endTime: e.target.value }))}
                />
                <span className="sh-hrs">
                  {addForm.startTime && addForm.endTime
                    ? calcHours(addForm.startTime, addForm.endTime).toFixed(1) + 'h'
                    : ''}
                </span>
              </div>
              <div className="sh-add-actions">
                <button
                  className="btn-secondary"
                  onClick={() => { setShowAddForm(false); setAddForm(EMPTY_ADD); }}
                >
                  キャンセル
                </button>
                <button
                  className="btn-primary"
                  onClick={handleAdd}
                  disabled={!addForm.name}
                >
                  追加
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}
