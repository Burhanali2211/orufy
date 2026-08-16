import fs from 'fs';
import path from 'path';

const IMPORT_MAPPINGS = [
  { regex: /import \{ supabase \} from '(..\/)+lib\/legacyDb';/g, replacement: "import { supabase } from '@/shared/lib/legacyDb';" },
  { regex: /import \{ useNotification \} from '(..\/)+contexts\/NotificationContext';/g, replacement: "import { useNotification } from '@/shared/contexts/NotificationContext';" },
  { regex: /import \{ Modal, ConfirmModal \} from '(..\/)+Common\/Modal';/g, replacement: "import { Modal, ConfirmModal } from '@/shared/components/Common/Modal';" },
  { regex: /import \{ Modal \} from '(..\/)+Common\/Modal';/g, replacement: "import { Modal } from '@/shared/components/Common/Modal';" },
  { regex: /import \{ ConfirmModal \} from '(..\/)+Common\/Modal';/g, replacement: "import { ConfirmModal } from '@/shared/components/Common/Modal';" },
  { regex: /import \{ FormInput, FormSelect, FormCheckbox \} from '(..\/)+Common\/FormInput';/g, replacement: "import { FormInput, FormSelect, FormCheckbox } from '@/shared/components/Common/FormInput';" },
  { regex: /import \{ FormInput, FormSelect \} from '(..\/)+Common\/FormInput';/g, replacement: "import { FormInput, FormSelect } from '@/shared/components/Common/FormInput';" },
  { regex: /import \{ FormInput \} from '(..\/)+Common\/FormInput';/g, replacement: "import { FormInput } from '@/shared/components/Common/FormInput';" },
  // Also catch generic cases if they use single quotes or double quotes
  { regex: /from '(..\/)+Common\//g, replacement: "from '@/shared/components/Common/" },
  { regex: /from "(..\/)+Common\//g, replacement: "from \"@/shared/components/Common/" },
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

      for (const mapping of IMPORT_MAPPINGS) {
        content = content.replace(mapping.regex, mapping.replacement);
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed imports in: ${fullPath}`);
      }
    }
  }
}

const adminPath = path.resolve(process.cwd(), 'src/apps/admin');
console.log(`Scanning for broken imports in ${adminPath}...`);
processDirectory(adminPath);
console.log('Import cleanup complete!');
