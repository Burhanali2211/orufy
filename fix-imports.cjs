const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const appsDir = 'c:\\Users\\cristy\'s\\projects\\Money Bank\\src\\apps';

walkDir(appsDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace relative imports targeting shared folders
    // Matches: from '../contexts/...' or from '../../contexts/...'
    // Also matches components, types, utils, lib, services
    const foldersToRedirect = ['contexts', 'components', 'types', 'utils', 'lib', 'services', 'config'];
    
    foldersToRedirect.forEach(folder => {
      // RegEx matches: import { ... } from '../folder/...'
      const regex1 = new RegExp(`from\\s+['"](?:\\.\\.\\/)+${folder}\\/(.*?)['"]`, 'g');
      content = content.replace(regex1, `from '@/shared/${folder}/$1'`);

      // Special case for exact match: import { ... } from '../types'
      const regex2 = new RegExp(`from\\s+['"](?:\\.\\.\\/)+${folder}['"]`, 'g');
      content = content.replace(regex2, `from '@/shared/${folder}'`);
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed imports in: ${filePath}`);
    }
  }
});
