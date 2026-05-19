import React, { useState } from 'react'
import { useTheme } from './useTheme'
import CatPage from './pages/cat_page'
import SktPage from './pages/skt_page'
import './styles.css'

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? 'Mode terang' : 'Mode gelap'}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('cat')
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Hasil Seleksi KDKMP</h1>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </header>

      <nav className="app-tabs" role="tablist" aria-label="Jenis hasil seleksi">
        <button
          type="button"
          role="tab"
          id="tab-cat"
          aria-selected={activeTab === 'cat'}
          aria-controls="panel-cat"
          className={`app-tabs__btn${activeTab === 'cat' ? ' app-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('cat')}
        >
          Hasil CAT
        </button>
        <button
          type="button"
          role="tab"
          id="tab-skt"
          aria-selected={activeTab === 'skt'}
          aria-controls="panel-skt"
          className={`app-tabs__btn${activeTab === 'skt' ? ' app-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('skt')}
        >
          Hasil SKT
        </button>
      </nav>

      <div
        role="tabpanel"
        id={activeTab === 'cat' ? 'panel-cat' : 'panel-skt'}
        aria-labelledby={activeTab === 'cat' ? 'tab-cat' : 'tab-skt'}
        className="app-tab-panel"
      >
        {activeTab === 'cat' ? <CatPage /> : <SktPage />}
      </div>
    </div>
  )
}
