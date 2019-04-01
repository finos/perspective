# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import os
import os.path
import fnmatch
import pathlib
from shutil import copy
from setuptools import setup, Extension
from setuptools.command.build_ext import build_ext as build_ext_orig
from codecs import open

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()


class CMakeExtension(Extension):

    def __init__(self, name):
        # don't invoke the original build_ext for this special extension
        super().__init__(name, sources=[])


class build_ext(build_ext_orig):

    def run(self):
        for ext in self.extensions:
            self.build_cmake(ext)
        super().run()

    def build_cmake(self, ext):
        cwd = pathlib.Path().absolute()
        directory = os.path.abspath(os.path.join(pathlib.Path().absolute(), "..", "..", "cpp", "perspective"))

        # these dirs will be created in build_py, so if you don't have
        # any python sources to bundle, the dirs will be missing
        build_temp = pathlib.Path(self.build_temp)
        build_temp.mkdir(parents=True, exist_ok=True)
        extdir = pathlib.Path(self.get_ext_fullpath(ext.name))
        extdir.mkdir(parents=True, exist_ok=True)

        # example of cmake args
        config = 'Debug' if self.debug else 'Release'
        cmake_args = [
            '-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=' + str(os.path.join(extdir.parent.absolute(), 'perspective', 'table')),
            '-DCMAKE_BUILD_TYPE=' + config,
            '-DPSP_CPP_BUILD=1',
            '-DPSP_WASM_BUILD=0',
            '-DPSP_PYTHON_BUILD=1',
        ]

        # example of build args
        build_args = [
            '--config', config,
            '--', '-j2' if os.environ.get('DOCKER', '') else '-j4',
        ]
        os.environ['PSP_ENABLE_PYTHON'] = '1'

        print(str(build_temp))
        print(str(directory))
        os.chdir(str(build_temp))
        self.spawn(['cmake', str(directory)] + cmake_args)
        if not self.dry_run:
            self.spawn(['cmake', '--build', '.', ] + build_args)
        os.chdir(str(cwd))

        def find(pattern, path):
            for root, dirs, files in os.walk(path):
                for name in files:
                    if fnmatch.fnmatch(name, pattern):
                        return os.path.join(root, name)

        binding = find('libbinding.*', 'build')
        library = find('libpsp.*', 'build')

        print("copying libbinding.so")
        copy(binding, 'perspective/table')

        print("copying libpsp.so")
        copy(library, 'perspective/table')


setup(
    name='perspective-python.table',
    version='0.1.3',
    description='Analytics library',
    long_description=long_description,
    url='https://github.com/jpmorganchase/perspective',
    author='Tim Paine',
    author_email='timothy.k.paine@gmail.com',
    license='Apache 2.0',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
    ],

    keywords='analytics tools plotting',
    packages=['perspective.table'],
    zip_safe=False,
    ext_modules=[
        CMakeExtension('perspective')
    ],
    cmdclass={
        'build_ext': build_ext,
    }
)
