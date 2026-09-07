const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../node_modules/app-builder-lib/out/targets/snap/coreLegacy.js');

if (!fs.existsSync(targetPath)) {
  console.log('coreLegacy.js not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(targetPath, 'utf8');

// 1. Patch buildWithTemplate to write clean command.sh
const templateTarget = 'const templateDir = await (0, electronGet_1.downloadBuilderToolset)({ releaseName, filenameWithExt, checksums, githubOrgRepo: "electron-userland/electron-builder-binaries" });';
const templatePatch = 'await (0, promises_1.writeFile)(path.join(templateDir, "command.sh"), \'#!/bin/bash -e\\nexec "$SNAP/cutecut-pro" "$@"\\n\', { mode: 0o755 });';

if (!content.includes(templatePatch) && content.includes(templateTarget)) {
  content = content.replace(templateTarget, templateTarget + '\n        ' + templatePatch);
}

// 2. Patch buildCommandShContent
const targetFunc = 'function buildCommandShContent(opts) {';
if (content.includes(targetFunc)) {
  const index = content.indexOf(targetFunc);
  const prefix = content.substring(0, index);
  const newFunc = `function buildCommandShContent(opts) {
    return '#!/bin/bash -e\\nexec "$SNAP/cutecut-pro" "$@"\\n';
}
//# sourceMappingURL=coreLegacy.js.map`;
  content = prefix + newFunc;
  console.log('Successfully patched buildCommandShContent in coreLegacy.js.');
} else {
  console.warn('Warning: Could not find function buildCommandShContent to patch.');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully patched coreLegacy.js for self-contained snap launcher.');
