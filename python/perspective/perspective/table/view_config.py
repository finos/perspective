################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#


class ViewConfig(object):
    '''Defines the configuration for a View object.'''

    def __init__(self, **config):
        '''Receives a user-provided config dict and standardizes it for
        reference.

        Keyword Arguments:
            columns (:obj:`list` of :obj:`str`): A list of column names to be
                visible to the user.
            row_pivots (:obj:`list` of :obj:`str`): A list of column names to
                use as row pivots.
            column_pivots (:obj:`list` of :obj:`str`): A list of column names
                to use as column pivots.
            aggregates (:obj:`dict` of :obj:`str` to :obj:`str`):  A dictionary
                of column names to aggregate types, which specify aggregates
                for individual columns.
            sort (:obj:`list` of :obj:`list` of :obj:`str`): A list of lists,
                each list containing a column name and a sort direction
                (``asc``, ``desc``, ``asc abs``, ``desc abs``, ``col asc``,
                ``col desc``, ``col asc abs``, ``col desc abs``).
            filter (:obj:`list` of :obj:`list` of :obj:`str`):  A list of lists,
                each list containing a column name, a filter comparator, and a
                value to filter by.
        '''
        self._config = config
        self._row_pivots = self._config.get('row_pivots', [])
        self._column_pivots = self._config.get('column_pivots', [])
        self._aggregates = self._config.get('aggregates', {})
        self._columns = self._config.get('columns', [])
        self._sort = self._config.get('sort', [])
        self._filter = self._config.get('filter', [])
        self._computed_columns = self._config.get('computed_columns', [])
        self._filter_op = self._config.get('filter_op', "and")
        self.row_pivot_depth = self._config.get("row_pivot_depth", None)
        self.column_pivot_depth = self._config.get("column_pivot_depth", None)

    def get_row_pivots(self):
        '''The columns used as
        [row pivots](https://en.wikipedia.org/wiki/Pivot_table#Row_labels)

        Returns:
            list : the columns used as row pivots
        '''
        return self._row_pivots

    def get_column_pivots(self):
        '''The columns used as
        [column pivots](https://en.wikipedia.org/wiki/Pivot_table#Column_labels)

        Returns:
            list : the columns used as column pivots
        '''
        return self._column_pivots

    def get_aggregates(self):
        '''Defines the grouping of data within columns.

        Returns:
            dict[str:str]  a vector of string vectors in which the first value
                is the column name, and the second value is the string
                representation of an aggregate
        '''
        return self._aggregates

    def get_columns(self):
        '''The columns that will be shown to the user in the view. If left
        empty, the view shows all columns in the dataset by default.

        Returns:
            `list` : the columns shown to the user
        '''
        return self._columns

    def get_sort(self):
        '''The columns that should be sorted, and the direction to sort.

        A sort configuration is a `list` of two elements: a string column name,
        and a string sort direction, which are:  "none", "asc", "desc",
        "col asc", "col desc", "asc abs", "desc abs", "col asc abs", and
        "col desc abs".

        Returns:
            `list`: the sort configurations of the view stored in a `list` of
                `list`s
        '''
        return self._sort

    def get_computed_columns(self):
        return self._computed_columns

    def get_filter(self):
        '''The columns that should be filtered.

        A filter configuration is a `list` of three elements:
            0: `str` column name.
            1: a filter comparison string (i.e. "===", ">")
            2: a value to compare (this will be casted to match the type of
                the column)

        Returns:
            `list`: the filter configurations of the view stored in a `list` of
                lists
        '''
        return self._filter

    def get_filter_op(self):
        '''When multiple filters are applied, filter_op defines how data should
        be returned.

        Defaults to "and" if not set by the user, meaning that data returned
        with multiple filters will satisfy all filters.  If "or" is provided,
        returned data will satsify any one of the filters applied.

        Returns:
            `str`: the filter_op of the view
        '''
        return self._filter_op

    def get_config(self):
        '''Returns the original dictionary config passed by the user.'''
        return self._config
