import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

const appsDir = path.join(srcDir, 'apps');
const sharedDir = path.join(srcDir, 'shared');

const dirsToCreate = [
  appsDir,
  path.join(appsDir, 'platform', 'pages'),
  path.join(appsDir, 'platform', 'components'),
  path.join(appsDir, 'admin', 'pages'),
  path.join(appsDir, 'admin', 'components'),
  path.join(appsDir, 'storefront', 'pages'),
  path.join(appsDir, 'storefront', 'components'),
  path.join(appsDir, 'customer', 'pages'),
  path.join(appsDir, 'customer', 'components'),
  sharedDir,
  path.join(sharedDir, 'components'),
];

dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function moveSafely(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.renameSync(src, dest);
  console.log(`Moved ${src} to ${dest}`);
}

const pagesDir = path.join(srcDir, 'pages');
if (fs.existsSync(pagesDir)) {
  moveSafely(path.join(pagesDir, 'admin'), path.join(appsDir, 'admin', 'pages', 'admin'));
  moveSafely(path.join(pagesDir, 'customer'), path.join(appsDir, 'customer', 'pages', 'customer'));
  moveSafely(path.join(pagesDir, 'Onboarding'), path.join(appsDir, 'platform', 'pages', 'Onboarding'));
  moveSafely(path.join(pagesDir, 'PlatformLandingPage.tsx'), path.join(appsDir, 'platform', 'pages', 'PlatformLandingPage.tsx'));
  
  const remainingPages = fs.readdirSync(pagesDir);
  remainingPages.forEach(file => {
    moveSafely(path.join(pagesDir, file), path.join(appsDir, 'storefront', 'pages', file));
  });
  try { fs.rmdirSync(pagesDir); } catch(e) {}
}

const componentsDir = path.join(srcDir, 'components');
if (fs.existsSync(componentsDir)) {
  moveSafely(path.join(componentsDir, 'Admin'), path.join(appsDir, 'admin', 'components', 'Admin'));
  moveSafely(path.join(componentsDir, 'Customer'), path.join(appsDir, 'customer', 'components', 'Customer'));
  moveSafely(path.join(componentsDir, 'Seller'), path.join(appsDir, 'admin', 'components', 'Seller'));
  
  const remainingComponents = fs.readdirSync(componentsDir);
  remainingComponents.forEach(file => {
    moveSafely(path.join(componentsDir, file), path.join(sharedDir, 'components', file));
  });
  try { fs.rmdirSync(componentsDir); } catch(e) {}
}

const sharedFolders = ['hooks', 'utils', 'contexts', 'types', 'services', 'lib', 'assets', 'api', 'config'];
sharedFolders.forEach(folder => {
  const folderPath = path.join(srcDir, folder);
  if (fs.existsSync(folderPath)) {
    moveSafely(folderPath, path.join(sharedDir, folder));
  }
});

function updateImportsInDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      updateImportsInDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let originalContent = content;
      
      content = content.replace(/(['"])@\/pages\/admin/g, '$1@/apps/admin/pages/admin');
      content = content.replace(/(['"])@\/pages\/customer/g, '$1@/apps/customer/pages/customer');
      content = content.replace(/(['"])@\/pages\/Onboarding/g, '$1@/apps/platform/pages/Onboarding');
      content = content.replace(/(['"])@\/pages\/PlatformLandingPage/g, '$1@/apps/platform/pages/PlatformLandingPage');
      content = content.replace(/(['"])@\/pages\//g, '$1@/apps/storefront/pages/');
      
      content = content.replace(/(['"])@\/components\/Admin/g, '$1@/apps/admin/components/Admin');
      content = content.replace(/(['"])@\/components\/Customer/g, '$1@/apps/customer/components/Customer');
      content = content.replace(/(['"])@\/components\/Seller/g, '$1@/apps/admin/components/Seller');
      content = content.replace(/(['"])@\/components\//g, '$1@/shared/components/');
      
      sharedFolders.forEach(folder => {
        const regex = new RegExp(`(['"])@\\/${folder}\\/`, 'g');
        content = content.replace(regex, `$1@/shared/${folder}/`);
      });
      
      if (file === 'App.tsx' || file === 'main.tsx') {
         content = content.replace(/(['"])\.\/pages\//g, '$1./apps/storefront/pages/');
         content = content.replace(/(['"])\.\/components\//g, '$1./shared/components/');
         content = content.replace(/(['"])\.\/styles\//g, '$1./shared/styles/');
      }
      
      content = content.replace(/(['"])@\/styles\//g, '$1@/shared/styles/');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Updated imports in ${fullPath}`);
      }
    }
  });
}

const stylesDir = path.join(srcDir, 'styles');
if (fs.existsSync(stylesDir)) {
  moveSafely(stylesDir, path.join(sharedDir, 'styles'));
}

console.log("Starting import updates...");
updateImportsInDir(srcDir);
console.log("Done.");
