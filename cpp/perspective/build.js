const {execSync} = require("child_process");
const os = require("os");
const path = require("path");

const stdio = "inherit";
const env = process.PSP_DEBUG ? "debug" : "release";
const cwd = path.join(process.cwd(), "dist", env);

delete process.env.NODE;

try {
    execSync(`mkdirp ${cwd}`, {stdio});
    process.env.CLICOLOR_FORCE = 1;
    execSync(`emcmake cmake ${__dirname} -DCMAKE_BUILD_TYPE=${env}`, {
        cwd,
        stdio,
    });
    execSync(`emmake make -j${process.env.PSP_NUM_CPUS || os.cpus().length}`, {
        cwd,
        stdio,
    });
    execSync(`cpy esm/**/* ../esm`, {cwd, stdio});
    execSync(`cpy cjs/**/* ../cjs`, {cwd, stdio});
} catch (e) {
    console.error(e);
    process.exit(1);
}
