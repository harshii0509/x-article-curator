/**
 * Generates the placeholder Open Graph image (1200x630) with Nightstand branding.
 * Run: npx tsx scripts/generate-og-image.ts
 */
import { mkdirSync } from "fs";
import { join } from "path";

const WIDTH = 1200;
const HEIGHT = 630;

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .bg { fill: #f7f2e8; }
      .ink { fill: #2c1f0e; }
      .accent { fill: none; stroke: #c9956a; stroke-width: 3; }
    </style>
  </defs>
  <rect class="bg" width="${WIDTH}" height="${HEIGHT}"/>
  <rect class="accent" x="80" y="80" width="72" height="71" rx="4"/>
  <text x="${WIDTH / 2}" y="280" text-anchor="middle" class="ink" font-family="system-ui, sans-serif" font-size="72" font-weight="600">Nightstand</text>
  <text x="${WIDTH / 2}" y="360" text-anchor="middle" class="ink" font-family="system-ui, sans-serif" font-size="28" opacity="0.85">Your reading pile, but it actually works.</text>
  <text x="${WIDTH / 2}" y="420" text-anchor="middle" class="ink" font-family="system-ui, sans-serif" font-size="22" opacity="0.6">Save articles into a quiet weekly reading list for the weekend.</text>
</svg>
`.trim();

async function main() {
  // Dynamic import so sharp is optional at runtime
  const sharp = (await import("sharp")).default;
  const publicDir = join(process.cwd(), "public");
  const outPath = join(publicDir, "og-image.png");

  mkdirSync(publicDir, { recursive: true });

  await sharp(Buffer.from(svg))
    .resize(WIDTH, HEIGHT)
    .png()
    .toFile(outPath);

  console.log("Generated", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
