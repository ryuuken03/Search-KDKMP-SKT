// ─── Jabatan Config (untuk label display) ───────────────────────────────────
export const JABATAN_LABELS = [
  'KDKMP - Manajer',
  'KNMP - Manajer Operasional',
  'KNMP - Kepala Produksi',
  'KNMP - Penjamin Mutu',
  'KNMP - Administrasi Keuangan',
]

export function getJabatanSlug(jabatan) {
  if (!jabatan) return 'unknown';
  if (jabatan.includes('KDKMP')) return 'kdkmp';
  if (jabatan.includes('Manajer Operasional')) return 'manajer_operasional';
  if (jabatan.includes('Kepala Produksi')) return 'kepala_produksi';
  if (jabatan.includes('Penjamin Mutu')) return 'penjamin_mutu';
  if (jabatan.includes('Administrasi Keuangan')) return 'administrasi_keuangan';
  return 'unknown';
}

export function detectSearchMode(queryStr, totalRows) {
  const trimmed = queryStr.trim()
  // 1. Diawali huruf P/p diikuti angka
  if (/^[pP]\d+$/.test(trimmed)) {
    return 'Nomor Peserta'
  }
  // 2. Angka murni
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10)
    if (num <= totalRows) {
      return 'Peringkat'
    } else {
      return 'Nomor Peserta'
    }
  }
  // 3. Sisanya adalah Nama
  return 'Nama'
}

export const DATASET_PATH = '/assets/combined/sk'
export const DATASET_PATH_AKHIR = '/assets/combined/akhir'
export const DATASET_PATH_AKHIR_L1 = '/assets/combined/akhir_layer_1'
export const DATASET_PATH_AKHIR_L2 = '/assets/combined/akhir_layer_2'
export const DATASET_PATH_AKHIR_L3 = '/assets/combined/akhir_layer_3'
export const CACHE_PREFIX = 'combined'
export const CHUNK_SIZE   = 5000
