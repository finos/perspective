# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from .table import Table

# `PerspectiveCppError` is the error type raised from the C++ binding.
# To catch all exceptions from Perspective, catch `PerspectiveError` and `PerspectiveCppError`.
from .libbinding import PerspectiveCppError

__all__ = ["Table", "PerspectiveCppError"]
