# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from six import iteritems, string_types
from .exception import PerspectiveError
from .plugin import Plugin
from .aggregate import Aggregate
from .sort import Sort
from .filters import ALL_FILTERS


def validate_plugin(plugin):
    if isinstance(plugin, Plugin):
        return plugin.value
    elif isinstance(plugin, string_types):
        if plugin not in Plugin.options():
            raise PerspectiveError('Unrecognized `plugin`: %s', plugin)
        return plugin
    else:
        raise PerspectiveError('Cannot parse `plugin` of type: %s', str(type(plugin)))


def validate_columns(columns):
    if columns is None:
        return []
    elif isinstance(columns, string_types):
        columns = [columns]

    if isinstance(columns, list):
        return columns
    else:
        raise PerspectiveError('Cannot parse `columns` of type: %s', str(type(columns)))


def _validate_pivots(pivots):
    if pivots is None:
        return []
    elif isinstance(pivots, string_types):
        pivots = [pivots]

    if isinstance(pivots, list):
        return pivots
    else:
        raise PerspectiveError('Cannot parse pivots of type: %s', str(type(pivots)))


def validate_row_pivots(row_pivots):
    return _validate_pivots(row_pivots)


def validate_column_pivots(column_pivots):
    return _validate_pivots(column_pivots)


def validate_aggregates(aggregates):
    if aggregates is None:
        return {}
    elif isinstance(aggregates, dict):
        for k, v in iteritems(aggregates):
            if isinstance(v, Aggregate):
                aggregates[k] = v.value
            elif isinstance(v, string_types):
                if v not in Aggregate.options():
                    raise PerspectiveError('Unrecognized aggregate: %s', v)
            else:
                raise PerspectiveError('Cannot parse aggregation of type %s', str(type(v)))
        return aggregates
    else:
        raise PerspectiveError('Cannot parse aggregates type: %s', str(type(aggregates)))


def validate_sort(sort):
    if sort is None:
        return []
    elif isinstance(sort, string_types):
        sort = [sort]

    if isinstance(sort, list):
        if len(sort) > 0 and not isinstance(sort[0], list):
            sort = [sort]
        ret = []
        for col, s in sort:
            if isinstance(s, Sort):
                s = s.value
            elif not isinstance(s, string_types) or s not in Sort.options():
                raise PerspectiveError('Unrecognized Sort: %s', s)
            ret.append([col, s])
        return ret
    else:
        raise PerspectiveError('Cannot parse sort type: %s', str(type(sort)))


def validate_filters(filters, columns=None):
    columns = columns or []
    if filters is None:
        return []

    elif isinstance(filters, list) and len(filters) > 0 and not isinstance(filters[0], list):
        # wrap
        filters = [filters]

    if isinstance(filters, list):
        ret = []
        for i, d in enumerate(filters):
            if not isinstance(d, list):
                raise PerspectiveError('`filters` kwarg must be a list!')

            if len(d) != 3:
                raise PerspectiveError('Cannot parse filter - unrecognized function {}'.format(d['func']))

            for i, l in enumerate(d):
                # FIXME check if column exists?
                # if columns and (l not in columns):
                #     raise PerspectiveError('Cannot parse computed_columns - unrecognized column {}'.format(input))
                if i == 1:
                    if l not in ALL_FILTERS:
                        raise PerspectiveError('Unrecognized filter operator: {}'.format(l))
                pass
            ret.append(d)
        return ret
    else:
        raise PerspectiveError('Cannot parse filters type: %s', str(type(filters)))


def validate_plugin_config(plugin_config):
    return plugin_config
