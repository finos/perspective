
# Perspective-python
Python APIs for [Perspective](https://github.com/finos/perspective). This folder contains  [boost-python](https://www.boost.org/doc/libs/1_70_0/libs/python/doc/html/index.html) bindings to the C++ Perspective engine.

[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/finos/perspective)
[![Build Status 2](https://travis-ci.org/finos/perspective.svg?branch=master)](https://travis-ci.org/finos/perspective)

## Development
Development of the Python API is ongoing; environment setup instructions are below:

### MacOS Instructions
1. Using [Homebrew](https://brew.sh), install the following dependencies:

        brew install boost boost-python3 numpy

2. Make sure you are running Python 3.7 or above:

        python --version # or python3 --version
        Python 3.7.3

3. Install Python dependencies:

        cd python/table/perspective && pip3 install -r requirements.txt

4. **IMPORTANT: you must symlink `libboost_python` and `libboost_numpy`, otherwise CMake cannot detect the installed python library:**

        cd /usr/local/lib
        sudo ln -s libboost_python37.dylib libboost_python3.dylib
        sudo ln -s libboost_numpy37.dylib libboost_numpy.dylib

5. Run the build script from the root directory:

        yarn build_python:table

6. Run tests to ensure a successful build:

        yarn test_python