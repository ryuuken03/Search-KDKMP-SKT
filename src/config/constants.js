export const STATUS_LEGEND = [
  { key: 'p', color: '#10b981', label: 'P/L = Lulus Kognitif >= 110' },
  { key: 'p1', color: '#10b981', label: 'P1/L = Lulus Kognitif >= 100' },
  { key: 'p2', color: '#10b981', label: 'P2/L = Lulus Kognitif >= 90 dan Substansi >= 71' },
  { key: 'tl', color: '#f43f5e', label: 'TL = Tidak Lulus' },
  { key: 'th', color: '#eab308', label: 'TH = Tidak Hadir' },
  { key: 'tms', color: '#6b7280', label: 'TMS = Tidak Memenuhi Syarat' },
  { key: 'aps', color: '#6b7280', label: 'APS = Pengunduran Atas Permintaan Sendiri' },
];

export const STATUS_LEGEND_AKHIR = [
  { key: 'l', color: '#10b981', label: 'L = Lulus Seleksi' },
  { key: 'ms', color: '#3b82f6', label: 'MS = Memenuhi Syarat' },
  { key: 'tms', color: '#f43f5e', label: 'TMS = Tidak Memenuhi Syarat' },
];

export const APP_TEXT = {
  TITLE: 'Hasil Seleksi KDKMP & KNMP',
  MODE_LIGHT: 'Mode terang',
  MODE_DARK: 'Mode gelap',
  TAB_SKT_L1: 'Pengganti Layer 1',
  TAB_SKT_L2: 'Pengganti Layer 2',
  TAB_SKT: 'SKT',
  TAB_SK: 'SK',
  SCROLL_TOP: 'Kembali ke atas',
};

export const SEARCH_TEXT = {
  PLACEHOLDER: 'Cari Nama/Nomor Peserta/Peringkat',
  CANCEL: 'Batal',
  FILTER_JABATAN: 'Jabatan',
};

export const TABLE_TEXT = {
  HEADERS: {
    PERINGKAT: 'Peringkat',
    NO_PESERTA: 'No Peserta',
    NAMA: 'Nama',
    KOGNITIF: 'Kognitif',
    SUBSTANSI: 'Substansi',
    PENDIDIKAN: 'Pendidikan',
    STATUS: 'Status',
    JABATAN: 'Jabatan',
    FORMASI: 'Formasi',
  },
  LOADING: 'Sedang mencari…',
  INITIAL_LOADING: 'Memuat data...',
  NO_RESULTS: 'Hasil tidak ditemukan.',
  SORT_TIP: 'Klik untuk mengurutkan berdasarkan',
  SORT_TIP_DISABLED: 'Cari Nama atau Nomor Peserta terlebih dahulu untuk mengurutkan seluruh hasil',
};

export const SUMMARY_TEXT = {
  TOGGLE_OPEN: 'Statistik Kelulusan',
  TOGGLE_CLOSE: 'Tutup Statistik Kelulusan',
  TABLE_KATEGORI: 'KATEGORI',
  TABLE_TOTAL: 'TOTAL',
  CARD_TOTAL_ALL: 'Total Seluruh Peserta',
  CARD_TOTAL: 'Total:',
  PAGE_LEGEND: 'Keterangan Status',
  PROGRES: 'Progres:',
  SMART_HINT_PRE: 'Menampilkan peringkat',
  SMART_HINT_LINK: 'Nomor Peserta mengandung',
};
