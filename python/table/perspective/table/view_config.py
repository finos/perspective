# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#


class ViewConfig(object):
    '''Defines the configuration for a View object.'''

    def __init__(self, config):
        '''Receives a user-provided config dict and standardizes it for consumption by the python client and the core engine.

        Params:
            dict : the configuration dictionary provided by the user
        '''
        self._row_pivots = config.get('row-pivots', [])
        self._column_pivots = config.get('column-pivots', [])
        self._aggregates = config.get('aggregates', {})
        self._columns = config.get('columns', [])
        self._sort = config.get('sort', [])
        self._filter = config.get('filter', [])
        self._filter_op = config.get('filter_op', "and")
        self.row_pivot_depth = config.get("row_pivot_depth", None)
        self.column_pivot_depth = config.get("column_pivot_depth", None)

    def get_row_pivots(self):
        '''The columns used as [row pivots](https://en.wikipedia.org/wiki/Pivot_table#Row_labels)

        Returns:
            list : the columns used as row pivots
        '''
        return self._row_pivots

    def get_column_pivots(self):
        '''The columns used as [column pivots](https://en.wikipedia.org/wiki/Pivot_table#Column_labels)

        Returns:
            list : the columns used as column pivots
        '''
        return self._column_pivots

    def get_aggregates(self):
        '''Defines the grouping of data within columns.

        Returns:
           dict[str:str] : a vector of string vectors in which the first value is the column name, and the second value is the string representation of an aggregate
        '''
        return self._aggregates

    def get_columns(self):
        '''The columns that will be shown to the user in the view. If left empty, the view shows all columns in the dataset by default.

        Returns:
            list : the columns shown to the user
        '''
        return self._columns

    def get_sort(self):
        '''The columns that should be sorted, and the direction to sort.

        A sort configuration is a list of two elements: a string column name, and a string sort direction, which are:
        "none", "asc", "desc", "col asc", "col desc", "asc abs", "desc abs", "col asc abs", and "col desc abs".

        Returns:
            list[list] : the sort configurations of the view stored in a list of lists
        '''
        return self._sort

    def get_filter(self):
        '''The columns that should be filtered.

        A filter configuration is a list of three elements: a string column name, a filter comparison string (i.e. "===", ">"), and a value to compare.

        Returns:
            list[list] : the filter configurations of the view stored in a list of lists
        '''
        return self._filter

    def get_filter_op(self):
        '''When multiple filters are applied, filter_op defines how data should be returned.

        Defaults to "and" if not set by the user, meaning that data returned with multiple filters will satisfy all filters.

        If "or" is provided, returned data will satsify any one of the filters applied.

        Returns
            string : the filter_op of the view
        '''
        return self._filter_op
