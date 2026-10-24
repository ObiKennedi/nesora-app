const sharp = require('../nesora/node_modules/sharp');
const path = require('path');
const fs = require('fs');

async function run() {
  const sourcePath = path.resolve(__dirname, '../nesora/public/icons.png');
  const imagesDir = path.resolve(__dirname, './assets/images');

  console.log('Reading source icon from:', sourcePath);
  const rawSource = fs.readFileSync(sourcePath);

  // 1. Cleanly isolate the terracotta Nesora mark across the entire original image
  const { data, info } = await sharp(rawSource)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cleaned = Buffer.from(data);
  for (let i = 0; i < cleaned.length; i += 4) {
    const r = cleaned[i];
    const g = cleaned[i + 1];
    const b = cleaned[i + 2];
    const a = cleaned[i + 3];

    // The Nesora mark is rich terracotta: R in ~90-180, G in ~40-110, B in ~5-60.
    // Dark/black border artifacts, gray pixels, and transparent noise have r < 60 or r <= g.
    if (a < 30 || r < 60 || r <= g) {
      cleaned[i] = 0;
      cleaned[i + 1] = 0;
      cleaned[i + 2] = 0;
      cleaned[i + 3] = 0;
    }
  }

  // Auto-trim the transparent borders
  const cleanBuffer = await sharp(cleaned, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 5 })
    .png()
    .toBuffer();

  const trimmedMeta = await sharp(cleanBuffer).metadata();
  console.log('Pristine clean mark dimensions:', trimmedMeta.width, 'x', trimmedMeta.height);

  // Background color: #0f0f0f (sleek Nesora dark mode)
  const BG_COLOR = { r: 15, g: 15, b: 15, alpha: 1 };

  // 2. App Icon (1024x1024)
  // Mark centered at 640x640 within 1024x1024 canvas
  const mark1024 = await sharp(cleanBuffer)
    .resize(640, 640, { fit: 'contain', kernel: 'lanczos3' })
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: mark1024, gravity: 'center' }])
    .png()
    .toFile(path.join(imagesDir, 'icon.png'));
  console.log('Generated icon.png (1024x1024)');

  // 3. Android Adaptive Foreground (512x512, transparent, safe zone: 280px mark)
  const mark512 = await sharp(cleanBuffer)
    .resize(280, 280, { fit: 'contain', kernel: 'lanczos3' })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark512, gravity: 'center' }])
    .png()
    .toFile(path.join(imagesDir, 'android-icon-foreground.png'));
  console.log('Generated android-icon-foreground.png (512x512)');

  // 4. Android Adaptive Background (512x512 solid #0f0f0f)
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .png()
    .toFile(path.join(imagesDir, 'android-icon-background.png'));
  console.log('Generated android-icon-background.png (512x512)');

  // 5. Android Adaptive Monochrome (512x512, solid white silhouette for Material You)
  const { data: fgData, info: fgInfo } = await sharp(mark512)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const whiteData = Buffer.alloc(fgData.length);
  for (let i = 0; i < fgData.length; i += 4) {
    const alpha = fgData[i + 3];
    whiteData[i] = 255;
    whiteData[i + 1] = 255;
    whiteData[i + 2] = 255;
    whiteData[i + 3] = alpha;
  }

  const whiteMark512 = await sharp(whiteData, {
    raw: {
      width: fgInfo.width,
      height: fgInfo.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: whiteMark512, gravity: 'center' }])
    .png()
    .toFile(path.join(imagesDir, 'android-icon-monochrome.png'));
  console.log('Generated android-icon-monochrome.png (512x512)');

  // 6. Splash Icon (512x512, transparent, mark centered at 320x320)
  const splashMark = await sharp(cleanBuffer)
    .resize(320, 320, { fit: 'contain', kernel: 'lanczos3' })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: splashMark, gravity: 'center' }])
    .png()
    .toFile(path.join(imagesDir, 'splash-icon.png'));
  console.log('Generated splash-icon.png (512x512)');

  // 7. Favicon (48x48 transparent)
  await sharp(cleanBuffer)
    .resize(48, 48, { fit: 'contain', kernel: 'lanczos3' })
    .png()
    .toFile(path.join(imagesDir, 'favicon.png'));
  console.log('Generated favicon.png (48x48)');

  // 8. expo-logo.png (used by animated splash/icon in the app)
  await sharp(cleanBuffer)
    .resize(512, 512, { fit: 'contain', kernel: 'lanczos3' })
    .png()
    .toFile(path.join(imagesDir, 'expo-logo.png'));
  console.log('Generated expo-logo.png (512x512) with Nesora logo');

  console.log('All icons regenerated with pristine transparency!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
