# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from functools import wraps
from .widget import PerspectiveWidget


@wraps(PerspectiveWidget.__init__)
def psp(data=None,
        plugin='hypergrid',
        columns=None,
        row_pivots=None,
        column_pivots=None,
        aggregates=None,
        sort=None,
        filters=None,
        plugin_config=None,
        dark=False,
        **config):
    # TODO: fix and document
    data = [] if data is None else data
    widget = PerspectiveWidget(plugin=plugin,
                               columns=columns,
                               row_pivots=row_pivots,
                               column_pivots=column_pivots,
                               aggregates=aggregates,
                               sort=sort,
                               filters=filters,
                               plugin_config=plugin_config,
                               dark=dark)
    # TODO: empty tables
    widget.load(data, **config)
    return widget
