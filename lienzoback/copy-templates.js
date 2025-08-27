const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src', 'modules', 'notifications', 'templates');
const destDir = path.join(process.cwd(), 'dist', 'src', 'modules', 'notifications', 'templates');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

(function main() {
  if (!fs.existsSync(srcDir)) {
    console.warn([copy - templates] No se encontró la carpeta de templates: ${ srcDir });
    process.exit(0);
  }

  copyDir(srcDir, destDir);

  const files = fs.readdirSync(destDir);
  console.log([copy - templates] Copiados a ${ destDir }:, files);
})();
