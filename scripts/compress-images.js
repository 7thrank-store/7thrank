/**
 * 7th Rank — Image Compression Script
 * - Re-compresses JPEGs over 200KB to quality 82 in-place.
 * - Re-compresses CLO viewer PNGs (0.png) to quality 85 in-place.
 * Run: node scripts/compress-images.js
 */

const sharp  = require('sharp');
const fs     = require('fs');
const path   = require('path');

const IMAGE_DIR    = path.join(__dirname, '../website/images');
const JPEG_MIN_KB  = 200;
const JPEG_QUALITY = 82;
const PNG_QUALITY  = 85;  // CLO resource PNGs avg ~937KB — target ~150-200KB

function walk(dir, results = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full, results);
    } else if (/\.(jpe?g)$/i.test(name)) {
      results.push({ file: full, type: 'jpeg' });
    } else if (name === '0.png') {
      results.push({ file: full, type: 'png' });
    }
  }
  return results;
}

async function main() {
  const all   = walk(IMAGE_DIR);
  const jpegs = all.filter(f => f.type === 'jpeg' && fs.statSync(f.file).size > JPEG_MIN_KB * 1024);
  const pngs  = all.filter(f => f.type === 'png');

  console.log(`Found ${jpegs.length} JPEGs over ${JPEG_MIN_KB}KB and ${pngs.length} CLO PNGs to compress\n`);

  let savedTotal = 0;

  for (const { file, type } of [...jpegs, ...pngs]) {
    const before = fs.statSync(file).size;
    const tmp    = file + '.tmp';

    try {
      if (type === 'jpeg') {
        await sharp(file).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(tmp);
      } else {
        await sharp(file).png({ quality: PNG_QUALITY, compressionLevel: 9 }).toFile(tmp);
      }

      const after = fs.statSync(tmp).size;

      if (after < before) {
        fs.renameSync(tmp, file);
        const saved = before - after;
        savedTotal += saved;
        console.log(`  ✓  ${path.relative(IMAGE_DIR, file).padEnd(60)} ${kb(before)} → ${kb(after)}  (-${kb(saved)})`);
      } else {
        fs.unlinkSync(tmp);
        console.log(`  –  ${path.relative(IMAGE_DIR, file).padEnd(60)} ${kb(before)} (already optimal)`);
      }
    } catch (err) {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      console.error(`  ✗  ${file}: ${err.message}`);
    }
  }

  console.log(`\nDone. Total saved: ${(savedTotal / 1048576).toFixed(2)} MB`);
}

function kb(bytes) { return (bytes / 1024).toFixed(1) + 'KB'; }

main().catch(err => { console.error(err); process.exit(1); });
