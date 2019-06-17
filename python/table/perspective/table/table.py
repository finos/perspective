# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from perspective.table.libbinding import make_table, t_op
from .view import View
from ._accessor import _PerspectiveAccessor
from ._utils import _dtype_to_str


class Table(object):
    def __init__(self, data_or_schema, config=None):
        '''Construct a Table using the provided data or schema and optional configuration dictionary.

        Tables are immutable - column names and data types cannot be changed after creation.

        If a schema is provided, the table will be empty. Subsequent updates MUST conform to the column names and data types provided in the schema.

        Params:
            data_or_schema (dict/list/dataframe)
            config (dict) : optional configurations for the Table:
                - limit (int) : the maximum number of rows the Table should have. Updates past the limit will begin writing at row 0.
                - index (string) : a string column name to use as the Table's primary key.
        '''
        config = config or {}
        self._accessor = _PerspectiveAccessor(data_or_schema)
        self._limit = config.get("limit", 4294967295)
        self._index = config.get("index", "")
        self._table = make_table(None, self._accessor, None, self._limit, self._index, t_op.OP_INSERT, False, False)
        self._gnode_id = self._table.get_gnode().get_id()
        self._callbacks = []
        self._views = []

    def size(self):
        '''Returns the size of the Table, i.e. its row count
        '''
        return self._table.size()

    def schema(self):
        '''Returns the schema of this Table. A schema provides the mapping of column names to data types.

        Returns:
            dict : A key-value mapping of column names to data types.
        '''
        s = self._table.get_schema()
        columns = s.columns()
        types = s.types()
        schema = {}
        for i in range(0, len(columns)):
            if (columns[i] != "psp_okey"):
                schema[columns[i]] = _dtype_to_str(types[i])
        return schema

    def columns(self, computed=False):
        '''Returns the column names of this dataset.'''
        return list(self.schema().keys())

    def update(self, data):
        '''Update the Table with new data.

        Updates on tables without an explicit `index` are treated as appends.

        Updates on tables with an explicit `index` should have the index as part of the `data` param, as this instructs the engine
        to locate the indexed row and write into it. If an index is not provided, the update is treated as an append.

        Example:
            - to update the row with primary key "abc" on a Table with {"index": "a"}, `data` should be [{"a": "abc", "b": "new data"}]

        Params:
            data (dict|list|df) : the data with which to update the Table
        '''
        types = self._table.get_schema().types()
        self._accessor = _PerspectiveAccessor(data)
        self._accessor._types = types[:len(self._accessor.names())]
        self._table = make_table(self._table, self._accessor, None, self._limit, self._index, t_op.OP_INSERT, True, False)

    def remove(self, pkeys):
        '''Removes the rows with the primary keys specified in `pkeys`.

        If the table does not have an index, `remove()` has no effect. Removes propagate to views derived from the table.

        Example:
            - to remove rows with primary keys "abc" and "def", provide ["abc", "def"].

        Params:
            pkeys (list) : a list of primary keys to indicate the rows that should be removed.
        '''
        if self._index == "":
            return
        pkeys = list(map(lambda idx: {self._index: idx}, pkeys))
        types = [self._table.get_schema().get_dtype(self._index)]
        self._accessor = _PerspectiveAccessor(pkeys)
        self._accessor._names = [self._index]
        self._accessor._types = types
        make_table(self._table, self._accessor, None, self._limit, self._index, t_op.OP_DELETE, True, False)

    def view(self, config=None):
        config = config or {}
        if len(config.get("columns", [])) == 0:
            config["columns"] = self.columns()
        view = View(self, config)
        self._views.append(view)
        return view

    def _update_callback(self):
        cache = {}
        for callback in self._callbacks:
            callback.callback(cache)
