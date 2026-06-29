#!/usr/bin/env node
// Download the app's static assets from the original Mocha CDN into public/assets/.
//
// The Mocha CDN (*.mochausercontent.com) goes away when Mocha shuts down, so run
// this ONCE from a machine that can reach it (e.g. your laptop) to pull every asset
// the app references. Files land in public/assets/<filename> and are then served by
// the Worker at /assets/<filename> (the URLs in the code were rewritten to match).
//
// Usage:
//   node scripts/download-assets.mjs
//
// Re-running is safe: existing files are skipped. The 8 internal *.md error reports
// in the manifest are intentionally NOT downloaded.

import { readFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "migration/public_asset_links.json"), "utf8"));
const outDir = join(root, "public/assets");
mkdirSync(outDir, { recursive: true });

const assets = manifest.filter((u) => !u.toLowerCase().endsWith(".md"));
console.log(`Manifest: ${manifest.length} urls — downloading ${assets.length} assets (skipping ${manifest.length - assets.length} .md reports)\n`);

let ok = 0, skipped = 0, failed = 0;
for (const url of assets) {
  const name = basename(new URL(url).pathname);
  const dest = join(outDir, name);
  if (existsSync(dest)) {
    skipped++;
    continue;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    ok++;
    console.log(`  ✓ ${name} (${buf.length} bytes)`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name} — ${err.message}`);
  }
}

console.log(`\nDone. downloaded=${ok} skipped=${skipped} failed=${failed}`);
if (failed > 0) process.exitCode = 1;
