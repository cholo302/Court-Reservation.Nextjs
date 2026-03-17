const sharp = require('sharp');

async function createFavicon() {
  const size = 180;
  const border = 6;
  const innerSize = size - (border * 2);

  // Create yellow background
  const yellowBg = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 223, b: 86, alpha: 1 } }
  }).png().toBuffer();

  // Resize logo to inner size
  const logo = await sharp('public/olopsc.jpg')
    .resize(innerSize, innerSize, { fit: 'cover' })
    .png()
    .toBuffer();

  // Create circular mask for inner logo
  const innerMask = Buffer.from(
    `<svg width="${innerSize}" height="${innerSize}"><circle cx="${innerSize/2}" cy="${innerSize/2}" r="${innerSize/2}" fill="white"/></svg>`
  );

  // Apply circular mask to logo
  const circularLogo = await sharp(logo)
    .composite([{ input: innerMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Create outer circular mask
  const outerMask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
  );

  // Apply outer circle mask to yellow bg
  const yellowCircle = await sharp(yellowBg)
    .composite([{ input: outerMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Composite: yellow circle + centered logo with white interior
  await sharp(yellowCircle)
    .composite([{ input: circularLogo, left: border, top: border }])
    .png()
    .toFile('public/favicon.png');

  console.log('Created public/favicon.png with yellow ring + white interior');
}

createFavicon().catch(e => console.error(e));
