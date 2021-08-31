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

## Building

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
packages, e.g. `examples/simple` like so:

```bash
yarn start simple
```

#### Docker

[Docker](https://docs.docker.com/install/) images with pre-built development
environments are provided for the Python libraries.

To build Perspective using Docker, select the option in `yarn setup`.

### System Dependencies

`Perspective.js` and `perspective-python` **require** the following system dependencies to be installed:

- [CMake](https://cmake.org/) (version 3.15.4 or higher)
- [Boost](https://www.boost.org/) (version 1.67 or higher, must be built - not header-only)
- [Flatbuffers](https://google.github.io/flatbuffers/flatbuffers_guide_building.html)

## `Perspective.js`

To build the JavaScript library, which includes WebAssembly compilation,
[Emscripten](https://github.com/kripken/emscripten) and its prerequisites are
required.

`Perspective.js` specifies its Emscripten version dependency in `package.json`,
and the correct version of Emscripten will be installed with other JS
dependencies by running `yarn`.

#### Building via local EMSDK

To build using an Emscripten install on your local system and not the
Emscripten bundled with Perspective in its `package.json`,
[install](https://emscripten.org/docs/getting_started/downloads.html) the
Emscripten SDK, then activate and export the latest `emsdk` environment via
[`emsdk_env.sh`](https://github.com/juj/emsdk):

```bash
source emsdk/emsdk_env.sh
```

We currently use Emscripten version `2.0.6` — deviating from this specific
version of Emscripten can introduce various errors that are extremely difficult
to debug.

To install this specific version of Emscripten:

```bash
./emsdk install 2.0.6
```

### `perspective-jupyterlab`

To install the Jupyterlab plugin from your local working directory, give
`jupyter labextension install` the path to the `perspective-jupyterlab`
package:

```bash
jupyter labextension install ./packages/perspective-jupyterlab
```

Afterwards, you should see it listed as a "local extension" when you run
`jupyter labextension list`.

Because we do not inline Perspective into the Jupyterlab plugin, your local
changes will not show up in Jupyterlab **unless** you use `yarn link`
according to the directions below:

1. Ensure that your Jupyterlab is built by running `jupyter lab build`.
2. Inside each directory in `packages`, run [`yarn link`](https://classic.yarnpkg.com/en/docs/cli/link).
This will create a symlink to your local build that we will use inside Jupyterlab.
3. From the Perspective root, run `yarn jlab_link`. This is a script that will
find your Jupyterlab installation and tell Jupyterlab to use these symlinks
when it looks for Perspective packages, instead of fetching them from NPM.
4. When you make a local change, make sure you run `yarn build` **and**
`jupyter lab build` so that it fetches the newest changes.
5. Whenever you run `jupyter lab clean`, you will need to run `yarn jlab_link`
again to re-register the symlinks.

## `perspective-python`

To build the Python library, first configure your project to Python via
`yarn setup`, then run:

```bash
yarn build
```

`perspective-python` supports Python 3.7 and upwards.

## System-Specific Instructions

### MacOS/OSX

Install system dependencies through Homebrew:

```bash
brew install cmake
brew install boost
brew install flatbuffers
```

On M1 (Apple Silicon) systems, make sure your brew-installed dependencies are in
`/opt/homebrew` (the default location), and that `/opt/homebrew/bin` is on the `PATH`.

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
`boost` and `flatbuffers` dependencies to somewhere other than `/usr/include` -
into Perspective's own `src` dir (as per
[here](http://vclf.blogspot.com/2014/08/emscripten-linking-to-boost-libraries.html)).

```bash
apt-get install libboost-all-dev
cp -r /usr/include/boost ./packages/perspective/src/include/

cd ./packages/perspective/src/include/
git clone https://github.com/google/flatbuffers.git
cd flatbuffers
cmake -G "Unix Makefiles"
make
ln -s /usr/local/flatbuffers/flatc /usr/local/bin/flatc
chmod +x /usr/local/flatbuffers/flatc
```

## Testing

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
assert the behavior of the rest of the UI facing packages. For the latter,
you'll need Docker installed, as these tests use a Puppeteer and Chrome build
installed in a Docker container.

The Puppeteer/UI tests are a form of
[characterization tests](https://en.wikipedia.org/wiki/Characterization_test)
which use screenshots to compare current and previous behavior of
`<perspective-viewer>` and its plugins. The results of each comparison are
stored in each package's `test/results/results.json` file, and the screenshots
themselves are stored in the package's `screenshots/` directory, though only the
former should be checked into GIT. When a test in these suites fails, a
`file.failed.png` and `file.diff.png` are also generated, showing the divergent
screenshot and a contrast diff respectively, so you can verify that the changed
behavior either does or does not reflect your patch. If you're confident that
the screenshots reflect your change, you can update the new hashes manually in
the `test/results/results.json` file, or update all hashes with the `--wrte`
flag:

```bash
yarn test --write
```

For quick local iteration and debugging failing tests, the Puppeteer tests can
use a local copy of Puppeteer, rather than relying on the supplied Docker image.
These will run much quicker, and can be optionally run without `--headless` mode
for debugging test failures quickly. However, due to rendering inconsistencies
between platforms, the resulting test hashes will not match the ones saved in
`results.json`, so you will need to re-run the suite with the `--write` flag to
generate a `results.local.json` file specific to your OS.

To toggle between local and Docker Puppeteer, run

```bash
yarn toggle_puppeteer
```

This will install a local copy of Puppeteer via `yarn` the first time it is run,
if a local Puppeteer is not found.

### Python

The Python test suite is built on Pytest, and it asserts the correct behavior of
the Python library.

If you have built the library with the `--python2` flag, make sure to run the
test suite using the `--python2` flag as well. Running a version of
`perspective-python` built against Python 2 in Python 3 (and vice versa) is not
supported.

Verbosity in the tests can be enabled with the `--verbose` flag.

### Troubleshooting installation from source

If you are installing from a source distribution (sdist), make sure you have
the [System Dependencies](#system-dependencies) installed.

Try installing in verbose mode:

```bash
pip install -vv perspective-python
```

The most common culprits are:

- CMake version too old
- Boost headers are missing or too old
- Flatbuffers not installed prior to installing Perspective
#### Timezones in Python Tests

Python tests are configured to use the `UTC` time zone. If running tests locally,
you might find that datetime-related tests fail to assert the correct values. To
correct this, run tests with the `TZ=UTC`, i.e.

```bash
TZ=UTC yarn test --verbose
```

## Benchmarking

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
