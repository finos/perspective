---
id: development
title: Developer Guide
---

Thank you for your interest in contributing to Perspective! This guide will
teach you everything you need to know to get started hacking on the Perspective
codebase.

If you're coming to this project as principally a JavaScript developer, please
be aware that Perspective is quite a bit more complex than a typical NPM package
due to the mixed-language nature of the project; we've done quite a bit to make
sure the newcomer experience is as straightforward as possible, but some things
might not work the way you're used to!

Perspective is organized as a
[monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md),
and uses [lerna](https://lernajs.io/) to manage dependencies.

This guide provides instructions for both the JavaScript and Python libraries.
To switch your development toolchain between the two, use `yarn setup`. Once the
setup script has been run, common commands like `yarn build` and `yarn test`
automatically call the correct build and test tools.

### System Dependencies

`Perspective.js` and `perspective-python` **require** the following system
dependencies to be installed:

-   [CMake](https://cmake.org/) (version 3.15.4 or higher)
-   [Boost](https://www.boost.org/) (version 1.67 or higher, must be built - not
    header-only). This can be installed from tarball with the included script
    `node tools/perspective-scripts/install_tools.mjs`.
-   [Yarn (v1)](https://classic.yarnpkg.com/). **Important**: Yarn >v1 is not
    supported, and will cause build errors.

**_This list may be non-exhaustive depending on your OS/environment; please open
a thread in [Discussions](https://github.com/finos/perspective/discussions) if
you have any questions_**

## Build

Make sure you have the system dependencies installed. For specifics depending on
your OS, check the [system-specific instructions](#system-specific-instructions)
below.

To run a build, use

```bash
yarn build
```

If this is the first time you've built Perspective, you'll be asked to generate
a `.perspectiverc` via a short survey. This can be later re-configured via

```bash
yarn setup
```

If everything is successful, you should be able to run any of the `examples/`
packages, e.g. `examples/blocks` like so:

```bash
yarn start blocks
```

## `Perspective.js`

To build the JavaScript library, which includes WebAssembly compilation,
[Emscripten](https://github.com/kripken/emscripten) and its prerequisites are
required.

`Perspective.js` specifies its Emscripten version dependency in `package.json`,
and the correct version of Emscripten will be installed with other JS
dependencies by running `yarn`.

#### Building via local EMSDK

To build using an Emscripten install on your local system and not the Emscripten
bundled with Perspective in its `package.json`,
[install](https://emscripten.org/docs/getting_started/downloads.html) the
Emscripten SDK, then activate and export the latest `emsdk` environment via
[`emsdk_env.sh`](https://github.com/juj/emsdk):

```bash
source emsdk/emsdk_env.sh
```

Deviating from this specific version of Emscripten specified in the project's
`package.json` can introduce various errors that are extremely difficult to
debug.

To install a specific version of Emscripten (e.g. `2.0.6`):

```bash
./emsdk install 2.0.6
```

---

## `perspective-python`

To build the Python library, first configure your project to build Python via
`yarn setup`. Then, install the requirements corresponding to your version of
python, e.g.

```bash
pip install -r python/perspective/requirements-311.txt
```

`perspective-python` supports Python 3.8 and upwards.

### `perspective-jupyterlab`

To install the Jupyterlab/Jupyter Notebook plugins from your local working
directory, simply install `python/perspective` with `pip` as you might normally
do.

```bash
# builds labextension to the perspective-python python package root directory
pnpm -F @finos/perspective-jupyterlab build
# editable install of the python package
pnpm -F @finos/perspective-python develop:maturin
# set up symlink of our labextension to jupyter share directory
# this directory's path is in the output of `jupyter labextension list`
pnpm -F @finos/perspective-python develop:labextension
```

Afterwards, you should see it listed as a "local extension" when you run
`jupyter labextension list` and as a normal extension when you run
`jupyter nbextension list`.

---

## System-Specific Instructions

### MacOS/OSX

Install system dependencies through Homebrew:

```bash
brew install cmake llvm@17
brew link llvm@17 # optional, see below
```

On M1 (Apple Silicon) systems, make sure your brew-installed dependencies are in
`/opt/homebrew` (the default location), and that `/opt/homebrew/bin` is on the
`PATH`.

If you do not want to link the llvm@17 keg, then while developing ensure it is
on your PATH too, like this:

```
PATH=$(brew --prefix llvm@17)/bin:$PATH
```

**Note**: Perspective vendors its C++ extensions, so you may run into trouble
building if you have `brew`-installed versions of libraries, such as
`flatbuffers`.

### Windows 10

You need to use bash in order to build Perspective packages. To successfully
build on Windows 10, enable
[Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10)
(WSL) and install the Linux distribution of your choice.

Create symbolic links to easily access Windows directories and projects modified
via Windows. This way, you can modify any of the Perspective files using your
favorite editors on Windows and build via Linux.

Follow the Linux specific instructions to install Emscripten and all
prerequisite tools.

### Ubuntu/Debian

On Ubuntu, CMake will mistakenly resolve the system headers in `/usr/include`
rather than the emscripten supplied versions. You can resolve this by moving
`boost` dependencies to somewhere other than `/usr/include` - into Perspective's
own `src` dir (as per
[here](http://vclf.blogspot.com/2014/08/emscripten-linking-to-boost-libraries.html)).

```bash
apt-get install libboost-all-dev
cp -r /usr/include/boost ./packages/perspective/src/include/
```

---

## Test

You can run the test suite simply with the standard NPM command, which will both
build the test suite for every package and run them.

```bash
yarn test [--debug]
```

A test name regex can be passed to `jest` via the same `-t` flag:

```bash
yarn test -t 'button test (A|B)'
```

### JavaScript

The JavaScript test suite is composed of two sections: a Node.js test, which
asserts behavior of the `@finos/perspective` library, and a suite of
[Puppeteer](https://developers.google.com/web/tools/puppeteer/) tests, which
assert the behavior of the rest of the UI facing packages.

The Puppeteer/UI tests are a form of
[characterization tests](https://en.wikipedia.org/wiki/Characterization_test)
which use screenshots to compare current and previous behavior of
`<perspective-viewer>` and its plugins. The results of each comparison are
stored in each package's `test/results/results.json` file, and the screenshots
themselves are stored in the package's `tests/screenshots/` directory, though
only the former should be checked into GIT. When a test in these suites fails, a
`file.failed.png` and `file.diff.png` are also generated, showing the divergent
screenshot and a contrast diff respectively, so you can verify that the changed
behavior either does or does not reflect your patch. If you're confident that
the screenshots reflect your change, you can update the new hashes manually in
the `test/results/results.json` file, or update all hashes with the `--write`
flag:

```bash
yarn test --write
```

### Python

The Python test suite is built on Pytest, and it asserts the correct behavior of
the Python library.

Verbosity in the tests can be enabled with the `--verbose` flag.

### Troubleshooting installation from source

If you are installing from a source distribution (sdist), make sure you have the
[System Dependencies](#system-dependencies) installed.

Try installing in verbose mode:

```bash
pip install -vv perspective-python
```

The most common culprits are:

-   CMake version is too old
-   Boost headers are missing or too old

#### Timezones in Python Tests

Python tests are configured to use the `UTC` time zone. If running tests
locally, you might find that datetime-related tests fail to assert the correct
values. To correct this, run tests with the `TZ=UTC`, i.e.

```bash
TZ=UTC yarn test --verbose
```

---

## Benchmark

You can generate benchmarks specific to your machine's OS and CPU architecture
with Perspective's benchmark suite, which will generate a `report.html` file in
the `build/` directory of every package which supports benchmarks, as well as a
`results.json` file in the `bench/results/`, which can be checked in to GIT with
your changes to preserve them for future comparison.

```bash
yarn bench
```

The benchmarks report and `results.json` show a histogram of current
performance, as well as that of the previous `results.json`. Running this should
probably be standard practice after making a large change which may affect
performance, but please create a baseline `results.json` entry for your test
machine on a commit before your changes first, such that the effects of your PR
can be properly compared.
