import fs from 'fs';
import path from 'path';

const CHUNK_SIZE = 5000;

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function clearDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      fs.unlinkSync(path.join(dirPath, file));
    }
  } else {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function partitionDataset(type) {
  const dataPath = `./assets/${type}/sk/data.json`;
  const chunksDir = `./assets/${type}/sk/chunks`;
  const namesDir = `./assets/${type}/sk/names`;

  console.log(`\n=== Partitioning ${type.toUpperCase()} ===`);
  if (!fs.existsSync(dataPath)) {
    console.error(`Error: File ${dataPath} not found.`);
    return;
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw);
  const rows = data.rows || data;

  console.log(`Total rows: ${rows.length}`);

  // Update summary.json with totalRows
  const summaryPath = `./assets/${type}/sk/summary.json`;
  if (fs.existsSync(summaryPath)) {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    summary.totalRows = rows.length;
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`Updated ${summaryPath} with totalRows = ${rows.length}`);
  }

  // 1. Clear & Create directories
  clearDir(chunksDir);
  clearDir(namesDir);

  // 2. Save sequential chunks (5000 rows each)
  const numChunks = Math.ceil(rows.length / CHUNK_SIZE);
  console.log(`Saving ${numChunks} chunks of size ${CHUNK_SIZE}...`);
  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, rows.length);
    const chunkRows = rows.slice(start, end);
    const chunkPath = path.join(chunksDir, `chunk_${i}.json`);
    fs.writeFileSync(chunkPath, JSON.stringify(chunkRows));
  }
  console.log(`Saved chunks successfully.`);

  // 3. Save name prefix index files
  console.log('Generating name prefix index files...');
  const prefixMap = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row[3] || '';
    
    // Normalize and split by non-alphanumeric chars
    const words = name.toLowerCase().split(/[^a-z0-9]+/);
    const prefixes = new Set();
    
    for (const word of words) {
      if (word.length >= 2) {
        prefixes.add(word.slice(0, 2));
      } else if (word.length === 1) {
        prefixes.add(word);
      }
    }

    for (const pref of prefixes) {
      if (!prefixMap[pref]) {
        prefixMap[pref] = [];
      }
      prefixMap[pref].push(row);
    }
  }

  const prefixes = Object.keys(prefixMap);
  console.log(`Found ${prefixes.length} unique prefixes. Saving prefix files...`);
  
  for (const pref of prefixes) {
    const prefixPath = path.join(namesDir, `${pref}.json`);
    fs.writeFileSync(prefixPath, JSON.stringify(prefixMap[pref]));
  }
  console.log(`Saved prefix files successfully.`);
}

try {
  partitionDataset('kdkmp');
  partitionDataset('knmp');
  console.log('\nAll datasets partitioned successfully!');
} catch (e) {
  console.error('Error during partitioning:', e);
}
