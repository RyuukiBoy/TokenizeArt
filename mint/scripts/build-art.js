const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("../../deployment/node_modules/sharp");

const assetDirectory = path.resolve(__dirname, "../assets");
const svgPath = path.join(assetDirectory, "neon-eagle.svg");
const pngPath = path.join(assetDirectory, "neon-eagle.png");
const websitePublicDirectory = path.resolve(__dirname, "../website/public");
const websitePngPath = path.join(websitePublicDirectory, "neon-eagle.png");

// The number is drawn from paths and polygons so its shape is independent of fonts.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-labelledby="title description">
  <title id="title">42 Neon Eagle</title>
  <desc id="description">An angular neon eagle crest surrounding a large, clearly drawn 42.</desc>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#071126"/><stop offset="0.52" stop-color="#101a38"/><stop offset="1" stop-color="#170d2f"/>
    </linearGradient>
    <linearGradient id="wing" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#44f2e4"/><stop offset="0.55" stop-color="#528dff"/><stop offset="1" stop-color="#9b55ff"/>
    </linearGradient>
    <linearGradient id="wingRight" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe17a"/><stop offset="0.48" stop-color="#ff7f72"/><stop offset="1" stop-color="#bd58ff"/>
    </linearGradient>
    <linearGradient id="number" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d8f7ff"/>
    </linearGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="#644fff" stop-opacity=".42"/><stop offset="1" stop-color="#644fff" stop-opacity="0"/></radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#background)"/>
  <circle cx="512" cy="505" r="440" fill="url(#halo)"/>
  <circle cx="512" cy="512" r="438" fill="none" stroke="#70e8ff" stroke-opacity=".25" stroke-width="2"/>
  <circle cx="512" cy="512" r="412" fill="none" stroke="#a77bff" stroke-opacity=".2" stroke-width="2" stroke-dasharray="3 16"/>
  <path d="M512 74 535 112 579 100 583 145 628 151 617 194 658 213 635 250 670 278 638 307 666 344 628 365 648 407 605 419 615 464 571 467 570 512 526 504 512 548 488 504 444 512 443 467 399 464 409 419 366 407 386 365 348 344 376 307 344 278 379 250 356 213 397 194 386 151 431 145 435 100 479 112Z" fill="#19264b" stroke="#5266ab" stroke-width="2"/>
  <!-- Layered, mirrored wings form the eagle silhouette. -->
  <g stroke="#9cefff" stroke-opacity=".72" stroke-width="3" stroke-linejoin="round">
    <path d="M483 330 393 235 110 170 263 300 105 272 260 385 141 385 292 465 380 430Z" fill="url(#wing)"/>
    <path d="M541 330 631 235 914 170 761 300 919 272 764 385 883 385 732 465 644 430Z" fill="url(#wingRight)"/>
    <path d="m371 288-186-77 158 126-137-27 150 83-117-2 142 61Z" fill="#d7fff9" fill-opacity=".22"/>
    <path d="m653 288 186-77-158 126 137-27-150 83 117-2-142 61Z" fill="#fff4dc" fill-opacity=".2"/>
  </g>
  <!-- Head and beak sit above the numerals like a compact crest. -->
  <g transform="translate(0 -80)">
  <path d="M512 262 572 321 549 372 512 396 475 372 452 321Z" fill="#e8f8ff" stroke="#76e9ff" stroke-width="4"/>
  <path d="m475 372 37 24 37-24-15 51-22 26-22-26Z" fill="#334c89" stroke="#9b8bff" stroke-width="3"/>
  <path d="m475 372-71 28 55 19 53-23m37-24 71 28-55 19-53-23" fill="#ffcb65" stroke="#fff0af" stroke-width="3" stroke-linejoin="round"/>
  <path d="M484 333 509 344 493 358Z M540 333 515 344 531 358Z" fill="#101933"/>
  <circle cx="490" cy="343" r="4" fill="#5af5eb"/><circle cx="534" cy="343" r="4" fill="#ff9c81"/>
  </g>
  <path d="M397 465 347 523 404 507 M627 465 677 523 620 507" fill="none" stroke="#e5d9ff" stroke-opacity=".6" stroke-width="5"/>
  <!-- Large, legible 42 built from stroked vector paths, with a dark keyline. -->
  <g fill="none" stroke-linecap="square" stroke-linejoin="miter">
    <path d="M284 443V374L430 583V706 M253 583H453" stroke="#071126" stroke-width="72"/>
    <path d="M548 420Q568 374 629 374Q696 374 696 432Q696 466 662 500L542 621H702" stroke="#071126" stroke-width="72"/>
    <path d="M284 443V374L430 583V706 M253 583H453" stroke="#59f3ec" stroke-width="56" filter="url(#glow)"/>
    <path d="M548 420Q568 374 629 374Q696 374 696 432Q696 466 662 500L542 621H702" stroke="#b98aff" stroke-width="56" filter="url(#glow)"/>
    <path d="M284 443V374L430 583V706 M253 583H453" stroke="url(#number)" stroke-width="42"/>
    <path d="M548 420Q568 374 629 374Q696 374 696 432Q696 466 662 500L542 621H702" stroke="url(#number)" stroke-width="42"/>
  </g>
  <path d="M326 744h372" stroke="#8aa7ff" stroke-opacity=".55" stroke-width="3"/>
  <path d="m478 778 34-20 34 20-34 20Z" fill="#58f2e8"/>
  <circle cx="182" cy="512" r="5" fill="#e5ffff"/><circle cx="842" cy="512" r="5" fill="#fff1d5"/>
  <circle cx="232" cy="704" r="3" fill="#86a7ff"/><circle cx="792" cy="704" r="3" fill="#d796ff"/>
</svg>`;

async function main() {
  await fs.mkdir(assetDirectory, { recursive: true });
  await fs.writeFile(svgPath, svg, "utf8");
  await sharp(Buffer.from(svg)).resize(1024, 1024).png({ compressionLevel: 9 }).toFile(pngPath);
  await fs.mkdir(websitePublicDirectory, { recursive: true });
  await fs.copyFile(pngPath, websitePngPath);
  console.log(`Created ${path.relative(process.cwd(), svgPath)}`);
  console.log(`Created ${path.relative(process.cwd(), pngPath)} (1024 × 1024 PNG)`);
  console.log(`Copied website preview to ${path.relative(process.cwd(), websitePngPath)}`);
}

main().catch((error) => {
  console.error("Artwork build failed:", error.message);
  process.exitCode = 1;
});
