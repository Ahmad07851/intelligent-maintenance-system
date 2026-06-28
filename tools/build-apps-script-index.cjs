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

function toBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

if (!fs.existsSync(distIndex)) fail('dist/index.html not found. Run npm run build first.');
if (!fs.existsSync(assetsDir)) fail('dist/assets folder not found.');

let html = fs.readFileSync(distIndex, 'utf8');

const jsAssets = [];
const cssAssets = [];

html = html.replace(
  /<script\b([^>]*)\bsrc=["']\/assets\/([^"']+\.js)["']([^>]*)><\/script>/gi,
  (full, beforeAttrs, file, afterAttrs) => {
    const attrs = `${beforeAttrs || ''} ${afterAttrs || ''}`;
    const isModule = /\btype=["']module["']/i.test(attrs);
    const assetPath = path.join(assetsDir, file);
    if (!fs.existsSync(assetPath)) fail(`Missing JS asset: ${assetPath}`);
    jsAssets.push({ file, b64: toBase64(assetPath), isModule });
    return '';
  }
);

html = html.replace(
  /<link\b([^>]*)\bhref=["']\/assets\/([^"']+\.css)["']([^>]*)>/gi,
  (full, beforeAttrs, file) => {
    const assetPath = path.join(assetsDir, file);
    if (!fs.existsSync(assetPath)) fail(`Missing CSS asset: ${assetPath}`);
    cssAssets.push({ file, b64: toBase64(assetPath) });
    return '';
  }
);

if (!html.includes('<base target="_top">')) {
  if (!html.includes('<head>')) fail('Cannot inject base tag: <head> not found.');
  html = html.replace('<head>', '<head>\n    <base target="_top">');
}

const cssLoaders = cssAssets.map((asset) => `
  {
    const style = document.createElement('style');
    style.setAttribute('data-asset', ${JSON.stringify(asset.file)});
    style.textContent = decodeAsset(${JSON.stringify(asset.b64)});
    document.head.appendChild(style);
  }`).join('\n');

const jsLoaders = jsAssets.map((asset) => `
  {
    const script = document.createElement('script');
    script.setAttribute('data-asset', ${JSON.stringify(asset.file)});
    ${asset.isModule ? "script.type = 'module';" : ''}
    script.textContent = decodeAsset(${JSON.stringify(asset.b64)});
    document.body.appendChild(script);
  }`).join('\n');

const loader = `
<script>
(function () {
  function decodeAsset(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

${cssLoaders}

${jsLoaders}
})();
</script>`;

if (html.includes('</body>')) {
  html = html.replace('</body>', loader + '\n  </body>');
} else {
  html += loader;
}

if (/<(?:script|link)\b[^>]*(?:src|href)=["']\/assets\//i.test(html)) {
  fail('Generated Index.html still contains unresolved /assets references.');
}

fs.writeFileSync(outputFile, html, 'utf8');
console.log(`Created ${outputFile} (${Buffer.byteLength(html, 'utf8')} bytes)`);
