import fs from 'fs';

console.log("Loading pages...");
const pages = JSON.parse(fs.readFileSync('scratch_layer2_pages.json', 'utf8'));

console.log("Loading old data...");
const oldDataRaw = JSON.parse(fs.readFileSync('assets/combined/akhir_layer_1/data.json', 'utf8'));
const oldDataMap = new Map();
oldDataRaw.forEach(row => {
    oldDataMap.set(row["Nomor Kartu Ujian"], row);
});

const jabatans = [];
let currentJabatan = null;

for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i];
    if (pageText.includes("REKAPITULASI INTEGRASI NILAI")) {
        const jabatanMatch = pageText.match(/Jabatan Formasi\s*:\s*(.*?)\s*\d+\s*Lokasi/);
        const nums = pageText.match(/\(\d+\)\s*\(\d+\)\s*\(\d+\)\s*\(\d+\)\s*(\d+)\s*(\d+)\s*(\d+)\s*(\d+)/);
        
        let jabatanRaw = jabatanMatch ? jabatanMatch[1].trim() : "";
        let formasi = 0, peserta = 0, kelulusan = 0;
        if (nums) {
             formasi = parseInt(nums[1], 10);
             peserta = parseInt(nums[2], 10);
             kelulusan = parseInt(nums[3], 10);
        }
        
        let label = "";
        let shortJabatan = "";
        if (jabatanRaw.includes("MANAJER - KDKMP")) { label = "KDKMP - Manajer"; shortJabatan = "MANAJER - KDKMP"; }
        else if (jabatanRaw.includes("MANAJER OPERASIONAL")) { label = "KNMP - Manajer Operasional"; shortJabatan = "MANAJER OPERASIONAL - KNMP"; }
        else if (jabatanRaw.includes("KEPALA PRODUKSI")) { label = "KNMP - Kepala Produksi"; shortJabatan = "KEPALA PRODUKSI"; }
        else if (jabatanRaw.includes("PENJAMIN MUTU")) { label = "KNMP - Penjamin Mutu"; shortJabatan = "PENJAMIN MUTU"; }
        else if (jabatanRaw.includes("ADMINISTRASI KEUANGAN")) { label = "KNMP - Administrasi Keuangan"; shortJabatan = "ADMINISTRASI KEUANGAN"; }
        
        currentJabatan = {
            label,
            shortJabatan,
            rawJabatan: jabatanRaw,
            formasi,
            peserta,
            kelulusan,
            dataRows: [],
            startParsing: false
        };
        jabatans.push(currentJabatan);
    }
    
    if (currentJabatan && pageText.includes("HASIL INTEGRASI NILAI")) {
        currentJabatan.startParsing = true;
    }
    
    if (currentJabatan && currentJabatan.startParsing) {
        const rowRegex = /(\d+)\s+(P\d+)\s+(.*?)\s+((?:MANAJER - KDKMP|MANAJER OPERASIONAL - KNMP|KEPALA PRODUKSI|PENJAMIN MUTU|ADMINISTRASI KEUANGAN))\s+([A-Z\/\-0-9]+)(.*?)(?=\s+\d+\s+P\d+|\s+PANITIA\b|\s*$)/g;
        
        let match;
        while ((match = rowRegex.exec(pageText)) !== null) {
            currentJabatan.dataRows.push({
                "Page": i + 1,
                "No": match[1],
                "Nomor Kartu Ujian": match[2],
                "Nama Peserta": match[3].trim(),
                "Keterangan": match[5].trim(),
                "satdik": match[6].trim(),
                "Jabatan_Label": currentJabatan.label
            });
        }
    }
}

let totalRowsGlobal = 0;
const statusCountsGlobal = {};
const finalSummary = {
    totalRows: 0,
    statusCounts: {},
    jabatan: {}
};

const allData = [];

jabatans.forEach(j => {
    const statusCounts = {};
    j.dataRows.forEach(row => {
        const noPeserta = row["Nomor Kartu Ujian"];
        const oldRow = oldDataMap.get(noPeserta) || {};
        
        // Merge data according to user specification
        const finalRow = {
            "Page": row.Page,
            "No": row.No,
            "Nomor Kartu Ujian": row["Nomor Kartu Ujian"],
            "Nama Peserta": row["Nama Peserta"],
            "Keterangan": row.Keterangan,
            "Jabatan_Label": row.Jabatan_Label,
            "satdik": row.satdik || "",
            "Kognitif": oldRow.Kognitif || "",
            "Substansi": oldRow.Substansi || "",
            "status_sk": oldRow.status_sk || "",
            "peringkat_sk": oldRow.peringkat_sk || "",
            "status_sebelum_l1": oldRow.status_sebelum_l1 || "",
            "peringkat_sebelum_l1": oldRow.peringkat_sebelum_l1 || "",
            "status_sebelum_l2": oldRow.Keterangan || "",
            "peringkat_sebelum_l2": oldRow.No || ""
        };
        
        const s = finalRow.Keterangan;
        if (!statusCounts[s]) statusCounts[s] = 0;
        statusCounts[s]++;
        
        if (!statusCountsGlobal[s]) statusCountsGlobal[s] = 0;
        statusCountsGlobal[s]++;
        
        allData.push(finalRow);
    });
    
    totalRowsGlobal += j.dataRows.length;
    
    const thCount = statusCounts['TH'] || 0;
    const hadirCount = j.dataRows.length - thCount;
    
    let lulusCount = 0;
    Object.keys(statusCounts).forEach(k => {
        if (k.includes('L') && !k.includes('TL')) {
            lulusCount += statusCounts[k];
        }
    });

    finalSummary.jabatan[j.label] = {
        label: j.label,
        totalRows: j.dataRows.length,
        statusCounts: statusCounts,
        source: {
            jumlahFormasi: j.formasi.toString(),
            jumlahPeserta: j.peserta.toString(),
            kehadiran: {
                hadir: hadirCount.toString(),
                tidakHadir: thCount.toString()
            },
            kelulusan: {
                jumlah: lulusCount.toString(),
                persen: j.dataRows.length > 0 ? ((lulusCount / j.dataRows.length) * 100).toFixed(2) : "0.00"
            },
            jabatan: j.shortJabatan,
            statusCounts: statusCounts,
            totalRows: j.dataRows.length
        },
        statusChangeCounts: {
            "tetap L": 0,
            "tetap MS": 0,
            "tetap TMS": 0,
            "L jadi MS": 0,
            "L jadi TMS": 0,
            "MS jadi L": 0,
            "MS jadi TMS": 0,
            "TMS jadi L": 0,
            "TMS jadi MS": 0
        }
    };

    // Calculate changes if needed
    j.dataRows.forEach(row => {
        const noPeserta = row["Nomor Kartu Ujian"];
        const oldRow = oldDataMap.get(noPeserta) || {};
        const oldStatus = oldRow.Keterangan || "";
        const newStatus = row.Keterangan;

        let categoryOld = oldStatus.includes('L') && !oldStatus.includes('TL') && !oldStatus.includes('P/L') && oldStatus !== 'P/L-1' ? 'L' : 
                         (oldStatus.includes('MS') && !oldStatus.includes('TMS') ? 'MS' : 
                         (oldStatus.includes('TMS') || oldStatus.includes('TL') || oldStatus.includes('TH') ? 'TMS' : ''));
        let categoryNew = newStatus.includes('L') && !newStatus.includes('TL') && !newStatus.includes('P/L') && newStatus !== 'P/L-1' ? 'L' : 
                         (newStatus.includes('MS') && !newStatus.includes('TMS') ? 'MS' : 
                         (newStatus.includes('TMS') || newStatus.includes('TL') || newStatus.includes('TH') ? 'TMS' : ''));

        // Handle P/L explicitly if it means L
        if (oldStatus === 'P/L' || oldStatus === 'P/L-1') categoryOld = 'L';
        if (newStatus === 'P/L' || newStatus === 'P/L-1') categoryNew = 'L';

        if (categoryOld === 'L' && categoryNew === 'L') finalSummary.jabatan[j.label].statusChangeCounts['tetap L']++;
        if (categoryOld === 'MS' && categoryNew === 'MS') finalSummary.jabatan[j.label].statusChangeCounts['tetap MS']++;
        if (categoryOld === 'TMS' && categoryNew === 'TMS') finalSummary.jabatan[j.label].statusChangeCounts['tetap TMS']++;
        if (categoryOld === 'L' && categoryNew === 'MS') finalSummary.jabatan[j.label].statusChangeCounts['L jadi MS']++;
        if (categoryOld === 'L' && categoryNew === 'TMS') finalSummary.jabatan[j.label].statusChangeCounts['L jadi TMS']++;
        if (categoryOld === 'MS' && categoryNew === 'L') finalSummary.jabatan[j.label].statusChangeCounts['MS jadi L']++;
        if (categoryOld === 'MS' && categoryNew === 'TMS') finalSummary.jabatan[j.label].statusChangeCounts['MS jadi TMS']++;
        if (categoryOld === 'TMS' && categoryNew === 'L') finalSummary.jabatan[j.label].statusChangeCounts['TMS jadi L']++;
        if (categoryOld === 'TMS' && categoryNew === 'MS') finalSummary.jabatan[j.label].statusChangeCounts['TMS jadi MS']++;
    });

});

finalSummary.totalRows = totalRowsGlobal;
finalSummary.statusCounts = statusCountsGlobal;

fs.mkdirSync('assets/combined/akhir_layer_2', { recursive: true });
fs.writeFileSync('assets/combined/akhir_layer_2/summary.json', JSON.stringify(finalSummary, null, 2));
fs.writeFileSync('assets/combined/akhir_layer_2/data.json', JSON.stringify(allData, null, 2));

jabatans.forEach(j => {
    console.log(`${j.label}: Expected ${j.peserta}, Extracted ${j.dataRows.length}`);
});
console.log(`Summary updated. Total extracted rows: ${totalRowsGlobal}`);
