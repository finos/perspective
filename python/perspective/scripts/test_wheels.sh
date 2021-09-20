#!/bin/bash
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
set -e

# 
# Creates a new virtual environment and installs Perspective from a wheel,
# testing whether C++ bindings are imported properly.
#
# Usage:
#   1. Make sure wheels are built and in `python/perspective/wheelhouse`:
#       $ yarn _wheel_python --{manylinux2010|manylinux2014|macos} --{python36|python38}
#   2. Run this script, passing in in the Python version you want to run
#      against (defaults to Python 3.7):
#       $ ./test_wheels.sh --{manylinux2010|manylinux2014|macos} --{python36|python38}

HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PYTHON_INTERPRETER="python3.7"
PYTHON_TAG="cp37"
PLATFORM="manylinux2010"

# Test one version of python with one platform at a time - on Azure, all wheels
# are built individually and so we don't need to test manylinux2010 and 2014
# or different versions of Python in the same command.
while :; do
    case $1 in
        "--python36")
            PYTHON_INTERPRETER="python3.6"
            PYTHON_TAG="cp36"
        ;;
        "--python38")
            PYTHON_INTERPRETER="python3.8"
            PYTHON_TAG="cp38"
        ;;
        "--manylinux2010")
            PLATFORM="manylinux2010"
        ;;
        "--manylinux2014")
            PLATFORM="manylinux2010"
        ;;
        "--macos")
            PLATFORM="macos"
        ;;
        *) break
    esac
    shift
done

echo "Testing ${PYTHON_INTERPRETER} wheels for ${PLATFORM}"

if [ ! -d ${HERE}/../wheelhouse ]; then
    echo "wheelhouse directory does not exist; run yarn _wheel_python first to generate wheels."
    exit 1
fi

echo "Creating ${PYTHON_INTERPRETER} virtualenv in python/perspective/test_wheel_venvs"

if [ ! -d ${HERE}/../test_wheel_venvs ]; then
    echo "Creating test_wheel_venvs directory"
    mkdir ${HERE}/../test_wheel_venvs
fi

cd ${HERE}/../test_wheel_venvs

VENV_DIR=${PYTHON_INTERPRETER//.}_venv

if [ -d ${VENV_DIR} ]; then
    echo "Cleaning up ${VENV_DIR}"
    rm -rf ${VENV_DIR}
fi

# Create a new virtualenv
mkdir ${VENV_DIR}
cd ${VENV_DIR}
${PYTHON_INTERPRETER} -m venv .
source ./bin/activate
echo "${PYTHON_INTERPRETER} virtualenv activated"
cd ..

echo "Upgrading pip for ${PYTHON_INTERPRETER}..."
${PYTHON_INTERPRETER} -m pip install --upgrade pip

echo "Looking for wheels..."
cd ${HERE}/../wheelhouse

# Look for wheels based on Python version/platform
WHEELS=$(ls . | grep "${PYTHON_TAG}-${PYTHON_TAG}m-${PLATFORM}" --include .whl)
SAVEIFS=${IFS}
IFS=$'\n'
WHEELS_LIST=(${WHEELS})
IFS=${SAVEIFS}

for wheel in ${WHEELS_LIST}; do
    echo "Installing ${wheel}..."
    ${PYTHON_INTERPRETER} -m pip install --force-reinstall ${wheel}

    echo "-----------------------"
    echo "Testing ${wheel}"

    IS_LIBPSP=$(${PYTHON_INTERPRETER} -c "import perspective;print(perspective.is_libpsp())")

    echo "-----------------------"

    if [ "${IS_LIBPSP}" != "True" ]; then
        echo "${wheel} failed to import with error: ${IS_LIBPSP}"
        echo "${VENV_DIR} has been preserved for debugging"
        exit 1
    else
        echo "${wheel} imported correctly!"
    fi
done

echo "Cleaning up ${VENV_DIR}"
rm -rf ${HERE}/../test_wheel_venvs/${VENV_DIR}

exit 0