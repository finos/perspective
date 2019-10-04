# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#


def deconstruct_pandas(data):
    '''Remove pivots from the passed-in dataframe.'''
    import pandas as pd
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

    if isinstance(data.index, pd.MultiIndex):
        kwargs['row_pivots'] = list(data.index.names)
        kwargs['columns'] = data.columns.tolist()

    return data, kwargs
