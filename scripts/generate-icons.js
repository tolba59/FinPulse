import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPNG(width, height, drawFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with scanline filter byte (0)
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawBrandIcon(x, y, w, h, isMaskable = false) {
  // Center coordinates normalized -1 to 1
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background gradient: dark navy/slate (#090D16 to #121A2F)
  const bgGrad = (y / h);
  let r = Math.round(9 + bgGrad * 9);
  let g = Math.round(13 + bgGrad * 13);
  let b = Math.round(22 + bgGrad * 25);
  let a = 255;

  const scale = isMaskable ? 0.7 : 0.85;
  const sx = nx / scale;
  const sy = ny / scale;

  // Chart line: curve from left to right
  // y roughly at 0.3 on left, 0.4 in mid, -0.4 on right
  const targetY = -0.5 * sx + 0.1 * Math.sin(sx * 3);
  const distToLine = Math.abs(sy - targetY);

  if (sx >= -0.8 && sx <= 0.8 && distToLine < 0.08) {
    // Emerald green line (#10B981)
    const factor = Math.max(0, 1 - distToLine / 0.08);
    r = Math.round(r * (1 - factor) + 16 * factor);
    g = Math.round(g * (1 - factor) + 185 * factor);
    b = Math.round(b * (1 - factor) + 129 * factor);
  } else if (sx >= -0.8 && sx <= 0.8 && sy > targetY && sy < 0.8) {
    // Subtle glow under curve
    const glow = Math.max(0, (0.8 - sy) * 0.15);
    r = Math.min(255, Math.round(r + 16 * glow));
    g = Math.min(255, Math.round(g + 185 * glow));
    b = Math.min(255, Math.round(b + 129 * glow));
  }

  // Peak marker on top right
  const markerDist = Math.sqrt(Math.pow(sx - 0.75, 2) + Math.pow(sy - (-0.35), 2));
  if (markerDist < 0.07) {
    r = 52;
    g = 211;
    b = 153;
  }
  if (markerDist < 0.03) {
    r = 255;
    g = 255;
    b = 255;
  }

  return [r, g, b, a];
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate 192x192
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => drawBrandIcon(x, y, w, h, false)));
// Generate 512x512
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawBrandIcon(x, y, w, h, false)));
// Generate maskable 512x512 (with safe zone margin)
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawBrandIcon(x, y, w, h, true)));
// Generate 180x180 apple-touch-icon.png
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawBrandIcon(x, y, w, h, false)));
// Generate favicon.ico / favicon
fs.writeFileSync(path.join(outDir, 'favicon.ico'), createPNG(64, 64, (x, y, w, h) => drawBrandIcon(x, y, w, h, false)));

console.log('Successfully generated all PWA icons.');
