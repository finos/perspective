/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const {
    execute,
    execute_return,
    python_version,
    copy_files_to_python_folder,
} = require("./script_utils.js");

let PYTHON = python_version();
const requires_script = `'import distutils.core; setup = distutils.core.run_setup("python/perspective/setup.py"); print(" ".join(["\\"" + requirement + "\\"" for requirement in setup.extras_require["dev"]]))'`;

(async () => {
    try {
        // copy build/config files into python folder
        copy_files_to_python_folder();

        const {stdout: requirements} =
            await execute_return`${PYTHON} -c ${requires_script}`;

        console.log(`Installing: ${requirements}`);

        const cmd = `${PYTHON} -m pip install ${requirements}`;
        console.log(cmd);

        execute`${cmd}`;
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
})();
