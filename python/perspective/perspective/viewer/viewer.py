# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import logging
from random import random
from .validate import validate_plugin, validate_columns, validate_row_pivots, validate_column_pivots, \
    validate_aggregates, validate_sort, validate_filters, validate_plugin_config
from .viewer_traitlets import PerspectiveTraitlets
from ..manager import PerspectiveManager
from ..table import Table


class PerspectiveViewer(PerspectiveTraitlets, object):
    '''PerspectiveViewer wraps the `perspective.Table` API and exposes an API around creating views, loading data, and updating data.'''
    def __init__(self,
                 plugin='hypergrid',
                 columns=None,
                 row_pivots=None,
                 column_pivots=None,
                 aggregates=None,
                 sort=None,
                 filters=None,
                 plugin_config=None,
                 dark=False,
                 editable=False):
        '''Initialize an instance of `PerspectiveViewer` with the given viewer configuration.

        Do not pass a `Table` or data into the constructor - use the `load()` method to provide the viewer with data.

        Keyword Args:
        plugin ``(str|perspective.Plugin)``
        - The grid or visualization that will be displayed on render. Defaults to "hypergrid".

        columns ``(list[str])``
        - A list of column names to be visible to the user.

        row_pivots ``(list[str])``
        - A list of column names to use as row pivots, thus grouping data by row.

        column_pivots ``(list[str])``
        - A list of column names to use as column pivots, thus grouping data by column.

        aggregates ``(dict[str:str])``
        - A dictionary of column names to aggregate types, which specify aggregates for individual columns.

        sort ``(list[list[str]])``
        - A list of lists, each list containing a column name and a sort direction (asc, desc, col asc, col desc).

        filter ``(list[list[str]])``
        - A list of lists, each list containing a column name, a filter comparator, and a value to filter by.

        plugin_config ``(dict)``
        - An optional configuration containing the interaction state of a `perspective-viewer`.

        dark ``(bool)``
        - Enables/disables dark mode on the viewer. Defaults to ``False``.

        Examples:
            >>> viewer = PerspectiveViewer(aggregates={"a": "avg"}, row_pivots=["a"], sort=[["b", "desc"]], filter=[["a", ">", 1]])
        '''

        # Create an instance of `PerspectiveManager`, which receives messages from the `PerspectiveJupyterClient` on the front-end.
        self.manager = PerspectiveManager()
        self.table_name = None  # not a traitlet - only used in the python side of the viewer
        self.view_name = None

        # Viewer configuration
        self.plugin = validate_plugin(plugin)
        self.columns = validate_columns(columns) or []
        self.row_pivots = validate_row_pivots(row_pivots) or []
        self.column_pivots = validate_column_pivots(column_pivots) or []
        self.aggregates = validate_aggregates(aggregates) or {}
        self.sort = validate_sort(sort) or []
        self.filters = validate_filters(filters) or []
        self.plugin_config = validate_plugin_config(plugin_config) or {}
        self.dark = dark
        self.editable = editable

    @property
    def table(self):
        '''Returns the `perspective.Table` under management by the viewer.'''
        return self.manager.get_table(self.table_name)

    @property
    def view(self):
        '''Returns the `perspective.View` currently shown by the viewer.

        This property changes every time the viewer configuration changes.'''
        return self.manager.get_view(self.view_name)

    def load(self, table_or_data, **options):
        '''Given a `perspective.Table` or data that can be handled by `perspective.Table`, pass it to the viewer.

        `load()` resets the state of the viewer.

        If a `perspective.Table` is passed into `table_or_data`, `**options` is ignored as the options already set on the `Table` take precedence.

        If data is passed in, a `perspective.Table` is automatically created by this function, and the options passed to `**config` are extended to the new Table.

        Args:
            table_or_data (Table|dict|list|pandas.DataFrame): a `perspective.Table` instance or a dataset to be displayed in the viewer.

        Keyword Arguments:

        name ``(str)``
        - An optional name to reference the table by so it can be accessed from the front-end. If not provided, a name will be generated.

        index ``(str)``
        - The name of a column that will be the dataset's primary key. This sorts the dataset in ascending order based on primary key.

        limit ``(int)``
        - The total number of rows that will be loaded into Perspective.
        - Cannot be applied at the same time as index
        - Updates past ``limit`` begin writing at row 0.

        Examples:
            >>> from perspective import Table, PerspectiveViewer
            >>> data = {"a": [1, 2, 3]}
            >>> tbl = Table(data)
            >>> viewer = PerspectiveViewer()
            >>> viewer.load(tbl)
            >>> viewer.load(data, index="a") # kwargs are forwarded to the `Table` constructor.
        '''
        name = options.pop("name", str(random()))
        if isinstance(table_or_data, Table):
            table = table_or_data
        else:
            table = Table(table_or_data, **options)

        self.manager.host_table(name, table)

        # If columns are different between the tables, then remove viewer state.
        # - sorting is expensive, but it prevents errors from applying pivots, etc. on columns that don't exist in the dataset.
        if self.table_name is not None:
            old_columns = sorted(self.manager.get_table(self.table_name).columns())
            new_columns = sorted(table.columns())

            if str(new_columns) != str(old_columns):
                logging.warning("New dataset has different columns - resetting viewer state.")
                self.columns = table.columns()
                self.row_pivots = []
                self.column_pivots = []
                self.aggregates = {}
                self.sort = []
                self.filters = []

        # If the user does not set columns to show, synchronize viewer state with dataset.
        if len(self.columns) == 0:
            self.columns = table.columns()

        self.table_name = name

    def update(self, data):
        '''Update the table under management by the viewer with new data.

        This function follows the semantics of `Table.update()`, and will be affected by whether an index is set on the underlying table.

        Args:
            data (dict|list|pandas.DataFrame): the update data for the table.
        '''
        self.table.update(data)

    def clear(self):
        '''Clears the rows of this viewer's `Table`.'''
        if self.table is not None:
            self.table.clear()

    def replace(self, data):
        '''Replaces the rows of this viewer's `Table` with new data.

        Args:
            data : new data to set into the table - must conform to the table's schema.
        '''
        if self.table is not None:
            self.table.replace(data)

    def reset(self):
        '''Resets the viewer's attributes and state, but does not delete or modify the underlying `Table`.'''
        self.row_pivots = []
        self.column_pivots = []
        self.filters = []
        self.sort = []
        self.aggregates = {}
        self.columns = []
        self.plugin = "hypergrid"

    def delete(self, delete_table=True):
        '''Delete the Viewer's data and clears its internal state. If `delete_table` is True,
        the underlying `perspective.Table` and all associated `View`s will be deleted.

        Args:
            delete_table (bool) : whether the underlying `Table` will be deleted. Defaults to True.
        '''
        if self.view:
            self.view.delete()
            self.view_name = None

        for view in self.manager._views.values():
            view.delete()

        if delete_table:
            self.table.delete()
            self.manager._tables.pop(self.table_name)
            self.table_name = None

        self.reset()

    def _new_view(self):
        '''Create a new View, and assign its name to the viewer.

        Do not call this function - it will be called automatically when the state of the viewer changes.

        There should only be one View associated with the Viewer at any given time - when a new View is created, the old one is destroyed.
        '''
        if not self.table_name:
            return

        name = str(random())
        table = self.manager.get_table(self.table_name)
        view = table.view(
            row_pivots=self.row_pivots,
            column_pivots=self.column_pivots,
            columns=self.columns,
            aggregates=self.aggregates,
            sort=self.sort,
            filter=self.filters
        )

        self.manager.host_view(name, view)
        self.view_name = name
