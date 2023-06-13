#!/bin/bash

# usage: with_emsdk.sh path/to/emsdk <version> [cmd...]

emsdk_path=$1
expected_version=$2
cmd=("${@:3}")

spew_equals_version() {
    local spew=$1
    local expected=$2
    local extracted
    extracted=$(echo "$spew" | grep -Eo '\d+\.\d+\.\d+')
    [[ "$expected" == "$extracted" ]]
}

selftest() {
    local spew="emcc (Emscripten gcc/clang-like replacement + linker emulating GNU ld) 3.1.14 (4343cbec72b7db283ea3bda1adc6cb1811ae9a73)"
    spew_equals_version "$spew" "3.1.14" || { echo "test failed $LINENO"; exit 1; }
}

if [[ "$1" == "--selftest" ]]
then
    selftest
    exit
fi

source "$emsdk_path"/emsdk_env.sh >/dev/null 2>&1
version_spew=$(emcc --version 2>&1 | head -n 1)
if spew_equals_version "$version_spew" "$expected_version"
then
    "${cmd[@]}"
else
    echo "expected emsdk version: $expected_version"
    echo "actual emsdk version: $version_spew"
    echo "To fix:"
    echo "  rm -rf .emsdk"
    echo "  node scripts/install_emsdk.js"
    exit 1
fi
