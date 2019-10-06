# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import pandas
from functools import wraps
from ..table.data.pandas import deconstruct_pandas
from .widget import PerspectiveWidget


@wraps(PerspectiveWidget.__init__)
def start(table_or_data,
          plugin="hypergrid",
          row_pivots=[],
          column_pivots=[],
          columns=[],
          aggregates={},
          sort=[],
          filters=[],
          dark=False,
          **config):
    '''Given a `perspective.Table` or a dataset, create and render a `PerspectiveWidget`.

    If a pivoted DataFrame or MultiIndex table is passed in, `start()` preserves pivots and reapplies them to the widget.

    Configuration options passed into this function mirror `PerspectiveWidget.__init__.`

    Args:
    **config : optional config keywords that will be passed into the `Perspective.Table` constructor if `table_or_data` is a dataset.
        - index (str) : a column name to be used as a primary key for the dataset
        - limit (int) : the total number of rows allowed in the `Table` - updates past `limit` overwrite at row 0.
    '''
    if isinstance(table_or_data, pandas.DataFrame) or isinstance(table_or_data, pandas.Series):
        # keep row pivots and columns passed into pandas
        data, pivots = deconstruct_pandas(table_or_data)
        table_or_data = data

        if pivots.get("row_pivots", None):
            row_pivots = pivots["row_pivots"]

        if pivots.get("columns", None):
            columns = pivots["columns"]

    widget = PerspectiveWidget(
        plugin=plugin,
        columns=columns,
        row_pivots=row_pivots,
        column_pivots=column_pivots,
        aggregates=aggregates,
        sort=sort,
        filters=filters,
        dark=dark)

    widget.load(table_or_data, **config)
    return widget
