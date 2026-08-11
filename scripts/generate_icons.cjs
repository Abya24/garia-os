const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// Load original official Garia OS logo SVG
const svgPath = path.resolve('public/icon.svg');
const originalSvg = fs.readFileSync(svgPath, 'utf8');

// 1. Standard SVG (Full logo)
function renderPng(svgContent, targetWidth) {
  const resvg = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: targetWidth },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

// 2. Round SVG (Circular clipped logo)
const roundSvg = originalSvg.replace(
  '</defs>',
  `  <clipPath id="roundClip">
       <circle cx="256" cy="256" r="256" />
     </clipPath>
  </defs>`
).replace(
  '<!-- Background Canvas -->',
  '<g clip-path="url(#roundClip)">\n  <!-- Background Canvas -->'
).replace(
  '</svg>',
  '</g>\n</svg>'
);

// 3. Foreground SVG (Adaptive icon foreground with 72dp safe zone in 108dp canvas)
// Wrap in transparent 108dp viewBox (or 512 + padding)
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <g transform="translate(18, 18) scale(0.140625)">
    <!-- Inner emblem content without square background rect -->
    ${originalSvg
      .replace(/<\/?svg[^>]*>/g, '')
      .replace(/<rect width="512" height="512" fill="url\(#bgGrad\)" \/>/, '')}
  </g>
</svg>`;

const targets = [
  // Public PWA icons
  { path: 'public/icon-48.png', width: 48, svg: originalSvg },
  { path: 'public/icon-72.png', width: 72, svg: originalSvg },
  { path: 'public/icon-96.png', width: 96, svg: originalSvg },
  { path: 'public/icon-144.png', width: 144, svg: originalSvg },
  { path: 'public/icon-192.png', width: 192, svg: originalSvg },
  { path: 'public/icon-512.png', width: 512, svg: originalSvg },
  { path: 'public/icon.png', width: 512, svg: originalSvg },
  { path: 'public/apple-touch-icon.png', width: 180, svg: originalSvg },

  // Android mipmap icons
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png', width: 48, svg: originalSvg },
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', width: 48, svg: roundSvg },
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png', width: 108, svg: foregroundSvg },

  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png', width: 72, svg: originalSvg },
  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', width: 72, svg: roundSvg },
  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png', width: 162, svg: foregroundSvg },

  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', width: 96, svg: originalSvg },
  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', width: 96, svg: roundSvg },
  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png', width: 216, svg: foregroundSvg },

  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', width: 144, svg: originalSvg },
  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', width: 144, svg: roundSvg },
  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png', width: 324, svg: foregroundSvg },

  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', width: 192, svg: originalSvg },
  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', width: 192, svg: roundSvg },
  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png', width: 432, svg: foregroundSvg },

  { path: 'android/app/src/main/res/mipmap/ic_launcher.png', width: 512, svg: originalSvg },
  { path: 'android/app/src/main/res/mipmap/ic_launcher_round.png', width: 512, svg: roundSvg },
];

console.log(`Generating ${targets.length} binary PNG icon assets...`);

for (const target of targets) {
  const fullPath = path.resolve(target.path);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const rawBuffer = renderPng(target.svg, target.width);
  const buffer = Buffer.from(rawBuffer);
  fs.writeFileSync(fullPath, buffer);
  console.log(`Saved ${target.path} (${target.width}x${target.width}, ${buffer.length} bytes, header=${buffer.subarray(0, 8).toString('hex')})`);
}

console.log('All PNG icons generated successfully!');
