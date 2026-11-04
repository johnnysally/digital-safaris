// DigitalSafaris
// Author: Davis Okoth

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'assets');

const LOGO_SOURCE = ['logo.png', 'logo.svg']
  .map((f) => path.join(ASSETS_DIR, f))
  .find((p) => fs.existsSync(p));

const SPLASH_SOURCE = ['Splash-Proposed.jpg', 'Splash-Proposed.png']
  .map((f) => path.join(ASSETS_DIR, f))
  .find((p) => fs.existsSync(p));

if (!LOGO_SOURCE) {
  console.error('Missing assets/logo.png');
  process.exit(1);
}

if (!SPLASH_SOURCE) {
  console.error('Missing assets/Splash-Proposed.jpg');
  process.exit(1);
}

const BRAND_HEX = '#2A1C12';
const BRAND_RGB = { r: 42, g: 28, b: 18, alpha: 1 };

const icons = [
  { size: 1024, name: 'icon.png',              bg: 'transparent', pad: 0.10 },
  { size: 1024, name: 'adaptive-icon.png',     bg: BRAND_HEX,     pad: 0.20 },
  { size: 1024, name: 'splash-icon.png',       bg: BRAND_HEX,     pad: 0.28 },
  { size:  512, name: 'favicon.png',           bg: 'transparent', pad: 0.06 },
  { size:  180, name: 'icon-180.png',          bg: 'transparent', pad: 0.10 },
  { size:  120, name: 'icon-120.png',          bg: 'transparent', pad: 0.10 },
  { size:   76, name: 'icon-76.png',           bg: 'transparent', pad: 0.10 },
  { size:  512, name: 'adaptive-icon-512.png', bg: BRAND_HEX,     pad: 0.20 },
  { size:  192, name: 'android-icon-192.png',  bg: 'transparent', pad: 0.10 },
  { size:  144, name: 'android-icon-144.png',  bg: 'transparent', pad: 0.10 },
  { size:   96, name: 'android-icon-96.png',   bg: 'transparent', pad: 0.10 },
  { size:   72, name: 'android-icon-72.png',   bg: 'transparent', pad: 0.10 },
  { size:   48, name: 'android-icon-48.png',   bg: 'transparent', pad: 0.10 },
  { size:  512, name: 'favicon-512.png',       bg: 'transparent', pad: 0.06 },
  { size:  384, name: 'favicon-384.png',       bg: 'transparent', pad: 0.06 },
  { size:  256, name: 'favicon-256.png',       bg: 'transparent', pad: 0.06 },
  { size:  128, name: 'favicon-128.png',       bg: 'transparent', pad: 0.06 },
  { size:   64, name: 'favicon-64.png',        bg: 'transparent', pad: 0.06 },
  { size:   32, name: 'favicon-32.png',        bg: 'transparent', pad: 0.06 },
  { size:   16, name: 'favicon-16.png',        bg: 'transparent', pad: 0.06 },
];

const splashes = [
  { w: 2048, h: 2048, name: 'splash-square.png',   fit: 'contain' },
  { w: 2048, h: 2048, name: 'splash-2048.png',     fit: 'contain' },
  { w: 2732, h: 2732, name: 'splash-2732.png',     fit: 'contain' },
  { w: 1242, h: 2688, name: 'splash-portrait.png', fit: 'cover' },
  { w: 1242, h: 2208, name: 'splash-1242x2208.png', fit: 'cover' },
  { w: 1080, h: 1920, name: 'splash-1080x1920.png', fit: 'cover' },
];

async function renderIcon({ size, name, bg, pad }) {
  const out = path.join(ASSETS_DIR, name);
  const padPx = Math.round(size * pad);
  const innerSize = size - padPx * 2;

  const innerPng = await sharp(LOGO_SOURCE)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const bgColor = bg === 'transparent'
    ? { r: 0, g: 0, b: 0, alpha: 0 }
    : { ...BRAND_RGB };

  await sharp({
    create: { width: size, height: size, channels: 4, background: bgColor },
  })
    .composite([{ input: innerPng, top: padPx, left: padPx }])
    .png({ compressionLevel: 9 })
    .toFile(out);

  console.log(`${name.padEnd(26)} ${size}x${size}`);
}

async function renderSplash({ w, h, name, fit }) {
  const out = path.join(ASSETS_DIR, name);

  await sharp(SPLASH_SOURCE)
    .resize(w, h, {
      fit,
      background: BRAND_RGB,
      position: 'center',
    })
    .png({ compressionLevel: 9 })
    .toFile(out);

  console.log(`${name.padEnd(26)} ${w}x${h} (${fit})`);
}

async function main() {
  for (const spec of icons) await renderIcon(spec);
  for (const spec of splashes) await renderSplash(spec);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});