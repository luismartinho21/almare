const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const htmlPath = path.join(distDir, 'index.html');

// Find the latest JS bundle in dist/_expo/static/js/web/
const jsDir = path.join(distDir, '_expo/static/js/web');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
if (jsFiles.length === 0) {
  throw new Error('No JS bundle found in ' + jsDir);
}
const jsPath = path.join(jsDir, jsFiles[0]);

let html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// Replace external script tag with inline script
html = html.replace(/<script src="[^"]+" defer><\/script>/, '<script>' + js.replace(/<\/script>/g, '<\\/script>') + '</script>');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Inlined bundle ' + jsFiles[0] + ' successfully. HTML size: ' + html.length);
