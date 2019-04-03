/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const execSync = require("child_process").execSync;

const execute = cmd => execSync(cmd, {stdio: "inherit"});

function docker(image = "emsdk") {
    console.log(`-- Creating ${image} docker image`);
    let cmd = "docker run --rm -it";
    if (process.env.PSP_CPU_COUNT) {
        cmd += ` --cpus="${parseInt(process.env.PSP_CPU_COUNT)}.0"`;
    }
    cmd += ` -v $(pwd):/usr/src/app/python/table -w /usr/src/app/python/table perspective/${image}`;
    return cmd;
}

try {
    // install dependencies
    let cmd = "cd python/table && \
    python3.7 -m pip install -r requirements.txt &&\
    python3.7 -m pip install -U flake8 nose2 codecov &&\
    python3.7 -m nose2 -v perspective --with-coverage --coverage=perspective";
;
    if (process.env.PSP_DOCKER) {
        execute(docker("python") + ' bash -c "' + cmd + '"');
    } else {
        execute(cmd);
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
