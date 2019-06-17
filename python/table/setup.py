# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from setuptools import setup, Extension
from distutils.version import LooseVersion
from codecs import open
from setuptools.command.build_ext import build_ext
import io
import os
import os.path
import os
import re
import sys
import platform
import subprocess

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

with open(os.path.join(here, 'requirements.txt'), encoding='utf-8') as f:
    requires = f.read().split()

try:
    # non dev install
    import perspective.core
except (ImportError, ModuleNotFoundError):
    try:
        if not os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'perspective', 'perspective', 'core')):
            raise Exception('Must install perspective-python')
        if os.path.exists(os.path.abspath(os.path.join('perspective', 'core'))):
            os.unlink(os.path.abspath(os.path.join('perspective', 'core')))
        os.symlink(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'perspective', 'perspective', 'core')), os.path.abspath(os.path.join('perspective', 'core')), target_is_directory=True)
    except ImportError:
        raise Exception('Must install perspective-python')

if sys.version_info.major < 3 or sys.version_info.minor < 7:
    raise Exception('Must be python3.7 or above')


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


class CMakeExtension(Extension):
    def __init__(self, name, sourcedir=''):
        Extension.__init__(self, name, sources=[])
        self.sourcedir = os.path.abspath(sourcedir)


class CMakeBuild(build_ext):
    def run(self):
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
            self.build_extension(ext)

    def build_extension(self, ext):
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
    name='perspective-python.table',
    version=version,
    description='Analytics library',
    long_description=long_description,
    url='https://github.com/finos/perspective',
    author='Tim Paine',
    author_email='timothy.k.paine@gmail.com',
    license='Apache 2.0',
    install_requires=requires,
    python_requires='>=3.7',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
    ],

    keywords='analytics tools plotting',
    packages=['perspective.table'],
    include_package_data=True,
    zip_safe=False,
    extras_require={'dev': requires + ['pytest', 'pytest-cov', 'pylint', 'flake8', 'mock']},
    ext_modules=[
        CMakeExtension('perspective'),
    ],
    cmdclass=dict(build_ext=CMakeBuild),
)
