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
    '''Given an instance of `pandas.DatetimeIndex`, parse its `freq` and
    return a `numpy.dtype` that corresponds to the unit it should be parsed in.

    Because `pandas.DataFrame`s cannot store datetimes in anything other than
    `datetime64[ns]`, we need to examine the `DatetimeIndex` itself to
    understand what unit it needs to be parsed as.

    Args:
        index (pandas.DatetimeIndex)

    Returns:
        `numpy.dtype`: a datetime64 dtype with the correct units depending on
            `index.freq`.
    '''
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


def deconstruct_pandas(data):
    '''Given a dataframe, flatten it by resetting the index and memoizing the
    pivots that were applied.

    Args:
        data (pandas.dataframe): a Pandas DataFrame to parse

    Returns:
        (pandas.DataFrame, dict): a Pandas DataFrame and a dictionary containing
            optional members `columns`, `row_pivots`, and `column_pivots`.
    '''
    kwargs = {}

    # level unstacking
    if isinstance(data, pd.DataFrame) and isinstance(data.columns, pd.MultiIndex):
        data = pd.DataFrame(data.unstack())
        columns = list(x for x in data.index.names if x)
        kwargs['column_pivots'] = list(x for x in data.index.names if x)
        kwargs['row_pivots'] = []
        orig_columns = [' ' for _ in data.columns.tolist()]

        # deal with indexes
        if len(columns) < len(data.index.names):
            for i in range(len(data.index.names) - len(columns)):
                if i == 0:
                    columns.append('index')
                    kwargs['row_pivots'].append('index')
                else:
                    columns.append('index-{}'.format(i))
                    kwargs['row_pivots'].append('index-{}'.format(i))

        # all columns in index
        columns += orig_columns
        data.reset_index(inplace=True)
        data.columns = columns

        # use these columns
        kwargs['columns'] = orig_columns

    # Decompose Period index to timestamps
    if isinstance(data.index, pd.PeriodIndex):
        data.index = data.index.to_timestamp()

    if isinstance(data.index, pd.MultiIndex):
        kwargs['row_pivots'] = list(data.index.names)
        kwargs['columns'] = data.columns.tolist()

    if isinstance(data, pd.Series) or 'index' not in map(lambda x: str(x).lower(), data.columns):
        flattened = data.reset_index()

        if isinstance(data, pd.Series):
            # preserve name from series
            flattened.name = data.name

            # make sure all columns are strings
            flattened.columns = [str(c) for c in flattened.columns]

        data = flattened

    return data, kwargs
