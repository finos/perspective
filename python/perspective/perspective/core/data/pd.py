#  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
#  ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
#  ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
#  ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
#  ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
#  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
#  ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
#  ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
#  ┃ This file is part of the Perspective library, distributed under the terms ┃
#  ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
#  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

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
            optional members `columns`, `group_by`, and `split_by`.
    """
    kwargs = kwargs or {}
    kwargs = {"columns": [], "group_by": [], "split_by": []}

    # Decompose Period index to timestamps
    if isinstance(data.index, pd.PeriodIndex):
        data.index = data.index.to_timestamp()

    # convert categories to str
    if isinstance(data, pd.DataFrame):
        if hasattr(pd, "CategoricalDtype"):
            for k, v in data.dtypes.items():
                if isinstance(v, pd.CategoricalDtype):
                    data[k] = data[k].astype(str)

    # convert StringDtype to str
    if isinstance(data, pd.DataFrame) and hasattr(pd, "StringDtype"):
        for k, v in data.dtypes.items():
            if isinstance(v, pd.StringDtype):
                data[k] = data[k].astype(str)

    if isinstance(data, pd.DataFrame) and isinstance(data.columns, pd.MultiIndex) and isinstance(data.index, pd.MultiIndex):
        # Row and col pivots
        kwargs["group_by"].extend([str(c) for c in data.index.names])

        # Two strategies
        if None in data.columns.names:
            # In this case, we need to extract the column names from the row
            # e.g. pt = pd.pivot_table(df, values = ['Discount','Sales'], index=['Country','Region'], columns=["State","Quantity"])
            # Table will be
            #                       Discount             Sales
            #         State       Alabama Alaska ...      Alabama Alaska ...
            #         Quantity    150 350 ...             300 500
            # Country Region
            #  US     Region 0    ...
            #  US     Region 1
            #
            # We need to transform this to:
            # group_by = ['Country', 'Region']
            # split_by = ['State', 'Quantity']
            # columns = ['Discount', 'Sales']
            existent = kwargs["group_by"] + data.columns.names
            for c in data.columns.names:
                if c is not None:
                    kwargs["split_by"].append(c)
                    data = data.stack()
            data = pd.DataFrame(data).reset_index()

            for new_column in data.columns:
                if new_column not in existent:
                    kwargs["columns"].append(new_column)
        else:
            # In this case, we have no need as the values is just a single entry
            # e.g. pt = pd.pivot_table(df, values = 'Discount', index=['Country','Region'], columns = ['Category', 'Segment'])
            for _ in kwargs["group_by"]:
                # unstack group by
                data = data.unstack()
            data = pd.DataFrame(data)

        # this rather weird loop is to map existing None columns into
        # levels, e.g. in the `else` block above, to reconstruct
        # the "Discount" name. IDK if this is stored or if the name is
        # lots, so we'll just call it 'index', 'index-1', ...
        i = 0
        new_names = list(data.index.names)
        for j, val in enumerate(data.index.names):
            if val is None:
                new_names[j] = "index" if i == 0 else "index-{}".format(i)
                i += 1
                # kwargs['group_by'].append(str(new_names[j]))
            else:
                if str(val) not in kwargs["group_by"]:
                    kwargs["split_by"].append(str(val))

        # Finally, remap any values columns to have column name 'value'
        data.index.names = new_names
        data = data.reset_index()  # copy
        data.columns = [str(c) if c in ["index"] + kwargs["group_by"] + kwargs["split_by"] + kwargs["columns"] else "value" for c in data.columns]
        kwargs["columns"].extend(["value" for c in data.columns if c not in ["index"] + kwargs["group_by"] + kwargs["split_by"] + kwargs["columns"]])
    elif isinstance(data, pd.DataFrame) and isinstance(data.columns, pd.MultiIndex):
        # Col pivots
        if data.index.name:
            kwargs["group_by"].append(str(data.index.name))
            push_group_by = False
        else:
            push_group_by = True

        data = pd.DataFrame(data.unstack())

        i = 0
        new_names = list(data.index.names)
        for j, val in enumerate(data.index.names):
            if val is None:
                new_names[j] = "index" if i == 0 else "index-{}".format(i)
                i += 1
                if push_group_by:
                    kwargs["group_by"].append(str(new_names[j]))
            else:
                if str(val) not in kwargs["group_by"]:
                    kwargs["split_by"].append(str(val))

        data.index.names = new_names
        data.columns = [str(c) if c in ["index"] + kwargs["group_by"] + kwargs["split_by"] else "value" for c in data.columns]
        kwargs["columns"].extend(["value" for c in data.columns if c not in ["index"] + kwargs["group_by"] + kwargs["split_by"]])

    elif isinstance(data, pd.DataFrame) and isinstance(data.index, pd.MultiIndex):
        # Group by
        kwargs["group_by"].extend(list(data.index.names))
        data = data.reset_index()  # copy

    if isinstance(data, pd.DataFrame):
        # flat df
        if "index" not in [str(c).lower() for c in data.columns]:
            data = data.reset_index(col_fill="index")

        if not kwargs["columns"]:
            # might already be set in row+col pivot df
            kwargs["columns"].extend([str(c) for c in data.columns])
            data.columns = kwargs["columns"]

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
