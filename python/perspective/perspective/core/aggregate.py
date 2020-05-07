################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from enum import Enum


class Aggregate(Enum):
    '''The aggregation operators available in Perspective. Pass these into the
    `aggregates` arg in `PerspectiveWidget` or `PerspectiveViewer`.

    Examples:
        >>> widget = PerspectiveWidget(data, aggregates={"a": Aggregate.LAST})
    '''
    AND = 'and'
    ANY = 'any'
    AVG = 'avg'
    COUNT = 'count'
    DISTINCT_COUNT = 'distinct count'
    DISTINCT_LEAF = 'distinct leaf'
    DOMINANT = 'dominant'
    FIRST_BY_INDEX = 'first by index'
    LAST_BY_INDEX = 'last by index'
    LAST = 'last'
    HIGH = 'high'
    LOW = 'low'
    MEAN = 'mean'
    MEDIAN = 'median'
    OR = 'or'
    PCT_SUM_PARENT = 'pct sum parent'
    PCT_SUM_GRAND_TOTAL = 'pct sum grand total'
    SUM = 'sum'
    SUM_ABS = 'sum abs'
    ABS_SUM = 'abs sum'
    SUM_NOT_NULL = 'sum not null'
    UNIQUE = 'unique'

    @staticmethod
    def options():
        return list(c.value for c in Aggregate)
