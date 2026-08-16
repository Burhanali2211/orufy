import fs from 'fs';
import path from 'path';

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const originalContent = content;
      
      // Remove supabase legacyDb import
      content = content.replace(/import\s*\{\s*supabase\s*\}\s*from\s*['"]@\/shared\/lib\/legacyDb['"];?\s*\n?/g, '');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Removed supabase import from: ${fullPath}`);
      }
    }
  }
}

const adminPath = path.resolve(process.cwd(), 'src/apps/admin');
console.log(`Scanning for unused legacyDb imports in ${adminPath}...`);
processDirectory(adminPath);
console.log('Cleanup complete!');
