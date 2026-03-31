// Simple script to generate placeholder PNG icons for the PWA manifest.
// Usage: node scripts/generate-icons.mjs
// Requires: nothing extra — uses pure Node.js Buffer to write minimal valid PNGs.

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "../public");

/**
 * Creates a minimal valid PNG buffer for a solid-color square.
 * Uses a simple approach: 1x1 PNG scaled to NxN via image-data trick.
 * For a proper placeholder we embed a valid PNG header + IDAT chunk.
 */
function createSolidPNG(size, r, g, b) {
  // Build raw image data: size * size pixels, RGBA
  const rowLen = size * 3; // RGB
  const filterBytes = new Uint8Array(size * (1 + rowLen)); // 1 filter byte per row
  for (let y = 0; y < size; y++) {
    filterBytes[y * (1 + rowLen)] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      const idx = y * (1 + rowLen) + 1 + x * 3;
      filterBytes[idx] = r;
      filterBytes[idx + 1] = g;
      filterBytes[idx + 2] = b;
    }
  }

  // zlib deflate of filterBytes — use Node's zlib
  const zlib = await import("zlib");
  const compressed = await new Promise((res, rej) => {
    zlib.default.deflate(filterBytes, (err, buf) => (err ? rej(err) : res(buf)));
  });
  return buildPNG(size, size, compressed);
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const crcBuf = Buffer.concat([typeBytes, data]);
  const crc = crc32(crcBuf);
  return Buffer.concat([u32(data.length), typeBytes, data, u32(crc)]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  const table = makeCRCTable();
  for (const byte of buf) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let _crcTable;
function makeCRCTable() {
  if (_crcTable) return _crcTable;
  _crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    _crcTable[n] = c;
  }
  return _crcTable;
}

function buildPNG(w, h, idatData) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk("IHDR", ihdrData);
  const idat = chunk("IDAT", idatData);
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Main
import zlib from "zlib";
import { promisify } from "util";
const deflate = promisify(zlib.deflate);

async function generate(size, filename) {
  // Dark navy background (#0a1628) = rgb(10, 22, 40)
  const r = 10, g = 22, b = 40;
  const rowLen = size * 3;
  const raw = Buffer.alloc(size * (1 + rowLen));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + rowLen)] = 0;
    for (let x = 0; x < size; x++) {
      const idx = y * (1 + rowLen) + 1 + x * 3;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
    }
  }
  const compressed = await deflate(raw);
  const png = buildPNG(size, size, compressed);
  const dest = join(PUBLIC, filename);
  writeFileSync(dest, png);
  console.log(`Generated ${dest} (${png.length} bytes)`);
}

await generate(192, "icon-192.png");
await generate(512, "icon-512.png");
