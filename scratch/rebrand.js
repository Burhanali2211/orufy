
const fs = require('fs');
const path = require('path');

const replacements = [
  [/himalayanspicesexports\.com/gi, 'orufy.com'],
  [/Himalayan Spices Exports/gi, 'Orufy'],
  [/himalayanspices/gi, 'orufy'],
  [/himalayan_spice/gi, 'orufy'],
  [/ShopLaunch/gi, 'Orufy'],
  [/yourdomain\.com/gi, 'orufy.com'],
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        processDirectory(fullPath);
      }
    } else {
      const ext = path.extname(fullPath);
      if (['.html', '.json', '.ts', '.tsx', '.css', '.txt', '.md'].includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let changed = false;
        for (const [regex, replacement] of replacements) {
          if (regex.test(content)) {
            content = content.replace(regex, replacement);
            changed = true;
          }
        }
        if (changed) {
          fs.writeFileSync(fullPath, content);
          console.log(`Updated: ${fullPath}`);
        }
      }
    }
  }
}

processDirectory('./apps/web');
processDirectory('./apps/api');
processDirectory('./db');
