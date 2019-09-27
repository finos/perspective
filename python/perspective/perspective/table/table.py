# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from datetime import date, datetime
from perspective.table.libbinding import make_table, str_to_filter_op, t_filter_op, t_op, t_dtype
from .view import View
from ._accessor import _PerspectiveAccessor
from ._callback_cache import _PerspectiveCallBackCache
from ._exception import PerspectiveError
from ._utils import _dtype_to_pythontype, _dtype_to_str


class Table(object):
    # TODO: make config kwargs
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
        self._table.get_pool().set_update_delegate(self)
        self._gnode_id = self._table.get_gnode().get_id()
        self._callbacks = _PerspectiveCallBackCache()
        self._views = []

    def clear(self):
        '''Removes all the rows in the Table, but preserves the schema and configuration.'''
        self._table.reset_gnode(self._gnode_id)

    def replace(self, data):
        '''Replaces all rows in the Table with the new data.

        Params:
            data (dict|list|dataframe) the new data with which to fill the Table
        '''
        self._table.reset_gnode(self._gnode_id)
        self.update(data)

    def size(self):
        '''Returns the row count of the Table.'''
        return self._table.size()

    def schema(self, as_string=False):
        '''Returns the schema of this Table.

        A schema provides the mapping of string column names to python data types.

        Params:
            as_string (bool) : returns the data types as string representations, if True

        Returns:
            dict : A key-value mapping of column names to data types.
        '''
        s = self._table.get_schema()
        columns = s.columns()
        types = s.types()
        schema = {}
        for i in range(0, len(columns)):
            if (columns[i] != "psp_okey"):
                if as_string:
                    schema[columns[i]] = _dtype_to_str(types[i])
                else:
                    schema[columns[i]] = _dtype_to_pythontype(types[i])
        return schema

    def columns(self, computed=False):
        '''Returns the column names of this dataset.

        Params:
            computed (bool) : whether to include computed columns in this array. Defaults to False.

        Returns:
            list : a list of string column names
        '''
        return list(self.schema().keys())

    def computed_schema(self):
        '''Returns a schema of computed columns added by the user.

        Returns:
            dict[string:dict] : a key-value mapping of column names to computed columns. Each value is a dictionary that contains `column_name`, `column_type`, and `computation`.
        '''
        return {}

    def is_valid_filter(self, filter):
        '''Tests whether a given filter configuration is valid - that the filter term is not None or an unparsable date/datetime.'''
        if isinstance(filter[1], str):
            filter_op = str_to_filter_op(filter[1])
        else:
            filter_op = filter[1]

        if filter_op == t_filter_op.FILTER_OP_IS_NULL or filter_op == t_filter_op.FILTER_OP_IS_NOT_NULL:
            # null/not null operators don't need a comparison value
            return True

        value = filter[2]

        if value is None:
            return False

        schema = self.schema()
        if (schema[filter[0]] == date or schema[filter[0]] == datetime):
            if isinstance(value, str):
                value = self._accessor.date_validator().parse(value)

        return value is not None

    def update(self, data):
        '''Update the Table with new data.

        Updates on tables without an explicit `index` are treated as appends.

        Updates on tables with an explicit `index` should have the index as part of the `data` param, as this instructs the engine
        to locate the indexed row and write into it. If an index is not provided, the update is treated as an append.

        Example:
            - to update the row with primary key "abc" on a Table with {"index": "a"}, `data` should be [{"a": "abc", "b": "new data"}]

        Params:
            data (dict|list|dataframe) : the data with which to update the Table
        '''
        columns = self.columns()
        types = self._table.get_schema().types()
        self._accessor = _PerspectiveAccessor(data)
        self._accessor._names = columns + [name for name in self._accessor._names if name == "__INDEX__"]
        self._accessor._types = types[:len(columns)]

        if "__INDEX__" in self._accessor._names:
            if self._index != "":
                index_pos = self._accessor._names.index(self._index)
                index_dtype = self._accessor._types[index_pos]
                self._accessor._types.append(index_dtype)
            else:
                self._accessor._types.append(t_dtype.DTYPE_INT32)

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
        ''' Create a new View from this table with the configuration options in `config`.

        A View is an immutable set of transformations on the underlying Table, which allows
        for querying, pivoting, aggregating, sorting, and filtering of data.

        Params:
            config (dict or None) : a dictionary containing any of the optional keys below:
            - "row_pivots" (list[str]) : a list of column names to use as row pivots
            - "column_pivots" (list[str]) : a list of column names to use as column pivots
            - "aggregates" (dict[str:str]) : a dictionary of column names to aggregate types to specify aggregates for individual columns
            - "sort" (list(list[str]))
            - "filter" (list(list[str]))
        '''
        config = config or {}
        if config.get("columns") is None:
            config["columns"] = self.columns()  # TODO: push into C++
        view = View(self, config)
        self._views.append(view._name)
        return view

    def on_delete(self, callback):
        '''Register a callback with the table that will be invoked when the `delete()` method is called.'''
        if not callable(callback):
            raise ValueError("on_delete callback must be a callable function!")
        self._delete_callback = callback

    def delete(self):
        '''Delete this table and clean up associated resources.'''
        if len(self._views) > 0:
            raise PerspectiveError("Cannot delete a Table with active views still linked to it - call delete() on each view, and try again.")
        self._table.unregister_gnode(self._gnode_id)
        if hasattr(self, "_delete_callback"):
            self._delete_callback()

    def _update_callback(self):
        cache = {}
        for callback in self._callbacks.get_callbacks():
            callback["callback"](cache=cache)

    def __del__(self):
        '''Before GC, clean up internal resources to C++ objects'''
        self.delete()
