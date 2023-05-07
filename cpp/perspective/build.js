const { execSync } = require("child_process");
const os = require("os");
const path = require("path");
const fflate = require("fflate");
const fs = require("fs");

const stdio = "inherit";
const env = process.PSP_DEBUG ? "debug" : "release";
const cwd = path.join(process.cwd(), "dist", env);

delete process.env.NODE;

try {
    execSync(`mkdirp ${cwd}`, { stdio });
    process.env.CLICOLOR_FORCE = 1;
    execSync(`emcmake cmake ${__dirname} -Wno-dev -DCMAKE_BUILD_TYPE=${env}`, {
        cwd,
        stdio,
    });
    execSync(`emmake make -j${process.env.PSP_NUM_CPUS || os.cpus().length}`, {
        cwd,
        stdio,
    });
    execSync(`cpy web/**/* ../web`, { cwd, stdio });
    execSync(`cpy node/**/* ../node`, { cwd, stdio });

    const wasm = fs.readFileSync("dist/web/perspective.cpp.wasm");
    const compressed = fflate.compressSync(wasm);
    fs.writeFileSync("dist/web/perspective.cpp.wasm", compressed);

    const wasm2 = fs.readFileSync("dist/node/perspective.cpp.wasm");
    const compressed2 = fflate.compressSync(wasm2);
    fs.writeFileSync("dist/node/perspective.cpp.wasm", compressed2);
} catch (e) {
    console.error(e);
    process.exit(1);
}
