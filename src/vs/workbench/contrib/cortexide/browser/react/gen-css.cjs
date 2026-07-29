const fs = require('fs');
const path = require('path');
const cssPath = path.join(__dirname, 'src2', 'styles.css');
const outPath = path.join(__dirname, 'src2', 'util', 'cortexideStyles.ts');
const css = fs.readFileSync(cssPath, 'utf8');
const escaped = JSON.stringify(css);
fs.writeFileSync(outPath, 'export const cortexideStyles = ' + escaped + ';\n', 'utf8');
console.log('Created cortexideStyles.ts:', fs.statSync(outPath).size, 'bytes');
