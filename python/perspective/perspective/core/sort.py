################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from enum import Enum


class Sort(Enum):
    """The sort directions available for use in Perspective. Pass these into
    the `sort` argument of `PerspectiveWidget`.

    Examples:
        >>> widget = PerspectiveWidget(data, sort=[["a", Sort.DESC]])
    """

    ASC = "asc"
    ASC_ABS = "asc abs"
    COL_ASC = "col asc"
    COL_ASC_ABS = "col asc abs"
    COL_DESC = "col desc"
    COL_DESC_ABS = "col desc abs"
    DESC = "desc"
    DESC_ABS = "desc abs"
    NONE = "none"

    @staticmethod
    def options():
        return list(c.value for c in Sort)
