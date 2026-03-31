#!/usr/bin/env node
// Generates minimal valid PNG placeholder icons for the PWA manifest.
// Run: node scripts/generate-icons.cjs

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PUBLIC = path.join(__dirname, "../public");

function u32BE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

function makeCRCTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
}

const CRC_TABLE = makeCRCTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuf, data]);
  return Buffer.concat([u32BE(data.length), typeBuf, data, u32BE(crc32(crcInput))]);
}

function buildPNG(size, r, g, b) {
  // Raw image: size rows × (1 filter byte + size×3 RGB bytes)
  const rowLen = size * 3;
  const raw = Buffer.alloc(size * (1 + rowLen));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + rowLen)] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const idx = y * (1 + rowLen) + 1 + x * 3;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
    }
  }
  const compressed = zlib.deflateSync(raw);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // RGB color type
  // bytes 10-12: compression=0, filter=0, interlace=0 (already 0)
  const ihdr = pngChunk("IHDR", ihdrData);
  const idat = pngChunk("IDAT", compressed);
  const iend = pngChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// FishLog brand color: #0a1628 = rgb(10, 22, 40)
const r = 10, g = 22, b = 40;

[192, 512].forEach((size) => {
  const filename = `icon-${size}.png`;
  const dest = path.join(PUBLIC, filename);
  const png = buildPNG(size, r, g, b);
  fs.writeFileSync(dest, png);
  console.log(`Generated ${dest} (${png.length} bytes)`);
});
