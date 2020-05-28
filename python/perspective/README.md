# perspective-python

Python APIs for [perspective](https://github.com/finos/perspective) front end

[![Build Status](https://travis-ci.org/finos/perspective.svg?branch=master)](https://travis-ci.org/finos/perspective)
[![GitHub issues](https://img.shields.io/github/issues/finos/perspective.svg)]()
[![codecov](https://codecov.io/gh/finos/perspective/branch/master/graph/badge.svg)](https://codecov.io/gh/finos/perspective)
[![PyPI](https://img.shields.io/pypi/v/perspective-python.svg)](https://pypi.python.org/pypi/perspective-python)
[![PyPI](https://img.shields.io/pypi/l/perspective-python.svg)](https://pypi.python.org/pypi/perspective-python)

## Install

`perspective-python` can be installed from [pypi](https://pypi.python.org/pypi/perspective-python) with `pip`:

```bash
pip install -v perspective-python
```

Because `perspective-python` is a C++ library at its core, the installation process is a little more
complex than pure-Python projects. When submitting issues on [GitHub](https://github.com/finos/perspective)
related to installation/dependencies, please make sure to include the verbose logs from `pip install -v`.

Wheels are currently distributed for:

- MacOS (Python 3.7, Python 2.7)

For Linux and Windows, source distributions are available from `PyPi`. For proper installation of the source distribution
(as it requires your machine to build the C++ extension), make sure the following dependencies are installed:

- [CMake](https://cmake.org/)
- A C++ compiler (platform-dependent)
  - On Windows, use Microsoft Visual Studio 2017 (MSVC 14.1).

### Dependencies

`pyarrow==0.16.0` is a build dependency and **must be installed before installing Perspective**:

```bash
pip install pyarrow==0.16.0
```

All other dependencies (Python and C++) will be installed as part of the `pip install` process.

### Jupyterlab Extension

To use `perspective-python` in JupyterLab, make sure `perspective-python` has already been
installed successfully from `pip`.

Afterwards, install the extension from Jupyter's extension registry:

`jupyter labextension install @finos/perspective-jupyterlab`

## Documentation

[Python User Guide](https://perspective.finos.org/docs/md/python.html)
[Python API](https://perspective.finos.org/docs/obj/perspective-python.html)
[Examples](https://github.com/finos/perspective/tree/master/python/perspective/examples)

## Developing

To develop `perspective-python`, additional C++ dependencies are required (on top of CMake and a C++ compiler):

- boost
- PyBind11
- tbb

On MacOS, you should be able to install Boost, PyBind11, and tbb from brew:

```shell
brew install boost pybind11 tbb
```

Then run `yarn build`, and if a `.perspectiverc` config file has not been created yet, you'll be taken through the `yarn setup` script. On the `Focus` section, type `p` for python, and continue through the script. Run `yarn build` again, and the python build should begin.

If you already have a `.perspectiverc` and want to reset your build configuration, simply run `yarn setup`.

Once the build successfully completes, run `yarn test_python` from the project root in order to verify operation.

### Windows

By default, `perspective-python` attempts to build utilizing Microsoft Visual Studio 2017 (MSVC 14.1). You may change this to an older version by editing `setup.py`.
