import React, { useState } from 'react'
import { useTheme } from './hooks/useTheme'
import SKPage from './pages/SkPage'
import SktPage from './pages/SktPage'
import './styles.css'
import logoKdkmp from '../assets/images/logo-kdkmp.jpg'
import logoKnmp from '../assets/images/logo-knmp.jpg'
import { APP_TEXT } from './config/constants'
import ThemeToggle from './components/common/ThemeToggle'

export default function App() {
  const [activeTab, setActiveTab] = useState('skt')
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          <h1>{APP_TEXT.TITLE}</h1>
        </div>
        <div className="app-header-actions">
          <img src={logoKdkmp} alt="Logo KDKMP" className="app-header-logo" />
          <img src={logoKnmp} alt="Logo KNMP" className="app-header-logo" />
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </header>

      <div className="app-disclaimer" style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginTop: '10px', marginBottom: '20px', lineHeight: '1.5', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <span>* Website ini hanya website pembantu untuk pencarian cepat. Sumber data resmi:</span>
        <a href="https://phtc.panselnas.go.id/pengumuman" target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'hsl(var(--brand))',
          color: 'hsl(var(--btn-search-fg))',
          padding: '6px 12px',
          borderRadius: 'var(--radius)',
          fontSize: '12px',
          fontWeight: '600',
          textDecoration: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'background-color 0.15s'
        }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--brand-foreground))'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--brand))'}>
          Buka Sumber Referensi Asli
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>

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
          {APP_TEXT.TAB_SKT}
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
          {APP_TEXT.TAB_SK}
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

      <footer className="app-footer" style={{
        marginTop: '36px',
        paddingTop: '20px',
        borderTop: '1px solid hsl(var(--border))',
        textAlign: 'center',
        fontSize: '12px',
        color: 'hsl(var(--muted-foreground))'
      }}>
        <p style={{ margin: 0 }}>
          Copyright &copy; {new Date().getFullYear()} -{' '}
          <a href="https://mohammadtoriq.netlify.app" target="_blank" rel="noopener noreferrer" style={{
            color: 'hsl(var(--brand))',
            fontWeight: '600',
            textDecoration: 'none'
          }} onMouseOver={(e) => e.target.style.textDecoration = 'underline'} onMouseOut={(e) => e.target.style.textDecoration = 'none'}>
            Mohammad Toriq
          </a>
        </p>
      </footer>
    </div>
  )
}
