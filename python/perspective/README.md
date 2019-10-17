# perspective-python

Python APIs for [perspective](https://github.com/finos/perspective) front end

[![Build Status](https://travis-ci.org/finos/perspective.svg?branch=master)](https://travis-ci.org/finos/perspective)
[![GitHub issues](https://img.shields.io/github/issues/finos/perspective.svg)]()
[![codecov](https://codecov.io/gh/finos/perspective/branch/master/graph/badge.svg)](https://codecov.io/gh/finos/perspective)
[![PyPI](https://img.shields.io/pypi/v/perspective-python.svg)](https://pypi.python.org/pypi/perspective-python)
[![PyPI](https://img.shields.io/pypi/l/perspective-python.svg)](https://pypi.python.org/pypi/perspective-python)

## Install

### Dependencies

You need to have [https://github.com/intel/tbb](TBB) installed as a system dependency:

On MacOS:

`brew install tbb`

### Installation

To install the base package from pip:

`pip install perspective-python`

To Install from source:

`make install`

To install the JupyterLab extension:

`jupyter labextension install @finos/perspective-jupyterlab`

or from source:

`make labextension`

## Getting Started

[Example Notebooks](https://github.com/finos/perspective/tree/master/python/perspective/examples)

## Developing
To build `perspective-python` from source, you'll need the following C++ dependencies:

- Python 3.7
- numpy
- CMake
- PyBind11
- tbb

On MacOS, you should be able to install Boost, PyBind11, and tbb from brew:

```shell
brew install pybind11 tbb
```

And then install Python dependencies using pip:

```shell
python3 -m pip install -r requirements-dev.txt
```

Then run `yarn build`, and if a `.perspectiverc` config file has not been created yet, you'll be taken through the `yarn setup` script. On the `Focus` section, type `p` for python, and continue through the script. Run `yarn build` again, and the python build should begin.

If you already have a `.perspectiverc` and want to reset your build configuration, simply run `yarn setup`.

Once the build successfully completes, run `yarn test_python` from the project root in order to verify operation.
