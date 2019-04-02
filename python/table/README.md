# Perspective-python
Python APIs for [perspective](https://github.com/jpmorganchase/perspective) front end


[![PyPI](https://img.shields.io/pypi/v/perspective-python.svg)](https://pypi.python.org/pypi/perspective-python)
[![PyPI](https://img.shields.io/pypi/l/perspective-python.svg)](https://pypi.python.org/pypi/perspective-python)
[![Docs](https://img.shields.io/readthedocs/perspective-python.svg)](https://perspective-python.readthedocs.io)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/jpmorganchase/perspective)


Python Build

[![Build Status 1](https://travis-ci.org/timkpaine/perspective-python.svg?branch=master)](https://travis-ci.org/timkpaine/perspective-python)

C++ Build

[![Build Status 2](https://travis-ci.org/timkpaine/perspective-python.svg?branch=master)](https://travis-ci.org/jpmorganchase/perspective)

# Package
This package consists of two mutually-exclusive libraries:

- [perspective-python](https://github.com/timkpaine/perspective-python), a python-based library for interfacing with the Perspective webassembly project via either JupyterLab or Dash
- `perspective-python[table]`, this folder, which is `boost-python` bindings to the original C++ based perspective engine (rather than the webassembly version).


## Install
To install the base package from pip:

`pip install perspective-python`

To install the C++ engine from pip:

`pip install perspective-python[table]`


To install the JupyterLab extension:

`jupyter labextension install @jpmorganchase/perspective-jupyterlab`


## Getting Started
[Read the docs!](http://perspective-python.readthedocs.io/en/latest/index.html)
