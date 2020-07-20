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
from codecs import open
import io
import os
import os.path
import platform
import sys
import shutil

# ******************************************** #
# Get number of cores for numpy parallel build #
# ******************************************** #
if sys.version_info.major == 3:
    CPU_COUNT = os.cpu_count()
else:
    # Python2
    import multiprocessing
    CPU_COUNT = multiprocessing.cpu_count()

# *************************************** #
# Numpy build path and compiler toolchain #
# *************************************** #
try:
    import numpy
    print('using numpy from {}'.format(os.path.dirname(numpy.__file__)))
    numpy_includes = numpy.get_include()

    # enable numpy faster compiler
    from numpy.distutils.ccompiler import CCompiler_compile
    import distutils.ccompiler
    distutils.ccompiler.CCompiler.compile = CCompiler_compile
    os.environ['NPY_NUM_BUILD_JOBS'] = str(CPU_COUNT)

except ImportError:
    print('Must install numpy prior to installing perspective!')
    raise

# ****************** #
# PyArrow build path #
# ****************** #
try:
    import pyarrow
    print('using pyarrow from {}'.format(os.path.dirname(pyarrow.__file__)))
    pyarrow_includes = pyarrow.get_include()
    pyarrow_library_dirs = pyarrow.get_library_dirs()
    pyarrow_libraries = pyarrow.get_libraries()
except ImportError:
    print('Must install pyarrow prior to installing perspective!')
    raise

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

# ******************************** #
# Requires and platform validation #
# ******************************** #
requires = [
    'ipywidgets>=7.5.1',
    'future>=0.16.0',
    'numpy>=1.13.1',
    'pandas>=0.22.0',
    'pyarrow>=0.15.1,<0.17',
    'python-dateutil>=2.8.0',
    'six>=1.11.0',
    'traitlets>=4.3.2',
]

if sys.version_info.major < 3:
    requires.append("pathlib")

if os.name == 'nt' and not os.environ.get('PSP_SYSTEM_TBB', '') == '1':
    # helper to avoid dll fun
    requires.append('tbb==2019.0')

if (sys.version_info.major == 2 and sys.version_info.minor < 7) or \
   (sys.version_info.major == 3 and sys.version_info.minor < 6):
    raise Exception("Requires Python 2.7/3.6 or later")

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


# *********** #
# C++ sources #
# *********** #
sources = [
    'dist/src/cpp/aggregate.cpp',
    'dist/src/cpp/aggspec.cpp',
    'dist/src/cpp/arg_sort.cpp',
    'dist/src/cpp/arrow_loader.cpp',
    'dist/src/cpp/arrow_writer.cpp',
    'dist/src/cpp/base.cpp',
    'dist/src/cpp/base_impl_linux.cpp',
    'dist/src/cpp/base_impl_osx.cpp',
    'dist/src/cpp/base_impl_wasm.cpp',
    'dist/src/cpp/base_impl_win.cpp',
    'dist/src/cpp/binding.cpp',
    'dist/src/cpp/build_filter.cpp',
    'dist/src/cpp/column.cpp',
    'dist/src/cpp/comparators.cpp',
    'dist/src/cpp/compat.cpp',
    'dist/src/cpp/compat_impl_linux.cpp',
    'dist/src/cpp/compat_impl_osx.cpp',
    'dist/src/cpp/compat_impl_win.cpp',
    'dist/src/cpp/computed.cpp',
    'dist/src/cpp/computed_column_map.cpp',
    'dist/src/cpp/computed_function.cpp',
    'dist/src/cpp/config.cpp',
    'dist/src/cpp/context_base.cpp',
    'dist/src/cpp/context_grouped_pkey.cpp',
    'dist/src/cpp/context_handle.cpp',
    'dist/src/cpp/context_one.cpp',
    'dist/src/cpp/context_two.cpp',
    'dist/src/cpp/context_zero.cpp',
    'dist/src/cpp/custom_column.cpp',
    'dist/src/cpp/data.cpp',
    'dist/src/cpp/data_slice.cpp',
    'dist/src/cpp/data_table.cpp',
    'dist/src/cpp/date.cpp',
    'dist/src/cpp/dense_nodes.cpp',
    'dist/src/cpp/dense_tree_context.cpp',
    'dist/src/cpp/dense_tree.cpp',
    'dist/src/cpp/dependency.cpp',
    'dist/src/cpp/extract_aggregate.cpp',
    'dist/src/cpp/filter.cpp',
    'dist/src/cpp/flat_traversal.cpp',
    'dist/src/cpp/get_data_extents.cpp',
    'dist/src/cpp/gnode.cpp',
    'dist/src/cpp/gnode_state.cpp',
    'dist/src/cpp/histogram.cpp',
    'dist/src/cpp/logtime.cpp',
    'dist/src/cpp/mask.cpp',
    'dist/src/cpp/min_max.cpp',
    'dist/src/cpp/multi_sort.cpp',
    'dist/src/cpp/none.cpp',
    'dist/src/cpp/path.cpp',
    'dist/src/cpp/pivot.cpp',
    'dist/src/cpp/pool.cpp',
    'dist/src/cpp/port.cpp',
    'dist/src/cpp/process_state.cpp',
    'dist/src/cpp/raii.cpp',
    'dist/src/cpp/raii_impl_linux.cpp',
    'dist/src/cpp/raii_impl_osx.cpp',
    'dist/src/cpp/raii_impl_win.cpp',
    'dist/src/cpp/range.cpp',
    'dist/src/cpp/rlookup.cpp',
    'dist/src/cpp/scalar.cpp',
    'dist/src/cpp/schema_column.cpp',
    'dist/src/cpp/schema.cpp',
    'dist/src/cpp/slice.cpp',
    'dist/src/cpp/sort_specification.cpp',
    'dist/src/cpp/sparse_tree.cpp',
    'dist/src/cpp/sparse_tree_node.cpp',
    'dist/src/cpp/step_delta.cpp',
    'dist/src/cpp/storage.cpp',
    'dist/src/cpp/storage_impl_linux.cpp',
    'dist/src/cpp/storage_impl_osx.cpp',
    'dist/src/cpp/storage_impl_win.cpp',
    'dist/src/cpp/sym_table.cpp',
    'dist/src/cpp/table.cpp',
    'dist/src/cpp/time.cpp',
    'dist/src/cpp/traversal.cpp',
    'dist/src/cpp/traversal_nodes.cpp',
    'dist/src/cpp/tree_context_common.cpp',
    'dist/src/cpp/utils.cpp',
    'dist/src/cpp/update_task.cpp',
    'dist/src/cpp/view.cpp',
    'dist/src/cpp/view_config.cpp',
    'dist/src/cpp/vocab.cpp',

    # python-specific files
    'perspective/src/column.cpp',
]

binding_sources = [
    'perspective/src/accessor.cpp',
    'perspective/src/computed.cpp',
    'perspective/src/context.cpp',
    'perspective/src/fill.cpp',
    'perspective/src/numpy.cpp',
    'perspective/src/python.cpp',
    'perspective/src/serialization.cpp',
    'perspective/src/table.cpp',
    'perspective/src/utils.cpp',
    'perspective/src/view.cpp',
]

# **************************** #
# Compiler and extension setup #
# **************************** #
extra_link_args = os.environ.get('LDFLAGS', '').split()

if platform.system() == 'Darwin':
    extra_link_args.append('-Wl,-rpath,' + ',-rpath,'.join(['@loader_path//../../pyarrow/'] + pyarrow_library_dirs))
else:
    extra_link_args.append('-Wl,-rpath,' + ',-rpath,'.join(['$ORIGIN//../../pyarrow/'] + pyarrow_library_dirs[0]))


defines = [('PSP_ENABLE_PYTHON', '1'), ('PSP_DEBUG', os.environ.get('PSP_DEBUG', '0'))]
extra_compiler_args = os.environ.get('CFLAGS', '').split() + os.environ.get('CXXFLAGS', '').split()
library_dirs = pyarrow_library_dirs
libraries = pyarrow_libraries + ['tbb']

if os.name == 'nt':
    defines.extend([('BOOST_WINDOWS', '1'), ('WIN32', '1'), ('_WIN32', '1'), ('PERSPECTIVE_EXPORTS', '1')])
    extra_compiler_args.extend(['/std:c++14', '/MP'])
    runtime_library_dirs = []
    extra_objects = []
else:
    extra_compiler_args.append('-std=c++1y')
    runtime_library_dirs = pyarrow_library_dirs
    extra_objects = []

extensions = [
    Extension('perspective.table.libbinding',
              define_macros=defines,
              include_dirs=[
                  'perspective/include/',
                  'dist/src/include/',
                  'dist/third/boost/boost_1_71_0/',
                  'dist/third/date/include/',
                  'dist/third/hopscotch/include/',
                  'dist/third/ordered-map/include/',
                  'dist/third/pybind11/include/',
                  numpy_includes,
                  pyarrow_includes,
              ],
              libraries=libraries,
              library_dirs=library_dirs,
              runtime_library_dirs=runtime_library_dirs,
              extra_compile_args=extra_compiler_args,
              extra_link_args=extra_link_args,
              extra_objects=extra_objects,
              sources=sources + binding_sources)
]

# **************** #
# SDist validation #
# **************** #
class PSPCheckSDist(sdist):
    def run(self):
        self.run_check()
        super(PSPCheckSDist, self).run()

    def run_check(self):
        for file in ('src', 'third'):
            path = os.path.abspath(os.path.join(here, 'dist', file))
            if not os.path.exists(path):
                raise Exception("Path is missing! {}\nMust run `yarn build_python` before building sdist so c++ files are installed".format(path))


# *********************** #
# DLL utility for windows #
# *********************** #
if os.name == 'nt' and not os.environ.get('PSP_NO_DLL_COPY', '') == '1':
    class PSPBuild(build_ext):
        def run(self):
            # Run the standard build
            build_ext.run(self)

            print('copying dlls into build')
            self._copy_dlls()


        def _copy_dlls(self):
            import pathlib
            import os.path

            arrow_dlls = pathlib.Path(os.path.abspath(os.path.dirname(pyarrow.__file__))).glob("*.dll")
            for file in arrow_dlls:
                shutil.copy(str(file), os.path.join(os.path.dirname(self.get_ext_fullpath("perspective")), 'perspective', 'table').replace('\\', '/'))
else:
    PSPBuild = build_ext

# ***** #
# setup #
# ***** #
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
    ext_modules=extensions,
    cmdclass=dict(sdist=PSPCheckSDist, build_ext=PSPBuild)
)
