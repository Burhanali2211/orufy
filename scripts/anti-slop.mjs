import fs from 'fs';
import path from 'path';

const SLOP_MAPPINGS = [
  // Blues
  { regex: /text-\[#1a73e8\]/g, replacement: 'text-blue-600' },
  { regex: /bg-\[#1a73e8\]/g, replacement: 'bg-blue-600' },
  { regex: /bg-\[#1557b0\]/g, replacement: 'bg-blue-700' },
  { regex: /bg-\[#e8f0fe\]/g, replacement: 'bg-blue-50' },
  { regex: /border-\[#1a73e8\]/g, replacement: 'border-blue-600' },
  { regex: /border-\[#d2e3fc\]/g, replacement: 'border-blue-100' },
  { regex: /ring-\[#e8f0fe\]/g, replacement: 'ring-blue-100' },

  // Grays/Whites
  { regex: /bg-\[#f8f9fa\]/g, replacement: 'bg-gray-50' },
  { regex: /bg-\[#f1f3f4\]/g, replacement: 'bg-gray-100' },
  { regex: /border-\[#e8eaed\]/g, replacement: 'border-gray-200' },
  { regex: /border-\[#dadce0\]/g, replacement: 'border-gray-300' },
  { regex: /text-\[#5f6368\]/g, replacement: 'text-gray-600' },
  { regex: /text-\[#202124\]/g, replacement: 'text-gray-900' },
  { regex: /text-\[#9aa0a6\]/g, replacement: 'text-gray-400' },
  { regex: /text-\[#dadce0\]/g, replacement: 'text-gray-300' },
  { regex: /placeholder-\[#5f6368\]/g, replacement: 'placeholder-gray-500' },

  // Greens
  { regex: /text-\[#137333\]/g, replacement: 'text-green-700' },
  { regex: /bg-\[#e6f4ea\]/g, replacement: 'bg-green-50' },
  { regex: /border-\[#ceead6\]/g, replacement: 'border-green-200' },

  // Reds
  { regex: /text-\[#d93025\]/g, replacement: 'text-red-600' },
  { regex: /bg-\[#fce8e6\]/g, replacement: 'bg-red-50' },

  // Yellows/Oranges
  { regex: /text-\[#f29900\]/g, replacement: 'text-yellow-600' },
  { regex: /bg-\[#fef7e0\]/g, replacement: 'bg-yellow-50' },

  // Purples
  { regex: /text-\[#a142f4\]/g, replacement: 'text-purple-600' },
  { regex: /bg-\[#f3e8fd\]/g, replacement: 'bg-purple-50' },
  { regex: /border-\[#e9d2fd\]/g, replacement: 'border-purple-200' },

  // Sizing
  { regex: /rounded-\[24px\]/g, replacement: 'rounded-2xl' },
  { regex: /rounded-\[32px\]/g, replacement: 'rounded-3xl' },
  { regex: /text-\[13px\]/g, replacement: 'text-sm' },
  { regex: /text-\[14px\]/g, replacement: 'text-sm' },
  { regex: /text-\[15px\]/g, replacement: 'text-base' },
  { regex: /text-\[16px\]/g, replacement: 'text-base' },
  { regex: /min-h-\[40px\]/g, replacement: 'min-h-10' },
  { regex: /min-w-\[40px\]/g, replacement: 'min-w-10' },
  { regex: /min-h-\[44px\]/g, replacement: 'min-h-11' },
  { regex: /h-\[600px\]/g, replacement: 'h-[36rem]' },
  
  // Inline styles removal (Google Sans)
  { regex: / style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}/g, replacement: '' },
  { regex: / style={{ fontFamily: '"Google Sans", Inter, sans-serif' }}/g, replacement: '' },
];

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      for (const mapping of SLOP_MAPPINGS) {
        content = content.replace(mapping.regex, mapping.replacement);
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Cleaned up: ${fullPath}`);
      }
    }
  }
}

const adminPath = path.resolve(process.cwd(), 'src/apps/admin');
console.log(`Scanning for AI slop in ${adminPath}...`);
processDirectory(adminPath);
console.log('Cleanup complete!');
