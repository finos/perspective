################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import os
from logging import critical
from shutil import copy


def is_libpsp():
    """Was libbinding successfully loaded in this module?"""
    return __is_libpsp__


__is_libpsp__ = True

try:
    # Load all `libbinding` depending modules in one go, otherwise nothing
    # dependent on `libbinding` is exposed.
    from .table import *  # noqa: F401, F403
    from .manager import *  # noqa: F401, F403
    from .tornado_handler import *  # noqa: F401, F403
    from .viewer import *  # noqa: F401, F403
    from .table.libbinding import make_computations
    make_computations()
except ImportError:
    # On Manylinux builds, `auditwheel` fails to copy `libpsp.so` and
    # `libtbb.so`, which `libbinding.so` depends on. Before
    # `auditwheel repair`, the `rpath` of `libbinding.so` contains `$ORIGIN`,
    # which allows it to reference shared libraries in the same directory.
    # However, `auditwheel repair`  overwrites the `rpath` with its own
    # `perspective_python.libs` directory, which means `libpsp.so` and
    # `libtbb.so` are inaccessible.

    # Here, we check for the existence of `perspective_python.libs`
    # in the install directory (usually `site-packages`), and if the directory
    # is present and `libpsp.so` and `libtbb.so` are present in
    # `perspective_python/table`, the .so files are copied into
    # `perspective_python.libs` and thus made available to `libbinding.so`.

    # See https://github.com/pypa/auditwheel/issues/69 for more details.
    here = os.path.abspath(os.path.dirname(__file__))

    table_dir = os.path.join(here, "table")

    print("Looking for C++ bindings in {}".format(table_dir))
    # look for the three shared libraries: libbinding.so, libpsp.so, libtbb.so
    psp_libraries = ("libbinding.so", "libpsp.so", "libtbb.so")
    psp_library_paths = [os.path.join(table_dir, lib) for lib in psp_libraries]
    has_libraries = True

    for library_path in psp_library_paths:
        print("Checking {}".format(library_path))
        has_libraries = has_libraries and os.path.exists(library_path)

    # check that perspective_python.lib exists - the manylinux library dir
    # that is referenced in `libbinding.so`'s rpath
    manylinux_library_dir = os.path.join(here, "..", "perspective_python.lib")

    print("Bindings exist: {}, {} is present: {}".format(has_libraries, manylinux_library_dir, os.path.exists(manylinux_library_dir)))

    if has_libraries and os.path.exists(manylinux_library_dir):
        print("C++ bindings cannot be referenced - "
              "attempting to copy bindings into Manylinux library directory.\n"
              "See https://github.com/pypa/auditwheel/issues/69 for more details.")

        # copy libpsp and libtbb into the manylinux library directory
        for library_path in psp_library_paths[1:]:
            print("Copying `{}` into `{}`".format(library_path, manylinux_library_dir))
            copy(library_path, manylinux_library_dir)
            print("Copied `{}` into `{}`".format(library_path, manylinux_library_dir))

        # and then try to import all over again - if it does not throw then
        # set __is_libpsp__ to true
        try:
            from .table import *  # noqa: F401, F403
            from .manager import *  # noqa: F401, F403
            from .tornado_handler import *  # noqa: F401, F403
            from .viewer import *  # noqa: F401, F403
            from .table.libbinding import make_computations
            make_computations()
            __is_libpsp__ = True
        except ImportError as e:
            __is_libpsp__ = False
            raise e
    else:
        __is_libpsp__ = False
finally:
    # catches all failures - no libraries, no manylinux libraries, etc.
    if not __is_libpsp__:
        critical("Failed to import C++ bindings for Perspective "
                 "probably as it could not be built for your architecture "
                 "(check install logs for more details).\n"
                 "You can still use `PerspectiveWidget` in client mode using JupyterLab.",
                 exc_info=True)
