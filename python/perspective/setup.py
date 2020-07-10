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

try:
    import numpy
    numpy_includes = numpy.get_include()
except ImportError:
    print('Must install numpy prior to installing perspective!')
    raise

try:
    import pyarrow
    pyarrow_includes = pyarrow.get_include()
    pyarrow_library_dirs = pyarrow.get_library_dirs()
    pyarrow_libraries = pyarrow.get_libraries()
except ImportError:
    print('Must install pyarrow prior to installing perspective!')
    raise

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

requires = [
    'ipywidgets>=7.5.1',
    'future>=0.16.0',
    'numpy>=1.13.1',
    'pandas>=0.22.0',
    'pyarrow==0.16.0',
    'python-dateutil>=2.8.0',
    'six>=1.11.0',
    'traitlets>=4.3.2',
]

if sys.version_info.major < 3:
    requires.append("backports.shutil-which")

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

extensions = [
    Extension('perspective.table.libpsp',
              define_macros=[('PSP_ENABLE_PYTHON', '1'), ('PSP_DEBUG', os.environ.get('PSP_DEBUG', '0'))],
              include_dirs=[
                            'perspective/include/',
                            'dist/src/include/',
                            'dist/third/date/include/',
                            'dist/third/hopscotch/include/',
                            'dist/third/ordered-map/include/',
                            'dist/third/pybind11/include/',
                            numpy_includes,
                            pyarrow_includes,
                            ],
              libraries=pyarrow_libraries,
              library_dirs=pyarrow_library_dirs,
              extra_compile_args=['-std=c++1y'] if os.name != 'nt' else ['/std:c++14'],
              sources=sources),
    Extension('perspective.table.libbinding',
              define_macros=[('PSP_ENABLE_PYTHON', '1'), ('PSP_DEBUG', os.environ.get('PSP_DEBUG', '0'))],
              include_dirs=[
                            'perspective/include/',
                            'dist/src/include/',
                            'dist/third/date/include/',
                            'dist/third/hopscotch/include/',
                            'dist/third/ordered-map/include/',
                            'dist/third/pybind11/include/',
                            numpy_includes,
                            pyarrow_includes,
                            ],
              libraries=pyarrow_libraries,
              library_dirs=pyarrow_library_dirs,
              extra_compile_args=['-std=c++1y'] if os.name != 'nt' else ['/std:c++14'],
              sources=binding_sources)
]

class PSPCheckSDist(sdist):
    def run(self):
        self.run_check()
        super(PSPCheckSDist, self).run()

    def run_check(self):
        for file in ('src', 'third'):
            path = os.path.abspath(os.path.join(here, 'dist', file))
            if not os.path.exists(path):
                raise Exception("Path is missing! {}\nMust run `yarn build_python` before building sdist so c++ files are installed".format(path))


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
    cmdclass=dict(sdist=PSPCheckSDist)
)
