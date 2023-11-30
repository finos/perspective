// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import {
    default as sh,
    python_version,
    copy_files_to_python_folder,
    py_requirements,
} from "./sh_perspective.mjs";

let PYTHON = sh(python_version());

if (process.env.PSP_OLD_SHITTY_INSTALL_METHOD) {
    const requires_script = `import setuptools._distutils.core; setup = setuptools._distutils.core.run_setup('python/perspective/setup.py'); print(' '.join(['"' + requirement + '"' for requirement in setup.extras_require['dev']]))`;

    // copy build/config files into python folder
    copy_files_to_python_folder();

    // install build meta  deps, this is a necessary evil to keep the setup.py clean
    sh`${PYTHON} -m pip install  jupyter_packaging==0.12.3`.runSync();
    const requirements = await sh`${PYTHON} -c ${requires_script}`.execSync();
    if (requirements.trim().length > 0) {
        console.log(`Installing: ${requirements}`);
        sh`${PYTHON} -m pip install -U ${sh(requirements)}`.log().runSync();
    } else {
        console.log("Nothing to install");
    }
} else {
    sh`${PYTHON} -m pip install -r ${py_requirements()}`.runSync();
    sh`${PYTHON} -m pip install -U jupyter_packaging==0.12.3`.runSync();
}
