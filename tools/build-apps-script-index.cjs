const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(process.cwd());
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(distDir, 'assets');
const distIndex = path.join(distDir, 'index.html');
const outputFile = path.join(rootDir, 'backend', 'Index.html');

function fail(message) {
  throw new Error(message);
}

if (!fs.existsSync(distIndex)) {
  fail('dist/index.html not found. Run npm run build first.');
}

let html = fs.readFileSync(distIndex, 'utf8');

const jsAssetRegex = /<script\b[^>]*\bsrc="\/assets\/([^\"]+\.js)"[^>]*><\/script>/g;
const cssAssetRegex = /<link\b[^>]*\bhref="\/assets\/([^\"]+\.css)"[^>]*>/g;

const jsAssets = [...html.matchAll(jsAssetRegex)];
const cssAssets = [...html.matchAll(cssAssetRegex)];

jsAssets.forEach((match) => {
  const assetName = match[1];
  const assetPath = path.join(assetsDir, assetName);
  if (!fs.existsSync(assetPath)) {
    fail(`Missing JS asset: ${assetPath}`);
  }

  const source = fs.readFileSync(assetPath, 'utf8')
    .replace(/<\/script>/gi, '<\\/script>');

  html = html.replace(match[0], `<script>${source}</script>`);
});

cssAssets.forEach((match) => {
  const assetName = match[1];
  const assetPath = path.join(assetsDir, assetName);
  if (!fs.existsSync(assetPath)) {
    fail(`Missing CSS asset: ${assetPath}`);
  }

  const source = fs.readFileSync(assetPath, 'utf8');
  html = html.replace(match[0], `<style>${source}</style>`);
});

if (!html.includes('<base target="_top">')) {
  if (!html.includes('<head>')) {
    fail('Unable to inject <base target="_top"> because <head> was not found in dist/index.html');
  }
  html = html.replace('<head>', '<head>\n    <base target="_top">');
}

const sanitizedHtml = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '');

if (/<(?:script|link)\b[^>]*(?:src|href)="\/assets\//.test(sanitizedHtml)) {
  fail('Generated backend/Index.html still contains /assets/ references in HTML tags. Ensure all dist assets are inlined.');
}

fs.writeFileSync(outputFile, html, 'utf8');
console.log(`Created ${outputFile} (${Buffer.byteLength(html, 'utf8')} bytes)`);
