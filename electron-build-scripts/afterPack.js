const fs = require('fs');
const path = require('path');

exports.default = async function (context) {
    if (context.electronPlatformName !== 'linux') {
        return;
    }

    const executable_name = context.packager.appInfo.productFilename.toLowerCase();
    const binary_path = path.join(context.appOutDir, executable_name);
    const binary_path_orig = path.join(context.appOutDir, `${executable_name}.orig`);

    fs.renameSync(binary_path, binary_path_orig);

    // Create a shell script with the original name
    const wrapper = `#!/bin/sh
exec "$(dirname "$0")/${executable_name}.orig" --no-sandbox "$@"
`;

    fs.writeFileSync(binary_path, wrapper);
    fs.chmodSync(binary_path, 0o755);
};
