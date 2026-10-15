/**
 * Generates the PWA icons.
 *
 * Deliberately dependency-free: a tiny PNG encoder (zlib + CRC32) rasterises
 * the Bondhu mark — a ring of four friends around a shared circle — at every
 * size the manifest needs. Run with:
 *
 *   node scripts/generate-icons.mjs
 *
 * Output: public/icons/*.png plus public/apple-icon.png
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT_DIR = join(ROOT, "public", "icons");

/** App accent (soft teal) — keep in sync with `--primary` in app/globals.css. */
const TEAL = [15, 118, 110];
const WHITE = [255, 255, 255];

// ---------------------------------------------------------------- PNG encoder
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// -------------------------------------------------------------------- drawing
/** Signed distance to a rounded square centred on the canvas. */
function roundedSquareDistance(x, y, size, radius) {
  const dx = Math.abs(x - size / 2) - (size / 2 - radius);
  const dy = Math.abs(y - size / 2) - (size / 2 - radius);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  return outside + Math.min(Math.max(dx, dy), 0) - radius;
}

/** The mark: a ring plus four dots arranged like a small circle of friends. */
function markAlpha(x, y, size, scale) {
  const c = size / 2;
  const dx = x - c;
  const dy = y - c;
  const dist = Math.hypot(dx, dy);

  const ringRadius = 0.3 * size * scale;
  const ringHalfWidth = 0.018 * size * scale;
  const ring = ringHalfWidth - Math.abs(dist - ringRadius);

  const dotRadius = 0.088 * size * scale;
  const dotOffset = 0.3 * size * scale;
  let dots = -Infinity;
  for (const angle of [0.5 * Math.PI, Math.PI, 1.5 * Math.PI, 0]) {
    const px = Math.cos(angle) * dotOffset;
    const py = Math.sin(angle) * dotOffset;
    dots = Math.max(dots, dotRadius - Math.hypot(dx - px, dy - py));
  }

  return Math.max(ring, dots);
}

/**
 * Rasterises one icon. `padding` (0–1) shrinks the mark inside the canvas so
 * maskable icons keep everything within the platform's safe zone.
 */
function drawIcon(size, { padding = 0, square = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const cornerRadius = square ? 0 : size * 0.22;
  const scale = 1 - padding;
  const samples = 3;
  const step = 1 / samples;
  const offset = step / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let background = 0;
      let mark = 0;

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + sx * step + offset;
          const py = y + sy * step + offset;
          if (roundedSquareDistance(px, py, size, cornerRadius) <= 0) background += 1;
          if (markAlpha(px, py, size, scale) > 0) mark += 1;
        }
      }

      const total = samples * samples;
      const bg = background / total;
      const fg = Math.min(mark / total, bg);
      const index = (y * size + x) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        rgba[index + channel] = Math.round(TEAL[channel] * (1 - fg) + WHITE[channel] * fg);
      }
      rgba[index + 3] = Math.round(bg * 255);
    }
  }

  return encodePng(size, size, rgba);
}

// ---------------------------------------------------------------------- write
mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  ["icon-192.png", 192, {}],
  ["icon-512.png", 512, {}],
  ["maskable-512.png", 512, { padding: 0.38, square: true }],
];
for (const [name, size, options] of targets) {
  const file = join(OUT_DIR, name);
  writeFileSync(file, drawIcon(size, options));
  console.log(`wrote public/icons/${name} (${size}×${size})`);
}

const apple = join(ROOT, "public", "apple-icon.png");
writeFileSync(apple, drawIcon(180, { padding: 0.1 }));
console.log("wrote public/apple-icon.png (180×180)");
