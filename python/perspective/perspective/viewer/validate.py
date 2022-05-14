################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from datetime import datetime

from ..core import ALL_FILTERS, Aggregate, Plugin, Sort
from ..core.exception import PerspectiveError


def validate_plugin(plugin):
    if isinstance(plugin, Plugin):
        return plugin.value
    elif isinstance(plugin, str):
        if plugin not in Plugin.options():
            raise PerspectiveError("Unrecognized `plugin`: {0}".format(plugin))
        return plugin
    else:
        raise PerspectiveError(
            "Cannot parse `plugin` of type: {0}".format(str(type(plugin)))
        )


def validate_columns(columns):
    if columns is None:
        return []
    elif isinstance(columns, str):
        columns = [columns]

    if isinstance(columns, list):
        return columns
    else:
        raise PerspectiveError("Cannot parse `columns` of type: %s", str(type(columns)))


def _validate_pivots(pivots):
    if pivots is None:
        return []
    elif isinstance(pivots, str):
        pivots = [pivots]

    if isinstance(pivots, list):
        return pivots
    else:
        raise PerspectiveError("Cannot parse pivots of type: %s", str(type(pivots)))


def validate_group_by(group_by):
    return _validate_pivots(group_by)


def validate_split_by(split_by):
    return _validate_pivots(split_by)


def validate_aggregates(aggregates):
    if aggregates is None:
        return {}
    elif isinstance(aggregates, dict):
        for k, v in aggregates.items():
            if isinstance(v, Aggregate):
                aggregates[k] = v.value
            elif isinstance(v, str):
                if v not in Aggregate.options():
                    raise PerspectiveError("Unrecognized aggregate: %s", v)
            elif isinstance(v, list):
                # Parse weighted mean aggregate in ["weighted mean", "COLUMN"]
                if len(v) == 2 and v[0] == "weighted mean":
                    continue
                raise PerspectiveError(
                    "Unrecognized aggregate in incorrect syntax for weighted mean: %s - Syntax should be: ['weighted mean', 'COLUMN']",
                    v,
                )
            else:
                raise PerspectiveError(
                    "Cannot parse aggregation of type %s", str(type(v))
                )
        return aggregates
    else:
        raise PerspectiveError(
            "Cannot parse aggregates type: %s", str(type(aggregates))
        )


def validate_sort(sort):
    if sort is None:
        return []
    elif isinstance(sort, str):
        sort = [sort]

    if isinstance(sort, list):
        if len(sort) > 0 and not isinstance(sort[0], list):
            sort = [sort]
        ret = []
        for col, s in sort:
            if isinstance(s, Sort):
                s = s.value
            elif not isinstance(s, str) or s not in Sort.options():
                raise PerspectiveError("Unrecognized sort direction: %s", s)
            ret.append([col, s])
        return ret
    else:
        raise PerspectiveError("Cannot parse sort type: %s", str(type(sort)))


def validate_filter(filters):
    if filters is None:
        return []

    elif (
        isinstance(filters, list)
        and len(filters) > 0
        and not isinstance(filters[0], list)
    ):
        # wrap
        filters = [filters]

    if isinstance(filters, list):
        for f in filters:
            if not isinstance(f, list):
                raise PerspectiveError("`filter` kwarg must be a list!")

            for i, item in enumerate(f):
                if i == 1:
                    if item not in ALL_FILTERS:
                        raise PerspectiveError(
                            "Unrecognized filter operator: {}".format(item)
                        )
                    elif item not in ("is null", "is not null"):
                        if len(f) != 3:
                            raise PerspectiveError(
                                "Cannot parse filter - {} operator must have a comparison value.".format(
                                    item
                                )
                            )
                else:
                    if item.__class__.__name__ == "date":
                        f[i] = item.strftime("%m/%d/%Y")
                    elif isinstance(item, datetime):
                        f[i] = item.strftime("%Y-%m-%d %H:%M:%S")
        return filters
    else:
        raise PerspectiveError(
            "Cannot parse filter type: {}".format(str(type(filters)))
        )


def validate_expressions(expressions):
    if expressions is None:
        return []

    if isinstance(expressions, str):
        # wrap in a list and return
        return [expressions]

    if isinstance(expressions, list):
        for expr in expressions:
            if not isinstance(expr, str):
                raise PerspectiveError(
                    "Cannot parse non-string expression: {}".format(str(type(expr)))
                )
        return expressions
    else:
        raise PerspectiveError(
            "Cannot parse expressions of type: {}".format(str(type(expressions)))
        )


def validate_plugin_config(plugin_config):
    return plugin_config
