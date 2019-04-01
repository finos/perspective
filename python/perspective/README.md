# perspective-python
Python APIs for [perspective](https://github.com/jpmorganchase/perspective) front end

# This package now lives partially under [Perspective](https://github.com/jpmorganchase/perspective)

[![Build Status](https://travis-ci.org/timkpaine/perspective-python.svg?branch=master)](https://travis-ci.org/timkpaine/perspective-python)
[![GitHub issues](https://img.shields.io/github/issues/timkpaine/perspective-python.svg)]()
[![Waffle.io](https://badge.waffle.io/timkpaine/perspective-python.svg?label=ready&title=Ready)](http://waffle.io/timkpaine/perspective-python)
[![codecov](https://codecov.io/gh/timkpaine/perspective-python/branch/master/graph/badge.svg)](https://codecov.io/gh/timkpaine/perspective-python)
[![BCH compliance](https://bettercodehub.com/edge/badge/timkpaine/perspective-python?branch=master)](https://bettercodehub.com/)
[![PyPI](https://img.shields.io/pypi/v/perspective-python.svg)](https://pypi.python.org/pypi/perspective-python)
[![PyPI](https://img.shields.io/pypi/l/perspective-python.svg)](https://pypi.python.org/pypi/perspective-python)
[![Docs](https://img.shields.io/readthedocs/perspective-python.svg)](https://perspective-python.readthedocs.io)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/jpmorganchase/perspective)


## Install
To install the base package from pip:

`pip install perspective-python`

To Install from source:

`make install`


To install the JupyterLab extension:

`jupyter labextension install @jpmorganchase/perspective-jupyterlab`

or from source:

`make labextension`

## Getting Started
[Read the docs!](http://perspective-python.readthedocs.io/en/latest/index.html)

[Example Notebooks](https://github.com/timkpaine/perspective-python/tree/master/examples)

![](https://github.com/timkpaine/perspective-python/raw/master/docs/img/scatter.png)


## Pandas Pivot integration

#### Index - Multiindex pivot
![](https://github.com/timkpaine/perspective-python/raw/master/docs/img/pandas1.png)

#### Column - Multiindex pivot
![](https://github.com/timkpaine/perspective-python/raw/master/docs/img/pandas2.png)

## C++ Integration
This package is primarily focused on integrating with the WebAssembly version of Perspective. To build the C++ side, install `perspective-python[table]`, from the [Perspective main library](https://github.com/jpmorganchase/perspective/tree/master/python).