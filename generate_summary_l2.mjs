import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('assets/combined/akhir_layer_2/data.json', 'utf8'));

const summary = {
    "tetap L": 0,
    "tetap MS": 0,
    "tetap TMS": 0,
    "L jadi MS": 0,
    "L jadi TMS": 0,
    "MS jadi L": 0,
    "MS jadi TMS": 0,
    "TMS jadi L": 0,
    "TMS jadi MS": 0
};

data.forEach(row => {
    let oldStatusRaw = row.status_sebelum_l2 || "";
    let newStatusRaw = row.Keterangan || "";

    // Normalize P/L to L
    if (oldStatusRaw === 'P/L' || oldStatusRaw === 'P/L-1') oldStatusRaw = 'L';
    if (newStatusRaw === 'P/L' || newStatusRaw === 'P/L-1') newStatusRaw = 'L';

    // Normalize status into L, MS, TMS based on existing logic
    let oldStatus = oldStatusRaw.includes('L') && !oldStatusRaw.includes('TL') ? 'L' : 
                   (oldStatusRaw.includes('MS') && !oldStatusRaw.includes('TMS') ? 'MS' : 
                   (oldStatusRaw.includes('TMS') || oldStatusRaw.includes('TL') || oldStatusRaw.includes('TH') ? 'TMS' : ''));
                   
    let newStatus = newStatusRaw.includes('L') && !newStatusRaw.includes('TL') ? 'L' : 
                   (newStatusRaw.includes('MS') && !newStatusRaw.includes('TMS') ? 'MS' : 
                   (newStatusRaw.includes('TMS') || newStatusRaw.includes('TL') || newStatusRaw.includes('TH') ? 'TMS' : ''));

    if (oldStatus === 'L' && newStatus === 'L') summary["tetap L"]++;
    if (oldStatus === 'MS' && newStatus === 'MS') summary["tetap MS"]++;
    if (oldStatus === 'TMS' && newStatus === 'TMS') summary["tetap TMS"]++;
    
    if (oldStatus === 'L' && newStatus === 'MS') summary["L jadi MS"]++;
    if (oldStatus === 'L' && newStatus === 'TMS') summary["L jadi TMS"]++;
    
    if (oldStatus === 'MS' && newStatus === 'L') summary["MS jadi L"]++;
    if (oldStatus === 'MS' && newStatus === 'TMS') summary["MS jadi TMS"]++;
    
    if (oldStatus === 'TMS' && newStatus === 'L') summary["TMS jadi L"]++;
    if (oldStatus === 'TMS' && newStatus === 'MS') summary["TMS jadi MS"]++;
});

const outputDir = 'assets/combined/perbedaan';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'summary_perubahan_l2.json'), JSON.stringify(summary, null, 2));

console.log("Generated summary_perubahan_l2.json");
console.log(summary);
