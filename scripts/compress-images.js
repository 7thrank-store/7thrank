/**
 * 7th Rank — Image Compression Script
 * Re-compresses JPEGs over 200KB to quality 82 in-place.
 * Run: node scripts/compress-images.js
 */

const sharp  = require('sharp');
const fs     = require('fs');
const path   = require('path');

const IMAGE_DIR  = path.join(__dirname, '../website/images');
const TARGET_KB  = 200;
const QUALITY    = 82;

function walk(dir, results = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full, results);
    } else if (/\.(jpe?g)$/i.test(name)) {
      results.push(full);
    }
  }
  return results;
}

async function main() {
  const files = walk(IMAGE_DIR);
  const over  = files.filter(f => fs.statSync(f).size > TARGET_KB * 1024);

  console.log(`Found ${files.length} JPEGs — ${over.length} exceed ${TARGET_KB}KB\n`);

  let savedTotal = 0;

  for (const file of over) {
    const before = fs.statSync(file).size;
    const tmp    = file + '.tmp';

    try {
      await sharp(file)
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(tmp);

      const after = fs.statSync(tmp).size;

      // Only replace if the result is actually smaller
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
