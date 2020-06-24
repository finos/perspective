################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from six import iteritems, string_types
from ..core.exception import PerspectiveError
from ..core import Aggregate, Plugin, ALL_FILTERS, Sort


def validate_plugin(plugin):
    if isinstance(plugin, Plugin):
        return plugin.value
    elif isinstance(plugin, string_types):
        if plugin not in Plugin.options():
            raise PerspectiveError("Unrecognized `plugin`: {0}".format(plugin))
        return plugin
    else:
        raise PerspectiveError("Cannot parse `plugin` of type: {0}".format(str(type(plugin))))


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
                raise PerspectiveError('Unrecognized sort direction: %s', s)
            ret.append([col, s])
        return ret
    else:
        raise PerspectiveError('Cannot parse sort type: %s', str(type(sort)))


def validate_filters(filters):
    if filters is None:
        return []

    elif isinstance(filters, list) and len(filters) > 0 and not isinstance(filters[0], list):
        # wrap
        filters = [filters]

    if isinstance(filters, list):
        for f in filters:
            if not isinstance(f, list):
                raise PerspectiveError('`filters` kwarg must be a list!')

            for i, item in enumerate(f):
                if i == 1:
                    if item not in ALL_FILTERS:
                        raise PerspectiveError('Unrecognized filter operator: {}'.format(item))
                    elif item not in ("is null", "is not null"):
                        if len(f) != 3:
                            raise PerspectiveError('Cannot parse filter - {} operator must have a comparison value.'.format(item))
        return filters
    else:
        raise PerspectiveError('Cannot parse filters type: {}'.format(str(type(filters))))


def validate_computed_columns(computed_columns):
    if computed_columns is None:
        return []

    elif isinstance(computed_columns, list) and len(computed_columns) > 0 and (not isinstance(computed_columns[0], dict) and not isinstance(computed_columns[0], str)):
        # wrap
        computed_columns = [computed_columns]

    if isinstance(computed_columns, list):
        for c in computed_columns:
            if not isinstance(c, dict) and not isinstance(c, string_types):
                raise PerspectiveError('`computed_columns` kwarg must be a list of dicts or strings!')
            if isinstance(c, dict):
                keys = c.keys()
                valid = ("column" in keys) and ("computed_function_name" in keys) and ("inputs" in keys)

                if not valid:
                    raise PerspectiveError("`computed_columns` kwarg must contain `columns`, `computed_function_name`, and `inputs`!")
        return computed_columns
    else:
        raise PerspectiveError("Cannot parse computed columns of type: {}".format(str(type(computed_columns))))


def validate_plugin_config(plugin_config):
    return plugin_config
