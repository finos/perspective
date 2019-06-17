# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from random import random
from perspective.table.libbinding import make_view_zero, make_view_one, make_view_two, \
    get_data_slice_zero, get_data_slice_one, get_data_slice_two
from .view_config import ViewConfig
from ._data_formatter import _PerspectiveDataFormatter
from ._constants import COLUMN_SEPARATOR_STRING


class View(object):
    def __init__(self, Table, config=None):
        '''Private constructor for a View object - use the Table.view() method to create Views.

        A View object represents a specific transform (configuration or pivot,
        filter, sort, etc) configuration on an underlying Table. A View
        receives all updates from the Table from which it is derived, and
        can be serialized to JSON or trigger a callback when it is updated.

        View objects are immutable, and will remain in memory and actively process
        updates until its delete() method is called.
        '''
        self._table = Table
        self._config = ViewConfig(config or {})
        self._sides = self.sides()

        date_validator = self._table._accessor._date_validator
        if self._sides == 0:
            self._view = make_view_zero(self._table._table, str(random()), COLUMN_SEPARATOR_STRING, self._config, date_validator)
        elif self._sides == 1:
            self._view = make_view_one(self._table._table, str(random()), COLUMN_SEPARATOR_STRING, self._config, date_validator)
        else:
            self._view = make_view_two(self._table._table, str(random()), COLUMN_SEPARATOR_STRING, self._config, date_validator)

        self._column_only = self._view.is_column_only()

    def sides(self):
        '''How many pivoted sides does this View have?'''
        if len(self._config.get_row_pivots()) > 0 or len(self._config.get_column_pivots()) > 0:
            if len(self._config.get_column_pivots()) > 0:
                return 2
            else:
                return 1
        else:
            return 0

    def num_rows(self):
        '''The number of aggregated rows in the View. This is affected by the `row-pivots` that are applied to the View.

        Returns:
            int : number of rows
        '''
        return self._view.num_rows()

    def num_columns(self):
        '''The number of aggregated columns in the View. This is affected by the `column-pivots` that are applied to the View.

        Returns:
            int : number of columns
        '''
        return self._view.num_columns()

    def schema(self):
        '''The schema of this view, which is a key-value map that contains the column names and their data types.

        If the columns are aggregated, their aggregated types will be shown.

        Returns:
            schema : a map of strings to strings
        '''
        return {item[0]: item[1] for item in self._view.schema().items()}

    def to_records(self, options=None):
        '''Serialize the view's dataset into a `list` of `dict`s containing each individual row.

        If the view is aggregated, the aggregated dataset will be returned.

        Params:
            options (dict) :
                user-provided options that specifies what data to return:
                - start_row: defaults to 0
                - end_row: defaults to the number of total rows in the view
                - start_col: defaults to 0
                - end_col: defaults to the total columns in the view
                - index: whether to return an implicit pkey for each row. Defaults to False
                - leaves_only: whether to return only the data at the end of the tree. Defaults to False

        Returns:
            list : A list of dictionaries, where each dict represents a new row of the dataset
        '''
        opts, column_names, data_slice = self._to_format_helper(options)
        return _PerspectiveDataFormatter.to_format(opts, self, column_names, data_slice, 'records')

    def to_dict(self, options=None):
        '''Serialize the view's dataset into a `dict` of `str` keys and `list` values.
        Each key is a column name, and the associated value is the column's data packed into a list.

        If the view is aggregated, the aggregated dataset will be returned.

        Params:
            options (dict) :
                user-provided options that specifies what data to return:
                - start_row: defaults to 0
                - end_row: defaults to the number of total rows in the view
                - start_col: defaults to 0
                - end_col: defaults to the total columns in the view
                - index: whether to return an implicit pkey for each row. Defaults to False
                - leaves_only: whether to return only the data at the end of the tree. Defaults to False

        Returns:
            dict : a dictionary with string keys and list values, where key = column name and value = column values
        '''
        opts, column_names, data_slice = self._to_format_helper(options)
        return _PerspectiveDataFormatter.to_format(opts, self, column_names, data_slice, 'dict')

    def to_numpy(self, options=None):
        '''Serialize the view's dataset into a `dict` of `str` keys and `numpy.array` values.
        Each key is a column name, and the associated value is the column's data packed into a numpy array.

        If the view is aggregated, the aggregated dataset will be returned.

        Params:
            options (dict) :
                user-provided options that specifies what data to return:
                - start_row: defaults to 0
                - end_row: defaults to the number of total rows in the view
                - start_col: defaults to 0
                - end_col: defaults to the total columns in the view
                - index: whether to return an implicit pkey for each row. Defaults to False
                - leaves_only: whether to return only the data at the end of the tree. Defaults to False

        Returns:
            dict : a dictionary with string keys and numpy array values, where key = column name and value = column values
        '''
        opts, column_names, data_slice = self._to_format_helper(options)
        return _PerspectiveDataFormatter.to_format(opts, self, column_names, data_slice, 'numpy')

    def to_arrow(self, options=None):
        pass

    def to_df(self, options=None):
        import pandas
        cols = self.to_numpy(options=options)
        return pandas.DataFrame(cols)

    def _to_format_helper(self, options=None):
        options = options or {}
        opts = self._parse_format_options(options)

        if self._sides == 0:
            data_slice = get_data_slice_zero(self._view, opts["start_row"], opts["end_row"], opts["start_col"], opts["end_col"])
        elif self._sides == 1:
            data_slice = get_data_slice_one(self._view, opts["start_row"], opts["end_row"], opts["start_col"], opts["end_col"])
        else:
            data_slice = get_data_slice_two(self._view, opts["start_row"], opts["end_row"], opts["start_col"], opts["end_col"])

        column_names = data_slice.get_column_names()

        return [opts, column_names, data_slice]

    def _num_hidden_cols(self):
        '''Returns the number of columns that are sorted but not shown.'''
        hidden = 0
        columns = self._config.get_columns()
        for sort in self._config.get_sort():
            if sort[0] not in columns:
                hidden += 1
        return hidden

    def _parse_format_options(self, options):
        '''Given a user-provided options dictionary, extract the useful values.'''
        max_cols = self.num_columns() + (1 if self._sides > 0 else 0)
        return {
            "start_row": options.get("start_row", 0),
            "end_row": min(options.get("end_row", self.num_rows()), self.num_rows()),
            "start_col": options.get("start_col", 0),
            "end_col": min(options.get("end_col", max_cols), max_cols * (self._num_hidden_cols() + 1)),
            "index": options.get("index", False),
            "leaves_only": options.get("leaves_only", False),
            "has_row_path": self._sides > 0 and (not self._column_only)
        }
