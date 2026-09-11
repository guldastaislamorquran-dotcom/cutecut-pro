const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../node_modules/app-builder-lib/out/targets/snap/coreLegacy.js');

if (!fs.existsSync(targetPath)) {
  console.log('coreLegacy.js not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(targetPath, 'utf8');

// 1. Patch buildWithTemplate to write clean command.sh with GNOME runtime paths
const templateTarget = 'const templateDir = await (0, electronGet_1.downloadBuilderToolset)({ releaseName, filenameWithExt, checksums, githubOrgRepo: "electron-userland/electron-builder-binaries" });';
const templatePatch = `const launcherScript = '#!/bin/bash\\n' +
          'export LD_LIBRARY_PATH="/snap/gnome-42-2204/current/usr/lib/x86_64-linux-gnu:/snap/gnome-42-2204/current/usr/lib:/snap/gnome-42-2204/current/lib/x86_64-linux-gnu:/snap/gnome-42-2204/current/lib:/snap/core22/current/usr/lib/x86_64-linux-gnu:/snap/core22/current/lib/x86_64-linux-gnu:$SNAP/usr/lib/x86_64-linux-gnu:$SNAP/lib/x86_64-linux-gnu:$SNAP:\${LD_LIBRARY_PATH:-}"\\n' +
          'export PATH="/snap/gnome-42-2204/current/usr/bin:$SNAP/bin:$SNAP/usr/bin:\$PATH"\\n' +
          'export XDG_DATA_DIRS="/snap/gnome-42-2204/current/usr/share:$SNAP/usr/share:\${XDG_DATA_DIRS:-/usr/local/share:/usr/share}"\\n' +
          'export GTK_PATH="/snap/gnome-42-2204/current/usr/lib/x86_64-linux-gnu/gtk-3.0"\\n' +
          'export GIO_MODULE_DIR="/snap/gnome-42-2204/current/usr/lib/x86_64-linux-gnu/gio/modules"\\n' +
          'exec "$SNAP/cutecut-pro" "$@"\\n';
        await (0, promises_1.writeFile)(path.join(templateDir, "command.sh"), launcherScript, { mode: 0o755 });`;

if (!content.includes(templatePatch) && content.includes(templateTarget)) {
  content = content.replace(templateTarget, templateTarget + '\n        ' + templatePatch);
}

// 2. Patch buildCommandShContent
const targetFunc = 'function buildCommandShContent(opts) {';
if (content.includes(targetFunc)) {
  const index = content.indexOf(targetFunc);
  const prefix = content.substring(0, index);
  const newFunc = `function buildCommandShContent(opts) {
    return '#!/bin/bash\\n' +
      'export LD_LIBRARY_PATH="/snap/gnome-42-2204/current/usr/lib/x86_64-linux-gnu:/snap/gnome-42-2204/current/usr/lib:/snap/gnome-42-2204/current/lib/x86_64-linux-gnu:/snap/gnome-42-2204/current/lib:/snap/core22/current/usr/lib/x86_64-linux-gnu:/snap/core22/current/lib/x86_64-linux-gnu:$SNAP/usr/lib/x86_64-linux-gnu:$SNAP/lib/x86_64-linux-gnu:$SNAP:\${LD_LIBRARY_PATH:-}"\\n' +
      'export PATH="/snap/gnome-42-2204/current/usr/bin:$SNAP/bin:$SNAP/usr/bin:\$PATH"\\n' +
      'export XDG_DATA_DIRS="/snap/gnome-42-2204/current/usr/share:$SNAP/usr/share:\${XDG_DATA_DIRS:-/usr/local/share:/usr/share}"\\n' +
      'export GTK_PATH="/snap/gnome-42-2204/current/usr/lib/x86_64-linux-gnu/gtk-3.0"\\n' +
      'export GIO_MODULE_DIR="/snap/gnome-42-2204/current/usr/lib/x86_64-linux-gnu/gio/modules"\\n' +
      'exec "$SNAP/cutecut-pro" "$@"\\n';
}
//# sourceMappingURL=coreLegacy.js.map`;
  content = prefix + newFunc;
  console.log('Successfully patched buildCommandShContent in coreLegacy.js.');
} else {
  console.warn('Warning: Could not find function buildCommandShContent to patch.');
}

// 3. Patch snap subcommand to pack for modern snapcraft (v8+)
if (content.includes('const snapArgs = ["snap"')) {
  content = content.replace('const snapArgs = ["snap"', 'const snapArgs = ["pack"');
  console.log('Successfully patched snap subcommand to pack in coreLegacy.js.');
}

// 4. Force destructive mode so snapcraft doesn't require LXD
if (content.includes('const isDestructiveMode = process.env.SNAP_DESTRUCTIVE_MODE === "true";')) {
  content = content.replace('const isDestructiveMode = process.env.SNAP_DESTRUCTIVE_MODE === "true";', 'const isDestructiveMode = true;');
  console.log('Successfully forced destructive mode in coreLegacy.js.');
}

// 5. Enable reliable template app build for snap
const templateCondition = 'this.isUseTemplateApp = this.options.useTemplateApp !== false && (arch === builder_util_1.Arch.x64 || arch === builder_util_1.Arch.armv7l) && buildPackages.length === 0 && stageMatchesDefaults;';
if (content.includes(templateCondition)) {
  content = content.replace(templateCondition, 'this.isUseTemplateApp = this.options.useTemplateApp !== false && (arch === builder_util_1.Arch.x64 || arch === builder_util_1.Arch.armv7l);');
  console.log('Successfully enabled template app build in coreLegacy.js.');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully patched coreLegacy.js for self-contained snap launcher.');
