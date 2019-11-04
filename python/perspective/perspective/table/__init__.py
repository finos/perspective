# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from .table import Table


def is_libpsp():
    """Was libbinding successfully loaded in this module?"""
    return __is_libpsp__


__all__ = ["Table", "is_libpsp"]

__is_libpsp__ = True

try:
    from .libbinding import PerspectiveCppError  # noqa: F401
    __all__.append("PerspectiveCppError")
except ImportError:
    __is_libpsp__ = False
    pass
