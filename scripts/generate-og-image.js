#!/usr/bin/env node
/**
 * Script to generate og-image.png from og-image.svg
 * Uses Playwright to render the SVG and export as PNG
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const svgPath = join(projectRoot, 'public', 'og-image.svg');
const pngPath = join(projectRoot, 'public', 'og-image.png');

async function generateOgImage() {
  console.log('Reading SVG file...');
  const svgContent = readFileSync(svgPath, 'utf-8');

  console.log('Launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to match OG image dimensions (1200x630)
  await page.setViewportSize({ width: 1200, height: 630 });

  // Load SVG as data URL
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

  console.log('Rendering SVG...');
  await page.goto(dataUrl);
  await page.waitForTimeout(500); // Wait for any animations/rendering

  console.log('Saving as PNG...');
  const screenshot = await page.screenshot({
    path: pngPath,
    type: 'png',
    fullPage: false,
  });

  await browser.close();

  console.log(`✅ Successfully generated ${pngPath}`);
  console.log(`   Size: ${screenshot.length} bytes`);
}

generateOgImage().catch((error) => {
  console.error('❌ Error generating OG image:', error);
  process.exit(1);
});
