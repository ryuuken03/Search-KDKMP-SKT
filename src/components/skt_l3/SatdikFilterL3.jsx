import React, { useState, useRef, useEffect, useMemo } from 'react'
import { IconChevron, IconClose, IconFilter } from '../common/Icons'

const IconSchool = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
)

export default function SatdikFilterL3({
  selectedSatdik,
  setSelectedSatdik,
  satdikList = [],
  loading = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const totalSatdikParticipants = useMemo(() => {
    return satdikList.reduce((acc, curr) => acc + (curr.jumlah || 0), 0)
  }, [satdikList])

  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return satdikList
    const term = searchTerm.toLowerCase()
    return satdikList.filter((item) => item.nama.toLowerCase().includes(term))
  }, [satdikList, searchTerm])

  const currentItem = useMemo(() => {
    return satdikList.find((item) => item.nama === selectedSatdik)
  }, [satdikList, selectedSatdik])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    } else {
      setSearchTerm('')
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSelect = (satdikNama) => {
    setSelectedSatdik(satdikNama)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setSelectedSatdik(null)
  }

  const satdikCount = satdikList.length

  return (
    <div className="satdik-filter" ref={containerRef}>
      <div className="satdik-filter__container">
        <label htmlFor="satdik-l3-select-btn" className="satdik-filter__label">
          <IconSchool className="satdik-filter__label-icon" />
          <span>Lokasi SATDIK:</span>
        </label>

        <div className="satdik-dropdown-wrapper">
          <div
            className={`satdik-dropdown-trigger${selectedSatdik ? ' satdik-dropdown-trigger--selected' : ''}${isOpen ? ' satdik-dropdown-trigger--open' : ''}`}
          >
            <button
              id="satdik-l3-select-btn"
              type="button"
              className="satdik-dropdown-trigger__btn"
              onClick={() => setIsOpen(!isOpen)}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              <span className="satdik-dropdown-trigger__text">
                {selectedSatdik ? selectedSatdik : 'Semua SATDIK'}
              </span>
              {currentItem ? (
                <span className="satdik-pill__count">
                  {currentItem.jumlah.toLocaleString('id-ID')} Peserta
                </span>
              ) : (
                <span className="satdik-pill__count satdik-pill__count--all">
                  {totalSatdikParticipants.toLocaleString('id-ID')} Total
                </span>
              )}
            </button>

            <div className="satdik-dropdown-trigger__actions">
              {selectedSatdik && (
                <button
                  type="button"
                  className="satdik-dropdown-trigger__clear"
                  onClick={handleClear}
                  title="Kembali ke Semua SATDIK"
                  aria-label="Hapus filter SATDIK"
                >
                  <IconClose />
                </button>
              )}
              <button
                type="button"
                className="satdik-dropdown-trigger__toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Tutup daftar SATDIK' : 'Buka daftar SATDIK'}
              >
                <IconChevron
                  className="satdik-dropdown-trigger__chevron"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
            </div>
          </div>

          {isOpen && (
            <div className="satdik-dropdown-menu" role="listbox" aria-label="Daftar SATDIK">
              <div className="satdik-dropdown-search">
                <input
                  ref={inputRef}
                  type="text"
                  className="satdik-dropdown-search__input"
                  placeholder={`Ketik untuk mencari SATDIK (${satdikCount} lokasi)...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="satdik-dropdown-search__clear"
                    onClick={() => setSearchTerm('')}
                  >
                    <IconClose />
                  </button>
                )}
              </div>

              <div className="satdik-dropdown-list">
                {!searchTerm && (
                  <button
                    type="button"
                    role="option"
                    aria-selected={!selectedSatdik}
                    className={`satdik-dropdown-item${!selectedSatdik ? ' satdik-dropdown-item--active' : ''}`}
                    onClick={() => handleSelect(null)}
                  >
                    <span className="satdik-dropdown-item__name">Semua SATDIK (Tanpa Filter)</span>
                    <span className="satdik-pill__count">
                      {totalSatdikParticipants.toLocaleString('id-ID')}
                    </span>
                  </button>
                )}

                {filteredList.map((item) => {
                  const isSelected = selectedSatdik === item.nama
                  return (
                    <button
                      key={item.id !== undefined ? item.id : item.nama}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`satdik-dropdown-item${isSelected ? ' satdik-dropdown-item--active' : ''}`}
                      onClick={() => handleSelect(item.nama)}
                    >
                      <span className="satdik-dropdown-item__name">{item.nama}</span>
                      <span className="satdik-pill__count">
                        {item.jumlah.toLocaleString('id-ID')}
                      </span>
                    </button>
                  )
                })}

                {filteredList.length === 0 && (
                  <div className="satdik-dropdown-empty">
                    Tidak ada SATDIK yang cocok dengan "{searchTerm}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
