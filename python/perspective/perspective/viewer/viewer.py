################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import six
from random import random
from .validate import validate_plugin, validate_columns, validate_row_pivots, \
    validate_column_pivots, validate_aggregates, validate_sort, \
    validate_filters, validate_computed_columns, \
    validate_plugin_config
from .viewer_traitlets import PerspectiveTraitlets
from ..libpsp import is_libpsp

if is_libpsp():
    from ..libpsp import Table, PerspectiveManager


class PerspectiveViewer(PerspectiveTraitlets, object):
    '''PerspectiveViewer wraps the `perspective.Table` API and exposes an API
    around creating views, loading data, and updating data.
    '''

    # Keep track of attributes that can be set via Enum, and their
    # validation methods.
    ENUM_VALIDATORS = {
        "plugin": validate_plugin,
        "aggregates": validate_aggregates,
        "sort": validate_sort
    }

    def __init__(self,
                 plugin='hypergrid',
                 columns=None,
                 row_pivots=None,
                 column_pivots=None,
                 aggregates=None,
                 sort=None,
                 filters=None,
                 computed_columns=None,
                 plugin_config=None,
                 dark=None,
                 editable=False):
        '''Initialize an instance of `PerspectiveViewer` with the given viewer
        configuration.  Do not pass a `Table` or data into the constructor -
        use the :func:`load()` method to provide the viewer with data.

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
            filter (:obj:`list` of :obj:`list` of :obj:`str`): A list of lists,
                each list containing a column name, a filter comparator, and a
                value to filter by.
            computed_columns (:obj:`list` of :obj:`dict`): A list of dicts,
                each dict containing ``column``, a new computed column name,
                ``computed_function_name``, a string computed function name,
                and ``inputs``, a list of input column names.
            plugin (:obj:`str`/:obj:`perspective.Plugin`): Which plugin to select by
                default.
            plugin_config (:obj:`dict`): Custom config for all plugins by name.
            editable (:obj:`bool`): Whether to allow editability using the grid.
            dark (:obj:`bool`): Whether to invert the colors.

        Examples:
            >>> viewer = PerspectiveViewer(
            ...     aggregates={"a": "avg"},
            ...     row_pivots=["a"],
            ...     sort=[["b", "desc"]],
            ...     filter=[["a", ">", 1]],
            ...     computed_columns=[{
            ...         "column": "(Sales * Profit)",
            ...         "computed_function_name": "*",
            ...         "inputs": ["Sales", "Profit"]
            ...     }]
            ... )
        '''

        # Create an instance of `PerspectiveManager`, which receives messages
        # from the `PerspectiveJupyterClient` on the front-end.
        if is_libpsp():
            self.manager = PerspectiveManager()
        self.table_name = None  # not a traitlet - only used in python
        self.view_name = None

        # Viewer configuration
        self.plugin = validate_plugin(plugin)
        self.columns = validate_columns(columns) or []
        self.row_pivots = validate_row_pivots(row_pivots) or []
        self.column_pivots = validate_column_pivots(column_pivots) or []
        self.aggregates = validate_aggregates(aggregates) or {}
        self.sort = validate_sort(sort) or []
        self.filters = validate_filters(filters) or []
        self.computed_columns = validate_computed_columns(computed_columns) or []
        self.plugin_config = validate_plugin_config(plugin_config) or {}
        self.dark = dark
        self.editable = editable

    @property
    def table(self):
        '''Returns the ``perspective.Table`` under management by the viewer.'''
        return self.manager.get_table(self.table_name)

    @property
    def view(self):
        '''Returns the ``perspective.View`` currently shown by the viewer.

        This property changes every time the viewer configuration changes.'''
        return self.manager.get_view(self.view_name)

    def load(self, table_or_data, **options):
        '''Given a ``perspective.Table`` or data that can be handled by
        ``perspective.Table``, pass it to the viewer.

        ``load()`` resets the state of the viewer.  If a ``perspective.Table``
        is passed into ``table_or_data``, ``**options`` is ignored as the options
        already set on the ``Table`` take precedence.  If data is passed in, a
        ``perspective.Table`` is automatically created by this function, and the
        options passed to ``**config`` are extended to the new Table.

        Args:
            table_or_data (:obj:`Table`|:obj:`dict`|:obj:`list`|`pandas.DataFrame`): a
                `perspective.Table` instance or a dataset to be displayed
                in the viewer.

        Keyword Arguments:
            name (:obj:`str`): An optional name to reference the table by so it can
                be accessed from the front-end. If not provided, a name will
                be generated.
            index (:obj:`str`): A column name to be used as the primary key.
                Ignored if a `Table` is supplied.
            limit (:obj:`int`): A upper limit on the number of rows in the Table.
                Cannot be set at the same time as `index`, ignored if a `Table`
                is passed in.

        Examples:
            >>> from perspective import Table, PerspectiveViewer
            >>> data = {"a": [1, 2, 3]}
            >>> tbl = Table(data)
            >>> viewer = PerspectiveViewer()
            >>> viewer.load(tbl)
            >>> viewer.load(data, index="a") # viewer state is reset
        '''
        name = options.pop("name", str(random()))
        if isinstance(table_or_data, Table):
            table = table_or_data
        else:
            table = Table(table_or_data, **options)

        self.manager.host_table(name, table)

        # Reset the viewer when `load()` is called again.
        if self.table_name is not None:
            self.reset()

        # If the user does not set columns to show, synchronize viewer state
        # with dataset.
        if len(self.columns) == 0:
            self.columns = table.columns()

        self.table_name = name

    def update(self, data):
        '''Update the table under management by the viewer with new data.
        This function follows the semantics of `Table.update()`, and will be
        affected by whether an index is set on the underlying table.

        Args:
            data (:obj:`dict`|:obj:`list`|:obj:`pandas.DataFrame`): the update data for the
                table.
        '''
        self.table.update(data)

    def clear(self):
        '''Clears the rows of this viewer's ``Table``.'''
        if self.table is not None:
            self.table.clear()

    def replace(self, data):
        '''Replaces the rows of this viewer's `Table` with new data.

        Args:
            data (:obj:`dict`|:obj:`list`|:obj:`pandas.DataFrame`): new data to set into the
                table - must conform to the table's schema.
        '''
        if self.table is not None:
            self.table.replace(data)

    def save(self):
        '''Get the viewer's attribute as a dictionary, symmetric with `restore` so that a
           viewer's configuration can be reproduced.'''
        return {
            'row_pivots': self.row_pivots,
            'column_pivots': self.column_pivots,
            'filters': self.filters,
            'computed_columns': self.computed_columns,
            'sort': self.sort,
            'aggregates': self.aggregates,
            'columns': self.columns,
            'plugin': self.plugin,
        }

    def restore(self, **kwargs):
        '''Restore a given set of attributes, passed as kwargs (e.g. dictionary). Symmetric with `save` so that
        a given viewer's configuration can be reproduced'''
        for k, v in six.iteritems(kwargs):
            if k in ('row_pivots', 'column_pivots', 'filters', 'sort', 'aggregates', 'columns', 'computed_columns', 'plugin'):
                setattr(self, k, v)

    def reset(self):
        '''Resets the viewer's attributes and state, but does not delete or
        modify the underlying `Table`.
        '''
        self.row_pivots = []
        self.column_pivots = []
        self.filters = []
        self.sort = []
        self.computed_columns = []
        self.aggregates = {}
        self.columns = []
        self.plugin = "hypergrid"

    def delete(self, delete_table=True):
        '''Delete the Viewer's data and clears its internal state. If
        ``delete_table`` is True, the underlying `perspective.Table` and all
        associated ``View`` objects will be deleted.

        Args:
            delete_table (:obj:`bool`) : whether the underlying `Table` will be
                deleted. Defaults to True.
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
        '''Create a new View, and assign its name to the viewer.  Do not call
        this function - it will be called automatically when the state of the
        viewer changes. There should only be one View associated with the
        Viewer at any given time - when a new View is created, the old one
        is destroyed.
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
            filter=self.filters,
            computed_columns=self.computed_columns
        )

        self.manager.host_view(name, view)
        self.view_name = name

    def __setattr__(self, name, value):
        """Override __setattr__ in order to allow Enums to be validated
        through Traitlets."""
        if name in PerspectiveViewer.ENUM_VALIDATORS:
            # call the validator and set
            validated = PerspectiveViewer.ENUM_VALIDATORS[name](value)
            value = validated
        super(PerspectiveViewer, self).__setattr__(name, value)
