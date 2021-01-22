################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import numpy as np
import pandas as pd


def _parse_datetime_index(index):
    """Given an instance of `pandas.DatetimeIndex`, parse its `freq` and
    return a `numpy.dtype` that corresponds to the unit it should be parsed in.

    Because `pandas.DataFrame`s cannot store datetimes in anything other than
    `datetime64[ns]`, we need to examine the `DatetimeIndex` itself to
    understand what unit it needs to be parsed as.

    Args:
        index (pandas.DatetimeIndex)

    Returns:
        `numpy.dtype`: a datetime64 dtype with the correct units depending on
            `index.freq`.
    """
    if index.freq is None:
        return np.dtype("datetime64[ns]")

    freq = str(index.freq).lower()
    new_type = None

    if any(s in freq for s in ["businessday", "day"]) or freq == "sm" or freq == "sms":
        # days
        new_type = "D"
    elif freq == "w" or "week" in freq:
        # weeks
        new_type = "W"
    elif any(s in freq for s in ["month", "quarter"]):
        # months
        new_type = "M"
    elif "year" in freq or freq == "a":
        new_type = "Y"
    else:
        # default to datetime
        new_type = "ns"

    return np.dtype("datetime64[{0}]".format(new_type))


def deconstruct_pandas(data, kwargs=None):
    """Given a dataframe, flatten it by resetting the index and memoizing the
    pivots that were applied.

    Args:
        data (pandas.dataframe): a Pandas DataFrame to parse

    Returns:
        (pandas.DataFrame, dict): a Pandas DataFrame and a dictionary containing
            optional members `columns`, `row_pivots`, and `column_pivots`.
    """
    kwargs = kwargs or {}
    kwargs = {'columns': [], 'row_pivots': [], 'column_pivots': []}

    # Decompose Period index to timestamps
    if isinstance(data.index, pd.PeriodIndex):
        data.index = data.index.to_timestamp()

    if isinstance(data, pd.DataFrame) and isinstance(data.columns, pd.MultiIndex) and isinstance(data.index, pd.MultiIndex):
        # Row and col pivots
        kwargs['row_pivots'].extend([str(c) for c in data.index.names])

        for _ in kwargs['row_pivots']:
            # unstack row pivots
            data = data.unstack()
        data = pd.DataFrame(data)

        i = 0
        new_names = list(data.index.names)
        for j, val in enumerate(data.index.names):
            if val is None:
                new_names[j] = 'index' if i == 0 else 'index-{}'.format(i)
                i += 1
            else:
                if str(val) not in kwargs['row_pivots']:
                    kwargs['column_pivots'].append(str(val))
        data.index.names = new_names
        data = data.reset_index()  # copy
        data.columns = [str(c) if c in ['index'] + kwargs['row_pivots'] + kwargs['column_pivots'] else " " for c in data.columns]
        kwargs['columns'].extend([" " for c in data.columns if c not in ['index'] + kwargs['row_pivots'] + kwargs['column_pivots']])

    elif isinstance(data, pd.DataFrame) and isinstance(data.columns, pd.MultiIndex):
        # Col pivots
        if data.index.name:
            kwargs['row_pivots'].append(str(data.index.name))
            push_row_pivot = False
        else:
            push_row_pivot = True

        data = pd.DataFrame(data.unstack())

        i = 0
        new_names = list(data.index.names)
        for j, val in enumerate(data.index.names):
            if val is None:
                new_names[j] = 'index' if i == 0 else 'index-{}'.format(i)
                i += 1
                if push_row_pivot:
                    kwargs['row_pivots'].append(str(new_names[j]))
            else:
                if str(val) not in kwargs['row_pivots']:
                    kwargs['column_pivots'].append(str(val))

        data.index.names = new_names
        data.columns = [str(c) if c in ['index'] + kwargs['row_pivots'] + kwargs['column_pivots'] else " " for c in data.columns]
        kwargs['columns'].extend([" " for c in data.columns if c not in ['index'] + kwargs['row_pivots'] + kwargs['column_pivots']])

    elif isinstance(data, pd.DataFrame) and isinstance(data.index, pd.MultiIndex):
        # Row pivots
        kwargs['row_pivots'].extend(list(data.index.names))
        data = data.reset_index()  # copy

    if isinstance(data, pd.DataFrame):
        # flat df
        if 'index' not in [str(c).lower() for c in data.columns]:
            data = data.reset_index(col_fill='index')

        if not kwargs['columns']:
            # might already be set in row+col pivot df
            kwargs['columns'].extend([str(c) for c in data.columns])
            data.columns = kwargs['columns']

    if isinstance(data, pd.Series):
        # Series
        flattened = data.reset_index()  # copy

        if isinstance(data, pd.Series):
            # preserve name from series
            flattened.name = data.name

            # make sure all columns are strings
            flattened.columns = [str(c) for c in flattened.columns]

        data = flattened

    return data, kwargs
