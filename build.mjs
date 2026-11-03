// Concatenates src/js/*.js into the module script of src/shell.html -> index.html
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const dir = new URL('./src/js/', import.meta.url);
const js = readdirSync(dir).filter(f => f.endsWith('.js')).sort().map(f => `// ---- ${f}\n` + readFileSync(new URL(f, dir), 'utf8')).join('\n');
const shell = readFileSync(new URL('./src/shell.html', import.meta.url), 'utf8');
const out = shell.replace('/*__GAME_JS__*/', () => js);
writeFileSync(new URL('./index.html', import.meta.url), out);
console.log(`index.html written: ${(out.length / 1024).toFixed(1)} KB`);
