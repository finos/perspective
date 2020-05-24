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
from setuptools.command.sdist import sdist
from wheel.bdist_wheel import bdist_wheel
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
from jupyter_packaging import (
    create_cmdclass, install_npm, ensure_targets,
    combine_commands, ensure_python, get_version
)

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

# need py2.7 or py3.7+
if sys.version_info.minor < 7:
    raise Exception("Requires Python 2.7/3.7 or later")

# Setup some helper variables
here = os.path.abspath(os.path.dirname(__file__))

# read description from local readme
with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

# required packages
requires = [
    'ipywidgets>=7.5.1',
    'future>=0.16.0',
    'numpy>=1.13.1',
    'pandas>=0.22.0',
    'pyarrow==0.15.1',
    'python-dateutil>=2.8.0',
    'six>=1.11.0',
    'traitlets>=4.3.2',
]

# required packages to dev/run tests
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

# read version from bumpversion managed file
version = get_version(os.path.join(here, 'perspective', 'core', '_version.py'))

# Extension class for running our cmake build
class PSPExtension(Extension):
    def __init__(self, name, sourcedir='dist'):
        Extension.__init__(self, name, sources=[])
        self.sourcedir = os.path.abspath(sourcedir)

# Extension class for running our cmake build
class PSPBuild(build_ext):
    def run(self):
        self.run_cmake()

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

    def build_extension_cmake(self, ext):
        extdir = os.path.abspath(os.path.dirname(self.get_ext_fullpath(ext.name)))
        cfg = 'Debug' if self.debug else 'Release'

        cmake_args = [
            '-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=' + os.path.abspath(os.path.join(extdir, 'perspective', 'table')).replace('\\', '/'),
            '-DCMAKE_BUILD_TYPE=' + cfg,
            '-DPSP_CPP_BUILD=1',
            '-DPSP_WASM_BUILD=0',
            '-DPSP_PYTHON_BUILD=1',
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
            import distutils.msvccompiler as dm
            msvc = {'12': 'Visual Studio 12 2013',
                    '14': 'Visual Studio 14 2015',
                    '14.1': 'Visual Studio 15 2017'}.get(dm.get_build_version(), 'Visual Studio 15 2017')

            cmake_args.extend([
                '-DCMAKE_LIBRARY_OUTPUT_DIRECTORY_{}={}'.format(
                    cfg.upper(),
                    extdir).replace('\\', '/'),
                '-G', os.environ.get('PSP_GENERATOR', msvc)])

            if sys.maxsize > 2**32:
                # build 64 bit to match python
                cmake_args += ['-A', 'x64']

            build_args += ['--', '/m:{}'.format(CPU_COUNT), '/p:Configuration={}'.format(cfg)]
        else:
            cmake_args += ['-DCMAKE_BUILD_TYPE=' + cfg]
            build_args += ['--', '-j2' if os.environ.get('DOCKER', '') else '-j{}'.format(CPU_COUNT)]

        env = os.environ.copy()
        env['PSP_ENABLE_PYTHON'] = '1'
        env['OSX_DEPLOYMENT_TARGET'] = '10.9'
        env["PYTHONPATH"] = os.path.sep.join((os.environ.get('PYTHONPATH', ''), os.path.pathsep.join((os.path.join(os.path.dirname(os.__file__), 'site-packages'), os.path.dirname(os.__file__)))))

        if not os.path.exists(self.build_temp):
            os.makedirs(self.build_temp)
        subprocess.check_call([self.cmake_cmd, os.path.abspath(ext.sourcedir)] + cmake_args, cwd=self.build_temp, env=env, stderr=subprocess.STDOUT)
        subprocess.check_call([self.cmake_cmd, '--build', '.'] + build_args, cwd=self.build_temp, env=env, stderr=subprocess.STDOUT)
        print()  # Add an empty line for cleaner output


def _check_cpp_files():
    for file in ('CMakeLists.txt', 'cmake', 'src'):
        path = os.path.abspath(os.path.join(here, 'dist', file))
        if not os.path.exists(path):
            raise Exception("Path is missing! {}\nMust run `yarn build_python` before building sdist so cmake/c++ files are installed".format(path))


def _check_js_files():
    if not os.path.exists(os.path.join(here, 'perspective', 'labextension', 'finos-perspective-jupyterlab-{}.tgz'.format(version))):
        raise Exception("JupyterLab extension pack is missing!\nMust run `yarn build` or `yarn _js_for_dist` before building sdist so js files are installed")

    if not os.path.exists(os.path.join(here, 'perspective', 'nbextension', 'static', 'index.js')) or \
        not os.path.exists(os.path.join(here, 'perspective', 'nbextension', 'static', 'extension.js')):
        raise Exception("JupyterLab extension pack is missing!\nMust run `yarn build` or `yarn _js_for_dist` before building sdist so js files are installed")

# Helper to ensure all the necessary files are sdist'ed
class PSPCheckSDist(sdist):
    def run(self):
        self.run_check()
        super(PSPCheckSDist, self).run()

    def run_check(self):
        _check_cpp_files()
        _check_js_files()

# Helper to ensure all the necessary files are bdist'ed
class PSPCheckBDist(bdist_wheel):
    def run(self):
        self.run_check()
        super(PSPCheckBDist, self).run()

    def run_check(self):
        _check_js_files()


# Files for lab/notebook extension
package_data_spec = {
    "perspective": [
        'nbextension/static/*.*js*',
        'labextension/*.tgz'
    ]
}

# Files for lab/notebook extension
data_files_spec = [
    ('share/jupyter/nbextensions/',os.path.join(here, "perspective", 'nbextension', 'static'), '*.js*'),
    ('share/jupyter/lab/extensions', os.path.join(here, "perspective", 'labextension'), '*.tgz'),
    ('etc/jupyter/nbconfig/notebook.d' , here, 'finos-perspective-python.json')
]

# Create a command class to ensure js files are installed
cmdclass = create_cmdclass('ensure_js', package_data_spec=package_data_spec, data_files_spec=data_files_spec)
cmdclass['ensure_js'] = combine_commands(
    ensure_targets([
        os.path.join(here, 'perspective', 'nbextension', 'static', 'index.js'),
        os.path.join(here, 'perspective', 'nbextension', 'static', 'labextension.js'),
        os.path.join(here, 'perspective', 'nbextension', 'static', 'extension.js'),
    ]),
)
cmdclass['build_ext'] = PSPBuild
cmdclass['sdist'] = PSPCheckSDist


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
    platforms="Linux, Mac OS X, Windows",
    keywords=['Jupyter', 'Jupyterlab', 'Widgets', 'IPython', 'Streaming', 'Data', 'Analytics', 'Plotting'],
    packages=find_packages(),
    include_package_data=True,
    data_files=[
        ('share/jupyter/nbextensions/finos-perspective-jupyterlab', [
            'perspective/nbextension/static/extension.js',
            'perspective/nbextension/static/index.js',
            'perspective/nbextension/static/labextension.js',
        ]),
        ('etc/jupyter/nbconfig/notebook.d', ['finos-perspective-jupyterlab.json'])
    ],
    zip_safe=False,
    install_requires=requires,
    extras_require={
        'dev': requires_dev,
    },
    ext_modules=[PSPExtension('perspective')],
    cmdclass=cmdclass,
)
