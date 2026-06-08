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
    </div>
  )
}
