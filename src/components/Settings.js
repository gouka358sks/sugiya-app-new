import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { backupReservations, backupSalary } from '../utils/gasApi';
import { formatDate, getCurrentMonth } from '../utils/dateUtils';

// toLocaleString() は Android で「わずか」が付くため固定フォーマットを使用
const fmtYen = (n) => '¥' + Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ===== PIN Pad =====
function PinPad({ onSuccess, title }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const addDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      onSuccess(next, () => {
        setError('パスワードが違います');
        setTimeout(() => { setPin(''); setError(''); }, 900);
      });
    }
  };

  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, '⌫'];

  return (
    <div className="pin-gate">
      <div className="pin-gate-card">
        <div className="pin-lock-icon">🔒</div>
        <h3>{title || '設定にアクセス'}</h3>
        <p className="pin-hint">4桁のパスワードを入力してください</p>
        <div className="pin-dots">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
          ))}
        </div>
        {error && <p className="pin-error">{error}</p>}
        <div className="pin-keypad">
          {keys.map((k, i) => (
            <button
              key={i}
              className={`pin-key ${k === null ? 'pin-key-empty' : ''}`}
              disabled={k === null}
              onClick={() => {
                if (k === '⌫') setPin(p => p.slice(0, -1));
                else if (k !== null) addDigit(String(k));
              }}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== Salary calculation helpers =====
function getPayPeriod(year, month) {
  const start = new Date(year, month - 1, 26);
  const end = new Date(year, month, 25);
  return { start, end };
}

function calcStaffHoursInPeriod(staffId, periodStart, periodEnd, allHours) {
  const startStr = formatDate(periodStart);
  const endStr = formatDate(periodEnd);
  let total = 0;
  Object.entries(allHours).forEach(([dateStr, entries]) => {
    if (dateStr < startStr || dateStr > endStr) return;
    if (!Array.isArray(entries)) return;
    entries
      .filter(e => e.staffId === staffId)
      .forEach(e => {
        const [sh, sm] = e.startTime.split(':').map(Number);
        const [eh, em] = e.endTime.split(':').map(Number);
        total += Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
      });
  });
  return Math.round(total * 10) / 10;
}

const INITIAL_STAFF_FORM = { name: '', hourlyWage: 1000 };

// ===== Main Settings Component =====
export default function Settings() {
  const {
    settings, saveSettings,
    staff, addStaff, updateStaff, deleteStaff,
    reservations, dailyHours,
  } = useData();

  const [unlocked, setUnlocked] = useState(() => !settings.settingsPassword);
  const [staffForm, setStaffForm] = useState(INITIAL_STAFF_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');

  // Password change state
  const [showPwSection, setShowPwSection] = useState(false);
  const [pwStep, setPwStep] = useState('new');
  const [pwNew, setPwNew] = useState('');
  const [pwError, setPwError] = useState('');

  // Salary month (0-indexed)
  const current = getCurrentMonth();
  const [salaryYear, setSalaryYear] = useState(current.year);
  const [salaryMonth, setSalaryMonth] = useState(current.month);

  // ===== Unlock =====
  if (!unlocked) {
    return (
      <PinPad
        onSuccess={(pin, onWrong) => {
          if (pin === settings.settingsPassword) {
            setUnlocked(true);
          } else {
            onWrong();
          }
        }}
      />
    );
  }

  // ===== Handlers =====
  const handleSettingsChange = (e) => {
    const updated = { ...settings, [e.target.name]: e.target.value };
    saveSettings(updated);
  };

  const handleStaffSubmit = (e) => {
    e.preventDefault();
    if (!staffForm.name) return;
    if (editingId) {
      updateStaff(editingId, staffForm);
    } else {
      addStaff(staffForm);
    }
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
    }
  };

  // ===== Salary =====
  const { start: periodStart, end: periodEnd } = getPayPeriod(salaryYear, salaryMonth);

  const salaryData = staff.map(s => {
    const hours = calcStaffHoursInPeriod(s.id, periodStart, periodEnd, dailyHours);
    return { ...s, hours, salary: Math.round(s.hourlyWage * hours) };
  });

  const prevSalaryMonth = () => {
    if (salaryMonth === 0) { setSalaryYear(y => y - 1); setSalaryMonth(11); }
    else setSalaryMonth(m => m - 1);
  };
  const nextSalaryMonth = () => {
    if (salaryMonth === 11) { setSalaryYear(y => y + 1); setSalaryMonth(0); }
    else setSalaryMonth(m => m + 1);
  };

  const periodLabel = `${formatDate(periodStart)} 〜 ${formatDate(periodEnd)}`;

  // ===== Password management =====
  const handlePwPinSuccess = (pin, onWrong) => {
    if (pwStep === 'current') {
      if (pin === settings.settingsPassword) {
        setPwStep('new');
        setPwError('');
      } else {
        onWrong();
      }
    } else if (pwStep === 'new') {
      setPwNew(pin);
      setPwStep('confirm');
      setPwError('');
    } else if (pwStep === 'confirm') {
      if (pin === pwNew) {
        saveSettings({ ...settings, settingsPassword: pin });
        setShowPwSection(false);
        setPwStep('new');
        setPwNew('');
        setPwError('');
        alert('パスワードを設定しました');
      } else {
        setPwError('パスワードが一致しません');
        onWrong();
        setTimeout(() => { setPwStep('new'); setPwNew(''); setPwError(''); }, 900);
      }
    }
  };

  const handleRemovePassword = () => {
    if (window.confirm('パスワードを削除しますか？')) {
      saveSettings({ ...settings, settingsPassword: '' });
    }
  };

  // ===== Backup =====
  const handleBackupReservations = async () => {
    try {
      setBackupStatus('送信中...');
      await backupReservations(settings.gasUrl, reservations);
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
        salary: s.salary,
      })));
      setBackupStatus('給料データをバックアップしました ✓');
    } catch (e) {
      setBackupStatus(`エラー: ${e.message}`);
    }
  };

  return (
    <div className="page-container">
      <h2>設定</h2>

      {/* Password Section */}
      <section className="settings-section">
        <div className="section-header">
          <h3>🔒 設定パスワード</h3>
          {!showPwSection && (
            <button className="btn-secondary" onClick={() => {
              setShowPwSection(true);
              setPwStep(settings.settingsPassword ? 'current' : 'new');
              setPwNew('');
              setPwError('');
            }}>
              {settings.settingsPassword ? 'パスワード変更' : 'パスワードを設定する'}
            </button>
          )}
        </div>
        <p className="section-note">
          {settings.settingsPassword
            ? 'パスワードが設定されています。設定ページを開くときに入力が必要です。'
            : 'パスワードが未設定です。設定するとこのページへのアクセスを制限できます。'}
        </p>

        {showPwSection && (
          <div className="pw-setup-area">
            <p className="pw-step-label">
              {pwStep === 'current' && '現在のパスワードを入力'}
              {pwStep === 'new' && '新しい4桁のパスワードを入力'}
              {pwStep === 'confirm' && '確認のため、もう一度入力'}
            </p>
            {pwError && <p className="pin-error" style={{ textAlign: 'center', marginBottom: 8 }}>{pwError}</p>}
            <PinPad onSuccess={handlePwPinSuccess} title="" />
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button className="btn-secondary" onClick={() => { setShowPwSection(false); setPwStep('new'); setPwNew(''); }}>
                キャンセル
              </button>
            </div>
          </div>
        )}

        {settings.settingsPassword && !showPwSection && (
          <div style={{ marginTop: 8 }}>
            <button className="btn-delete" onClick={handleRemovePassword}>
              パスワードを削除する
            </button>
          </div>
        )}
      </section>

      {/* Salary Calculation */}
      <section className="settings-section">
        <h3>給料計算（25日締め）</h3>
        <div className="salary-month-nav">
          <button className="nav-btn" onClick={prevSalaryMonth}>&#8249;</button>
          <span className="salary-month-label">
            {salaryYear}年{salaryMonth + 1}月分
          </span>
          <button className="nav-btn" onClick={nextSalaryMonth}>&#8250;</button>
        </div>
        <p className="section-note">集計期間: {periodLabel}</p>
        <p className="section-note">※ カレンダーで入力した勤務時間から自動集計されます</p>

        <div className="salary-table">
          <div className="salary-header">
            <span>スタッフ名</span>
            <span>時給</span>
            <span>勤務時間</span>
            <span>給料</span>
          </div>
          {salaryData.length === 0 ? (
            <div className="empty-state">スタッフを登録してください。</div>
          ) : (
            salaryData.map(s => (
              <div key={s.id} className="salary-row">
                <span className="salary-name">{s.name}</span>
                <span className="salary-wage">{fmtYen(s.hourlyWage)}</span>
                <span className="salary-hours">{s.hours}h</span>
                <span className="salary-amount">{fmtYen(s.salary)}</span>
              </div>
            ))
          )}
          {salaryData.length > 0 && (
            <div className="salary-total">
              <span>合計</span>
              <span></span>
              <span>{salaryData.reduce((a, s) => a + s.hours, 0)}h</span>
              <span>{fmtYen(salaryData.reduce((a, s) => a + s.salary, 0))}</span>
            </div>
          )}
        </div>
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
                    onChange={e => setStaffForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="田中 花子"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>時給 *</label>
                  <input
                    type="number"
                    name="hourlyWage"
                    value={staffForm.hourlyWage}
                    onChange={e => setStaffForm(p => ({ ...p, hourlyWage: Number(e.target.value) }))}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowStaffForm(false); setEditingId(null); }}>
                  キャンセル
                </button>
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
                <span className="staff-wage">時給 {fmtYen(s.hourlyWage)}</span>
                <div className="item-actions">
                  <button className="btn-edit" onClick={() => handleStaffEdit(s)}>編集</button>
                  <button className="btn-delete" onClick={() => handleStaffDelete(s.id)}>削除</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

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
    </div>
  );
}
