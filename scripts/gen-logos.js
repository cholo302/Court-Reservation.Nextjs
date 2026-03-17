const sharp = require('sharp');

async function createLogos() {
  const inputFile = 'public/olopsc.jpg';
  
  // Read original and resize to a square (use the smaller dimension)
  const meta = await sharp(inputFile).metadata();
  const size = Math.min(meta.width, meta.height);

  // 1. Create the main logo (used everywhere on the site)
  // Yellow background circle + logo with multiply blend to remove white
  const logoSize = 400;
  const border = 12; // yellow ring thickness
  const innerSize = logoSize - (border * 2);

  // Yellow background
  const yellowBg = await sharp({
    create: { width: logoSize, height: logoSize, channels: 4, background: { r: 255, g: 223, b: 86, alpha: 1 } }
  }).png().toBuffer();

  // Outer circle mask
  const outerMask = Buffer.from(
    `<svg width="${logoSize}" height="${logoSize}"><circle cx="${logoSize/2}" cy="${logoSize/2}" r="${logoSize/2}" fill="white"/></svg>`
  );

  // Inner circle mask for the logo
  const innerMask = Buffer.from(
    `<svg width="${innerSize}" height="${innerSize}"><circle cx="${innerSize/2}" cy="${innerSize/2}" r="${innerSize/2}" fill="white"/></svg>`
  );

  // Resize logo to inner size
  const logoResized = await sharp(inputFile)
    .resize(innerSize, innerSize, { fit: 'cover' })
    .png()
    .toBuffer();

  // Apply circular mask to logo (white interior preserved)
  const circularLogo = await sharp(logoResized)
    .composite([{ input: innerMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Apply outer circle mask to yellow background
  const yellowCircle = await sharp(yellowBg)
    .composite([{ input: outerMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Composite: yellow circle + logo centered
  await sharp(yellowCircle)
    .composite([{ input: circularLogo, left: border, top: border }])
    .png()
    .toFile('public/olopsc-logo.png');

  console.log('Created public/olopsc-logo.png (400x400)');

  // 2. Create favicon (smaller version)
  const favSize = 180;
  const favBorder = 6;
  const favInner = favSize - (favBorder * 2);

  const favYellowBg = await sharp({
    create: { width: favSize, height: favSize, channels: 4, background: { r: 255, g: 223, b: 86, alpha: 1 } }
  }).png().toBuffer();

  const favOuterMask = Buffer.from(
    `<svg width="${favSize}" height="${favSize}"><circle cx="${favSize/2}" cy="${favSize/2}" r="${favSize/2}" fill="white"/></svg>`
  );

  const favInnerMask = Buffer.from(
    `<svg width="${favInner}" height="${favInner}"><circle cx="${favInner/2}" cy="${favInner/2}" r="${favInner/2}" fill="white"/></svg>`
  );

  const favLogo = await sharp(inputFile)
    .resize(favInner, favInner, { fit: 'cover' })
    .png()
    .toBuffer();

  const favCircularLogo = await sharp(favLogo)
    .composite([{ input: favInnerMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const favYellowCircle = await sharp(favYellowBg)
    .composite([{ input: favOuterMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  await sharp(favYellowCircle)
    .composite([{ input: favCircularLogo, left: favBorder, top: favBorder }])
    .png()
    .toFile('public/favicon.png');

  console.log('Created public/favicon.png (180x180)');
}

createLogos().catch(e => console.error(e));
