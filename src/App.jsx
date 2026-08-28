import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from './hooks/useTheme'
import SKPage from './pages/SkPage'
import SktPage from './pages/SktPage'
import SktL1Page from './pages/SktL1Page'
import SktL2Page from './pages/SktL2Page'
import SktL3Page from './pages/SktL3Page'
import './styles.css'
import logoKdkmp from '../assets/images/logo-kdkmp.jpg'
import logoKnmp from '../assets/images/logo-knmp.jpg'
import { APP_TEXT } from './config/constants'
import ThemeToggle from './components/common/ThemeToggle'
import PelatihanLulus from './pages/PelatihanLulus'

export default function App() {
  const [activeTab, setActiveTab] = useState('pelatihan_lulus')
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTabMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const TABS = [
    { id: 'pelatihan_lulus', label: APP_TEXT.TAB_PELATIHAN_LULUS },
    { id: 'skt_l3', label: APP_TEXT.TAB_SKT_L3 },
    { id: 'skt_l2', label: APP_TEXT.TAB_SKT_L2 },
    { id: 'skt_l1', label: APP_TEXT.TAB_SKT_L1 },
    { id: 'skt', label: APP_TEXT.TAB_SKT },
    { id: 'sk', label: APP_TEXT.TAB_SK }
  ]

  const activeTabLabel = TABS.find(t => t.id === activeTab)?.label || 'Tab'
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

      <nav className="app-tabs-dropdown" ref={dropdownRef} role="tablist" aria-label="Jenis hasil seleksi">
        <div className="app-tabs-dropdown__header">
          <span className="app-tabs-dropdown__active-label">{activeTabLabel}</span>
          <button
            className={`app-tabs-dropdown__toggle ${isTabMenuOpen ? 'active' : ''}`}
            onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
            aria-label="Pilih tab lainnya"
            aria-expanded={isTabMenuOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1.5"></circle>
              <circle cx="19" cy="12" r="1.5"></circle>
              <circle cx="5" cy="12" r="1.5"></circle>
            </svg>
          </button>
        </div>

        {isTabMenuOpen && (
          <div className="app-tabs-dropdown__menu">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id.replace('_', '-')}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id.replace('_', '-')}`}
                className={`app-tabs-dropdown__item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id)
                  setIsTabMenuOpen(false)
                }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </nav>

      <div
        role="tabpanel"
        id={`panel-${activeTab.replace(/_/g, '-')}`}
        aria-labelledby={`tab-${activeTab.replace(/_/g, '-')}`}
        className="app-tab-panel"
      >
        {activeTab === 'pelatihan_lulus' ? (
          <PelatihanLulus />
        ) : activeTab === 'sk' ? (
          <SKPage />
        ) : activeTab === 'skt_l3' ? (
          <SktL3Page />
        ) : activeTab === 'skt_l2' ? (
          <SktL2Page />
        ) : activeTab === 'skt_l1' ? (
          <SktL1Page />
        ) : (
          <SktPage />
        )}
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
