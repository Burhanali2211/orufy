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

const srcDir = 'c:\\Users\\cristy\'s\\projects\\Money Bank\\src';

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Restore Admin components imports
    content = content.replace(/@\/shared\/components\/Admin\//g, '@/apps/admin/components/Admin/');
    
    // 2. Restore Customer components imports
    content = content.replace(/@\/shared\/components\/Customer\//g, '@/apps/customer/components/Customer/');
    
    // 3. Fix Layout components (AdminHeader, CustomerDashboardLayout)
    content = content.replace(/@\/shared\/components\/Layout\/AdminHeader/g, '@/apps/admin/components/Admin/Layout/AdminHeader');
    content = content.replace(/@\/shared\/components\/Layout\/CustomerDashboardLayout/g, '@/apps/customer/components/Customer/Layout/CustomerDashboardLayout');
    
    // 4. Fix ../hooks or ../../hooks
    const hooksRegex = /from\s+['"](?:\.\.\/)+hooks\/(.*?)['"]/g;
    content = content.replace(hooksRegex, "from '@/shared/hooks/$1'");

    // 5. Fix ../contexts or ../../contexts that were missed
    const contextsRegex = /from\s+['"](?:\.\.\/)+contexts\/(.*?)['"]/g;
    content = content.replace(contextsRegex, "from '@/shared/contexts/$1'");
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed imports in: ${filePath}`);
    }
  }
});
