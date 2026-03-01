import React, { useState } from 'react';
import Calendar from './components/Calendar';
import ShiftManagement from './components/ShiftManagement';
import ReservationManagement from './components/ReservationManagement';
import Settings from './components/Settings';
import './App.css';

const NAV_ITEMS = [
  { id: 'calendar', label: 'カレンダー', icon: '📅' },
  { id: 'shifts', label: 'シフト管理', icon: '👥' },
  { id: 'reservations', label: '予約管理', icon: '📋' },
  { id: 'settings', label: '設定', icon: '⚙️' },
];

function App() {
  const [activePage, setActivePage] = useState('calendar');

  const renderPage = () => {
    switch (activePage) {
      case 'calendar': return <Calendar />;
      case 'shifts': return <ShiftManagement />;
      case 'reservations': return <ReservationManagement />;
      case 'settings': return <Settings />;
      default: return <Calendar />;
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">🍽️ 飲食店管理</h1>
        <nav className="desktop-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="app-main">
        {renderPage()}
      </main>

      {/* Bottom nav for mobile */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
