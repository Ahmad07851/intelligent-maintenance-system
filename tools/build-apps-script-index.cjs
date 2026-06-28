const fs = require('fs');
const path = require('path');

const distIndex = path.join('dist', 'index.html');
const assetsDir = path.join('dist', 'assets');
const outputFile = path.join('backend', 'Index.html');

if (!fs.existsSync(distIndex)) {
  throw new Error('dist/index.html not found. Run npm run build first.');
}

let html = fs.readFileSync(distIndex, 'utf8');

html = html.replace(
  /<script[^>]+src="\/assets\/([^"]+\.js)"[^>]*><\/script>/g,
  (_, file) => {
    const js = fs.readFileSync(path.join(assetsDir, file), 'utf8')
      .replace(/<\/script>/gi, '<\\/script>');
    return `<script>${js}</script>`;
  }
);

html = html.replace(
  /<link[^>]+href="\/assets\/([^"]+\.css)"[^>]*>/g,
  (_, file) => {
    const css = fs.readFileSync(path.join(assetsDir, file), 'utf8');
    return `<style>${css}</style>`;
  }
);

if (!html.includes('<base target="_top">')) {
  html = html.replace('<head>', '<head>\n    <base target="_top">');
}

fs.writeFileSync(outputFile, html);
console.log(`Created ${outputFile} (${fs.statSync(outputFile).size} bytes)`);
