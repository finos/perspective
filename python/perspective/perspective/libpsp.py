#  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
#  ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
#  ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
#  ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
#  ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
#  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
#  ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
#  ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
#  ┃ This file is part of the Perspective library, distributed under the terms ┃
#  ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
#  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

from logging import critical
import os


def is_libpsp():
    """Was libpsppy successfully loaded in this module?"""
    return __is_libpsp__


__is_libpsp__ = True

try:
    # Load all `libpsppy` depending modules in one go, otherwise nothing
    # dependent on `libpsppy` is exposed.
    from .table import *
    from .manager import *
    from .viewer import *
    from .table.libpsppy import (
        init_expression_parser,
    )

    def set_threadpool_size(nthreads):
        """Sets the size of the global Perspective thread pool, up to the
        total number of available cores.  Passing an explicit
        `None` sets this limit to the detected hardware concurrency from the
        environment, which is also the default if this method is never called.
        `set_threadpool_size()` must be called before any other
        `perspective-python` API calls, and cannot be changed after such a call.
        """
        os.environ["OMP_THREAD_LIMIT"] = "0" if nthreads is None else str(nthreads)

    init_expression_parser()
except ImportError:
    __is_libpsp__ = False
    critical(
        "Failed to import C++ bindings for Perspective " "probably as it could not be built for your architecture " "(check install logs for more details).\n",
        exc_info=True,
    )
    critical("You can still use `PerspectiveWidget` in client mode using JupyterLab.")
