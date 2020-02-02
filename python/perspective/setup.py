# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from __future__ import print_function
from setuptools import setup, find_packages, Extension
from setuptools.command.build_ext import build_ext
from distutils.version import LooseVersion
from distutils import sysconfig
from codecs import open
import io
import logging
import os
import os.path
import re
import platform
import sys
import subprocess
from shutil import rmtree
try:
    from shutil import which
    CPU_COUNT = os.cpu_count()
except ImportError:
    # Python2
    try:
        from backports.shutil_which import which
    except ImportError:
        which = lambda x: x  # just rely on path
    import multiprocessing
    CPU_COUNT = multiprocessing.cpu_count()

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

requires = [
    'ipywidgets>=7.5.1',
    'numpy>=1.13.1',
    'pandas>=0.22.0',
    'psutil>=5.4.8',
    'python-dateutil>=2.8.0',
    'six>=1.11.0',
    'traitlets>=4.3.2',
    'zerorpc>=0.6.1',
]

if sys.version_info.major < 3:
    requires.append("backports.shutil-which")

if sys.version_info.minor < 7:
    raise Exception("Requires Python 2.7/3.7 or later")

if sys.platform == "darwin":
    requires.append("pyarrow==0.15.1")  # Use standard pyarrow
elif sys.platform == "linux":
    logging.warning("Cannot use pyarrow wheel (https://github.com/pypa/manylinux/issues/118), make sure to install from source using a C++11 compatible compiler (e.g. gcc 4.9.3+)")
else:
    # don't add pyarrow on windows
    pass

requires_dev = [
    'Faker>=1.0.0',
    'flake8>=3.7.8',
    'mock',
    'pybind11>=2.4.0',
    'pytest>=4.3.0',
    'pytest-cov>=2.6.1',
    'pytest-check-links',
    'pytz>=2018.9',
    'Sphinx>=1.8.4',
    'sphinx-markdown-builder>=0.5.2',
] + requires


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

ZMQ_ERROR = """`zerorpc` install failed, node module will be unavailable.
Run `yarn add zerorpc` to fix."""


class PSPExtension(Extension):
    def __init__(self, name, sourcedir='dist'):
        Extension.__init__(self, name, sources=[])
        self.sourcedir = os.path.abspath(sourcedir)


class PSPBuild(build_ext):
    def run(self):
        self.run_cmake()
        self.run_node()

    def run_node(self):
        self.npm_cmd = which('yarn')
        if not self.npm_cmd:
            self.npm_cmd = which('npm')
            if not self.npm_cmd:
                raise RuntimeError(
                    "Yarn or npm must be installed to build the following extensions: " +
                    ", ".join(e.name for e in self.extensions))

        try:
            subprocess.check_output([self.npm_cmd, '--version'])
        except OSError:
            raise RuntimeError(
                "Yarn or npm must be installed to build the following extensions: " +
                ", ".join(e.name for e in self.extensions))

        self.build_extension_node()

    def run_cmake(self):
        self.cmake_cmd = which('cmake')
        try:
            out = subprocess.check_output([self.cmake_cmd, '--version'])
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
        try:
            if not os.path.exists("node_modules"):
                install = [self.npm_cmd] if 'yarn' in self.npm_cmd else [self.npm_cmd, 'install']
                subprocess.check_call(install, cwd=self.build_temp, env=env)
                # if not os.path.exists(os.path.join("node_modules", "zerorpc")):
                install = [self.npm_cmd, "add", "zerorpc"] if 'yarn' in self.npm_cmd else [self.npm_cmd, 'install', 'zerorpc']
                subprocess.check_call(install, cwd=self.build_temp, env=env)
            build = [self.npm_cmd, 'webpack'] if 'yarn' in self.npm_cmd else [self.npm_cmd, 'run', 'webpack']
            subprocess.check_call(build, cwd=self.build_temp, env=env, stdout=open(os.devnull, 'wb'), stderr=open(os.devnull, 'wb'))
            print("ZeroMQ node client built successfully")
        except (subprocess.CalledProcessError, OSError):
            print(ZMQ_ERROR)
        print()  # Add an empty line for cleaner output

    def build_extension_cmake(self, ext):
        extdir = os.path.abspath(os.path.dirname(self.get_ext_fullpath(ext.name)))
        cfg = 'Debug' if self.debug else 'Release'

        cmake_args = [
            '-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=' + os.path.abspath(os.path.join('perspective', 'table')).replace('\\', '/'),
            '-DCMAKE_BUILD_TYPE=' + cfg,
            '-DPSP_CPP_BUILD=1',
            '-DPSP_WASM_BUILD=0',
            '-DPSP_PYTHON_BUILD=1',
            '-DPSP_CPP_BUILD_TESTS=0',
            '-DPSP_PYTHON_VERSION={}'.format(platform.python_version()),
            '-DPYTHON_EXECUTABLE={}'.format(sys.executable).replace('\\', '/'),
            '-DPython_ROOT_DIR={}'.format(sysconfig.PREFIX).replace('\\', '/'),
            '-DPython_ROOT={}'.format(sysconfig.PREFIX).replace('\\', '/'),
            '-DPSP_CMAKE_MODULE_PATH={folder}'.format(folder=os.path.join(ext.sourcedir, 'cmake')).replace('\\', '/'),
            '-DPSP_CPP_SRC={folder}'.format(folder=ext.sourcedir).replace('\\', '/'),
            '-DPSP_PYTHON_SRC={folder}'.format(folder=os.path.join(ext.sourcedir, "..", 'perspective').replace('\\', '/'))
        ]

        build_args = ['--config', cfg]

        if platform.system() == "Windows":
            cmake_args.extend([
                '-DCMAKE_LIBRARY_OUTPUT_DIRECTORY_{}={}'.format(
                    cfg.upper(),
                    extdir).replace('\\', '/'),
                '-G', 'Visual Studio 14 2015'])
            if sys.maxsize > 2**32:
                # build 64 bit to match python
                cmake_args += ['-A', 'x64']
            build_args += ['--', '/m', '/p:Configuration={}'.format(cfg)]
        else:
            cmake_args += ['-DCMAKE_BUILD_TYPE=' + cfg]
            build_args += ['--', '-j2' if os.environ.get('DOCKER', '') else '-j{}'.format(CPU_COUNT)]

        env = os.environ.copy()
        env['PSP_ENABLE_PYTHON'] = '1'
        env["PYTHONPATH"] = os.path.sep.join((os.environ.get('PYTHONPATH', ''), os.path.pathsep.join((os.path.join(os.path.dirname(os.__file__), 'site-packages'), os.path.dirname(os.__file__)))))

        if not os.path.exists(self.build_temp):
            os.makedirs(self.build_temp)
        subprocess.check_call([self.cmake_cmd, os.path.abspath(ext.sourcedir)] + cmake_args, cwd=self.build_temp, env=env, stderr=subprocess.STDOUT)
        subprocess.check_call([self.cmake_cmd, '--build', '.'] + build_args, cwd=self.build_temp, env=env, stderr=subprocess.STDOUT)
        print()  # Add an empty line for cleaner output


setup(
    name='perspective-python',
    version=version,
    description='Python bindings and JupyterLab integration for Perspective',
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/finos/perspective',
    author='Perspective Authors',
    author_email='open_source@jpmorgan.com',
    license='Apache 2.0',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
    ],

    keywords='analytics tools plotting',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    install_requires=requires,
    extras_require={
        'dev': requires_dev,
    },
    ext_modules=[PSPExtension('perspective')],
    cmdclass=dict(build_ext=PSPBuild),
)
