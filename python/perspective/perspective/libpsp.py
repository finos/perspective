################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from logging import critical
import os


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
    from .table.libbinding import (
        init_expression_parser,
    )

    def set_threadpool_size(nthreads):
        """Sets the size of the global Perspective thread pool, up to the
        total number of available cores, which can be set explicity by
        setting `nthreads` to `None`.
        """
        os.environ["OMP_THREAD_LIMIT"] = "0" if nthreads is None else str(nthreads)

    init_expression_parser()
except ImportError:
    __is_libpsp__ = False
    critical(
        "Failed to import C++ bindings for Perspective "
        "probably as it could not be built for your architecture "
        "(check install logs for more details).\n",
        exc_info=True,
    )
    critical("You can still use `PerspectiveWidget` in client mode using JupyterLab.")
