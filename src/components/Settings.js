import React, { useState } from 'react';
import { getSettings, saveSettings, getStaff, addStaff, updateStaff, deleteStaff, getReservations } from '../utils/storage';
import { backupReservations, backupSalary } from '../utils/gasApi';

const INITIAL_STAFF_FORM = { name: '', hourlyWage: 1000 };

export default function Settings() {
  const [settings, setSettings] = useState(getSettings);
  const [staff, setStaff] = useState(getStaff);
  const [staffForm, setStaffForm] = useState(INITIAL_STAFF_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [salaryData, setSalaryData] = useState(() =>
    getStaff().map(s => ({ ...s, hours: 0 }))
  );
  const [backupStatus, setBackupStatus] = useState('');

  const refreshStaff = () => {
    const s = getStaff();
    setStaff(s);
    setSalaryData(s.map(st => ({ ...st, hours: 0 })));
  };

  const handleSettingsChange = (e) => {
    const updated = { ...settings, [e.target.name]: e.target.value };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleStaffFormChange = (e) => {
    const { name, value } = e.target;
    setStaffForm(prev => ({ ...prev, [name]: name === 'hourlyWage' ? Number(value) : value }));
  };

  const handleStaffSubmit = (e) => {
    e.preventDefault();
    if (!staffForm.name) return;
    if (editingId) {
      updateStaff(editingId, staffForm);
    } else {
      addStaff(staffForm);
    }
    refreshStaff();
    setStaffForm(INITIAL_STAFF_FORM);
    setEditingId(null);
    setShowStaffForm(false);
  };

  const handleStaffEdit = (s) => {
    setStaffForm({ name: s.name, hourlyWage: s.hourlyWage });
    setEditingId(s.id);
    setShowStaffForm(true);
  };

  const handleStaffDelete = (id) => {
    if (window.confirm('このスタッフを削除しますか？')) {
      deleteStaff(id);
      refreshStaff();
    }
  };

  const handleHoursChange = (id, hours) => {
    setSalaryData(prev => prev.map(s => s.id === id ? { ...s, hours: Number(hours) } : s));
  };

  const calcSalary = (s) => Math.round(s.hourlyWage * s.hours);

  const handleBackupReservations = async () => {
    try {
      setBackupStatus('送信中...');
      await backupReservations(settings.gasUrl, getReservations());
      setBackupStatus('予約データをバックアップしました ✓');
    } catch (e) {
      setBackupStatus(`エラー: ${e.message}`);
    }
  };

  const handleBackupSalary = async () => {
    try {
      setBackupStatus('送信中...');
      await backupSalary(settings.gasUrl, salaryData.map(s => ({
        name: s.name,
        hourlyWage: s.hourlyWage,
        hours: s.hours,
        salary: calcSalary(s),
      })));
      setBackupStatus('給料データをバックアップしました ✓');
    } catch (e) {
      setBackupStatus(`エラー: ${e.message}`);
    }
  };

  return (
    <div className="page-container">
      <h2>設定</h2>

      {/* GAS Settings */}
      <section className="settings-section">
        <h3>Google スプレッドシート連携</h3>
        <div className="form-group">
          <label>GAS WebアプリURL</label>
          <input
            type="url"
            name="gasUrl"
            value={settings.gasUrl}
            onChange={handleSettingsChange}
            placeholder="https://script.google.com/macros/s/..."
          />
        </div>
        <div className="backup-actions">
          <button className="btn-secondary" onClick={handleBackupReservations} disabled={!settings.gasUrl}>
            予約データをバックアップ
          </button>
          <button className="btn-secondary" onClick={handleBackupSalary} disabled={!settings.gasUrl}>
            給料データをバックアップ
          </button>
        </div>
        {backupStatus && <div className="backup-status">{backupStatus}</div>}
      </section>

      {/* Staff Management */}
      <section className="settings-section">
        <div className="section-header">
          <h3>スタッフ管理</h3>
          <button className="btn-primary" onClick={() => { setShowStaffForm(true); setEditingId(null); setStaffForm(INITIAL_STAFF_FORM); }}>
            ＋スタッフ追加
          </button>
        </div>

        {showStaffForm && (
          <div className="form-card">
            <form onSubmit={handleStaffSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>名前 *</label>
                  <input
                    type="text"
                    name="name"
                    value={staffForm.name}
                    onChange={handleStaffFormChange}
                    placeholder="田中 花子"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>時給 (円) *</label>
                  <input
                    type="number"
                    name="hourlyWage"
                    value={staffForm.hourlyWage}
                    onChange={handleStaffFormChange}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowStaffForm(false); setEditingId(null); }}>キャンセル</button>
                <button type="submit" className="btn-primary">{editingId ? '更新' : '追加'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="staff-list">
          {staff.length === 0 ? (
            <div className="empty-state">スタッフが登録されていません。</div>
          ) : (
            staff.map(s => (
              <div key={s.id} className="staff-item">
                <span className="staff-name">{s.name}</span>
                <span className="staff-wage">時給 ¥{s.hourlyWage.toLocaleString()}</span>
                <div className="item-actions">
                  <button className="btn-edit" onClick={() => handleStaffEdit(s)}>編集</button>
                  <button className="btn-delete" onClick={() => handleStaffDelete(s.id)}>削除</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Salary Calculation */}
      <section className="settings-section">
        <h3>給料計算（25日締め）</h3>
        <p className="section-note">当月の合計勤務時間を入力してください。</p>
        <div className="salary-table">
          <div className="salary-header">
            <span>スタッフ名</span>
            <span>時給</span>
            <span>勤務時間(h)</span>
            <span>給料</span>
          </div>
          {salaryData.length === 0 ? (
            <div className="empty-state">スタッフを登録してください。</div>
          ) : (
            salaryData.map(s => (
              <div key={s.id} className="salary-row">
                <span className="salary-name">{s.name}</span>
                <span className="salary-wage">¥{s.hourlyWage.toLocaleString()}</span>
                <input
                  type="number"
                  className="salary-hours-input"
                  value={s.hours}
                  onChange={e => handleHoursChange(s.id, e.target.value)}
                  min="0"
                  step="0.5"
                />
                <span className="salary-amount">¥{calcSalary(s).toLocaleString()}</span>
              </div>
            ))
          )}
          {salaryData.length > 0 && (
            <div className="salary-total">
              <span>合計</span>
              <span></span>
              <span>{salaryData.reduce((a, s) => a + s.hours, 0)}h</span>
              <span>¥{salaryData.reduce((a, s) => a + calcSalary(s), 0).toLocaleString()}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
