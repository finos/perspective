################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

BOOLEAN_FILTERS = ["&", "|", "==", "!=", "or", "and"]
NUMBER_FILTERS = ["<", ">", "==", "<=", ">=", "!=", "is null", "is not null"]
STRING_FILTERS = ["==", "contains", "!=", "in", "not in", "begins with", "ends with"]
DATETIME_FILTERS = ["<", ">", "==", "<=", ">=", "!="]

ALL_FILTERS = BOOLEAN_FILTERS + NUMBER_FILTERS + STRING_FILTERS + DATETIME_FILTERS
