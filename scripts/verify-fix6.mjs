import fs from 'node:fs';

const html = fs.readFileSync('dist/contact/index.html', 'utf8');
const match = html.match(/<p class="setup-banner[\s\S]*?<\/p>/);
console.log('--- CONTACT BANNER IN DIST/CONTACT/INDEX.HTML ---');
console.log(match ? match[0] : 'NOT FOUND');
