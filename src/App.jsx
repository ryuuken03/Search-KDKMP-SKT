import React, { useState } from 'react'
import { useTheme } from './useTheme'
import SKPage from './pages/sk_page'
import SktPage from './pages/skt_page'
import './styles.css'

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      className={`theme-switch ${isDark ? 'theme-switch--dark' : ''}`}
      onClick={onToggle}
      aria-label={isDark ? 'Mode terang' : 'Mode gelap'}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
    >
      <span className="theme-switch__thumb">
        {isDark ? (
          <svg className="theme-switch__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg className="theme-switch__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        )}
      </span>
    </button>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('skt')
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          <h1 style={{ margin: 0 }}>Hasil Seleksi KDKMP &amp; KNMP</h1>
        </div>
        <div className="app-header-actions">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </header>

      <nav className="app-tabs" role="tablist" aria-label="Jenis hasil seleksi">
        <button
          type="button"
          role="tab"
          id="tab-skt"
          aria-selected={activeTab === 'skt'}
          aria-controls="panel-skt"
          className={`app-tabs__btn${activeTab === 'skt' ? ' app-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('skt')}
        >
          Hasil Akhir
        </button>
        <button
          type="button"
          role="tab"
          id="tab-sk"
          aria-selected={activeTab === 'sk'}
          aria-controls="panel-sk"
          className={`app-tabs__btn${activeTab === 'sk' ? ' app-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('sk')}
        >
          Hasil SK
        </button>
      </nav>

      <div
        role="tabpanel"
        id={activeTab === 'sk' ? 'panel-sk' : 'panel-skt'}
        aria-labelledby={activeTab === 'sk' ? 'tab-sk' : 'tab-skt'}
        className="app-tab-panel"
      >
        {activeTab === 'sk' ? <SKPage /> : <SktPage />}
      </div>
    </div>
  )
}
