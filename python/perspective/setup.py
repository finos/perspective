# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from setuptools import setup, Extension
from setuptools.command.build_ext import build_ext
from distutils.version import LooseVersion
from codecs import open
import io
import os
import os.path
import re
import platform
import sys
import subprocess
import shutil

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

with open(os.path.join(here, 'requirements.txt'), encoding='utf-8') as f:
    requires = f.read().split()

with open(os.path.join(here, 'requirements-dev.txt'), encoding='utf-8') as f:
    requires_test = f.read().split()


def get_version(file, name='__version__'):
    """Get the version of the package from the given file by
    executing it and extracting the given `name`.
    """
    path = os.path.realpath(file)
    version_ns = {}
    with io.open(path, encoding="utf8") as f:
        exec(f.read(), {}, version_ns)
    return version_ns[name]


version = get_version(os.path.join(here, 'perspective', 'core', '_version.py'))


class PSPExtension(Extension):
    def __init__(self, name, sourcedir=''):
        Extension.__init__(self, name, sources=[])
        self.sourcedir = os.path.abspath(sourcedir)


class PSPBuild(build_ext):
    def run(self):
        self.run_cmake()
        self.run_node()

    def run_node(self):
        self.cmd = shutil.which('yarn')
        if not self.cmd:
            self.cmd = shutil.which('npm')
            if not self.cmd:
                raise RuntimeError(
                    "Yarn or npm must be installed to build the following extensions: " +
                    ", ".join(e.name for e in self.extensions))

        try:
            subprocess.check_output([self.cmd, '--version'])
        except OSError:
            raise RuntimeError(
                "Yarn or npm must be installed to build the following extensions: " +
                ", ".join(e.name for e in self.extensions))

        self.build_extension_node()

    def run_cmake(self):
        try:
            out = subprocess.check_output(['cmake', '--version'])
        except OSError:
            raise RuntimeError(
                "CMake must be installed to build the following extensions: " +
                ", ".join(e.name for e in self.extensions))

        if platform.system() == "Windows":
            cmake_version = LooseVersion(re.search(r'version\s*([\d.]+)',
                                                   out.decode()).group(1))
            if cmake_version < '3.1.0':
                raise RuntimeError("CMake >= 3.1.0 is required on Windows")

        for ext in self.extensions:
            self.build_extension_cmake(ext)

    def build_extension_node(self):
        env = os.environ.copy()
        if not os.path.exists(self.build_temp):
            os.makedirs(self.build_temp)
        install = [self.cmd] if 'yarn' in self.cmd else [self.cmd, 'install']
        build = [self.cmd, 'build'] if 'yarn' in self.cmd else [self.cmd, 'run', 'build']

        subprocess.check_call(install, cwd=self.build_temp, env=env)
        subprocess.check_call(build, cwd=self.build_temp, env=env)
        print()  # Add an empty line for cleaner output

    def build_extension_cmake(self, ext):
        extdir = os.path.abspath(
            os.path.dirname(self.get_ext_fullpath(ext.name)))
        cfg = 'Debug' if self.debug else 'Release'

        cmake_args = [
            '-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=' + str(os.path.join(extdir, 'perspective', 'table')),
            '-DCMAKE_BUILD_TYPE=' + cfg,
            '-DPSP_CPP_BUILD=1',
            '-DPSP_WASM_BUILD=0',
            '-DPSP_PYTHON_BUILD=1',
            '-DPSP_CPP_BUILD_TESTS=1'
        ]

        build_args = ['--config', cfg]

        if platform.system() == "Windows":
            cmake_args += ['-DCMAKE_LIBRARY_OUTPUT_DIRECTORY_{}={}'.format(
                cfg.upper(),
                extdir)]
            if sys.maxsize > 2**32:
                cmake_args += ['-A', 'x64']
            build_args += ['--', '/m']
        else:
            cmake_args += ['-DCMAKE_BUILD_TYPE=' + cfg]
            build_args += ['--', '-j2' if os.environ.get('DOCKER', '') else '-j4']

        env = os.environ.copy()
        env['PSP_ENABLE_PYTHON'] = '1'

        env['CXXFLAGS'] = '{} -DVERSION_INFO=\\"{}\\"'.format(
            env.get('CXXFLAGS', ''),
            self.distribution.get_version())
        if not os.path.exists(self.build_temp):
            os.makedirs(self.build_temp)
        subprocess.check_call(['cmake', os.path.abspath(os.path.join(ext.sourcedir, '..', '..', 'cpp', 'perspective'))] + cmake_args,
                              cwd=self.build_temp, env=env)
        subprocess.check_call(['cmake', '--build', '.'] + build_args,
                              cwd=self.build_temp)
        print()  # Add an empty line for cleaner output


setup(
    name='perspective-python',
    version=version,
    description='Python bindings and JupyterLab integration for Perspective',
    long_description=long_description,
    url='https://github.com/finos/perspective',
    author='Perspective Authors',
    author_email='open_source@jpmorgan.com',
    license='Apache 2.0',
    install_requires=requires,
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
    ],

    keywords='analytics tools plotting',
    packages=['perspective'],
    # package_data={'': ['../cpp', '../cmake']},
    include_package_data=True,
    zip_safe=False,
    extras_require={
        'test': [
            'pytest',
            'pytest-check-links',
            'requests'
        ],
    },
    ext_modules=[PSPExtension('perspective')],
    cmdclass=dict(build_ext=PSPBuild),
)
