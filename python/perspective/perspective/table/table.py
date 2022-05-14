################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from datetime import date, datetime

from ..core.exception import PerspectiveError
from ._accessor import _PerspectiveAccessor
from ._callback_cache import _PerspectiveCallBackCache
from ._date_validator import _PerspectiveDateValidator
from ._state import _PerspectiveStateManager
from ._utils import (
    _dtype_to_pythontype,
    _dtype_to_str,
    _parse_expression_strings,
    _str_to_pythontype,
)
from .libbinding import (
    make_table,
    str_to_filter_op,
    t_dtype,
    t_filter_op,
    t_op,
    validate_expressions,
)
from .view import View


class Table(object):
    def __init__(self, data, limit=None, index=None):
        """Construct a :class:`~perspective.Table` using the provided data or
        schema and optional configuration dictionary.

        :class:`~perspective.Table` instances are immutable - column names and
        data types cannot be changed after creation. If a schema is provided,
        the :class:`~perspective.Table` will be empty.  Subsequent updates MUST
        conform to the column names and data types provided in the schema.

        Args:
            data (:obj:`dict`/:obj:`list`/:obj:`pandas.DataFrame`): Data or
                schema which initializes the :class:`~perspective.Table`.

        Keyword Args:
            index (:obj:`str`): A string column name to use as the
                :class:`~perspective.Table` primary key.
            limit (:obj:`int`): The maximum number of rows the
                :class:`~perspective.Table` should have.  Cannot be set at the
                same time as ``index``. Updates past the limit will begin
                writing at row 0.
        """
        self._is_arrow = isinstance(data, (bytes, bytearray))
        self._is_csv = isinstance(data, str)

        if self._is_csv:
            # CSVs are loaded using the Arrow interface, so is_arrow is
            # always true if we are loading a CSV
            self._is_arrow = True

            if len(data) > 0 and data[0] == ",":
                data = "_" + data

        if self._is_arrow:
            _accessor = data
        else:
            _accessor = _PerspectiveAccessor(data)

        self._date_validator = _PerspectiveDateValidator()

        self._limit = limit
        self._index = index

        # C++ make_table does not accept `None`, so pass in defaults of ""
        # for `index` and 4294967295 for `limit`, but always store `self._index`
        # and `self._limit` as user-provided kwargs or `None`.
        self._table = make_table(
            None,
            _accessor,
            self._limit or 4294967295,
            self._index or "",
            t_op.OP_INSERT,
            False,
            self._is_arrow,
            self._is_csv,
            0,
        )

        self._gnode_id = self._table.get_gnode().get_id()
        self._update_callbacks = _PerspectiveCallBackCache()
        self._delete_callbacks = _PerspectiveCallBackCache()
        self._views = []
        self._delete_callback = None

        pool = self._table.get_pool()
        pool.set_update_delegate(self)
        pool._process()

        # Each table always contains its own instance of state manager.
        self._state_manager = _PerspectiveStateManager()

    def make_port(self):
        """Create a new input port on the underlying `gnode`, and return an
        :obj:`int` containing the ID of the new input port.
        """
        return self._table.make_port()

    def remove_port(self, port_id):
        """Remove the specified port from the underlying `gnode`."""
        self._table.remove_port()

    def get_index(self):
        """Returns the Table's index column, or ``None`` if an index is not
        specified by the user."""
        return self._index

    def get_limit(self):
        """Returns the Table's limit, or ``None`` if an index is not
        specified by the user."""
        return self._limit

    def clear(self):
        """Removes all the rows in the :class:`~perspective.Table`, but
        preserves everything else including the schema and any callbacks or
        registered :class:`~perspective.View`.
        """
        self._state_manager.remove_process(self._table.get_id())
        self._table.reset_gnode(self._gnode_id)

    def replace(self, data):
        """Replaces all rows in the :class:`~perspective.Table` with the new
        data that conforms to the :class:`~perspective.Table` schema.

        Args:
            data (:obj:`dict`/:obj:`list`/:obj:`pandas.DataFrame`): New data
                that will be filled into the :class:`~perspective.Table`.
        """
        self._state_manager.remove_process(self._table.get_id())
        self._table.reset_gnode(self._gnode_id)
        self.update(data)
        self._state_manager.call_process(self._table.get_id())

    def size(self):
        """Returns the row count of the :class:`~perspective.Table`."""
        self._state_manager.call_process(self._table.get_id())
        return self._table.size()

    def schema(self, as_string=False):
        """Returns the schema of this :class:`~perspective.Table`, a :obj:`dict`
        mapping of string column names to python data types.

        Keyword Args:
            as_string (:obj:`bool`): returns the data types as string
                representations, if True

        Returns:
            :obj:`dict`: A key-value mapping of column names to data types.
        """
        s = self._table.get_schema()
        columns = s.columns()
        types = s.types()
        schema = {}
        for i in range(0, len(columns)):
            if columns[i] != "psp_okey":
                if as_string:
                    schema[columns[i]] = _dtype_to_str(types[i])
                else:
                    schema[columns[i]] = _dtype_to_pythontype(types[i])
        return schema

    def validate_expressions(self, expressions, as_string=False):
        """Returns an :obj:`dict` with two keys: "expression_schema", which is
        a schema containing the column names and data types for each valid
        expression in ``expressions``, and "errors", which is a dict of
        expressions to error objects that contain additional metadata:
        `error_message`, `line`, and `column`.

        Args:
            expressions (:obj:`list`): A list of string expressions to validate
                and create a schema from.

        Keyword Args:
            as_string (:obj:`bool`): If True, returns the data types as string
                representations so they can be serialized.
        """
        validated = {"expression_schema": {}, "errors": {}, "expression_alias": {}}

        if len(expressions) == 0:
            return validated

        expressions = _parse_expression_strings(expressions)
        validation_results = validate_expressions(self._table, expressions)
        expression_schema = validation_results.get_expression_schema()
        expression_errors = validation_results.get_expression_errors()

        for expression in expressions:
            # expression_alias can be used to map the alias to the
            # full expression string in the UI.
            validated["expression_alias"][expression[0]] = expression[1]

        for (alias, dtype) in expression_schema.items():
            if not as_string:
                dtype = _str_to_pythontype(dtype)

            validated["expression_schema"][alias] = expression_schema[alias]

        for (alias, error) in expression_errors.items():
            error_dict = {}
            error_dict["error_message"] = error.error_message
            error_dict["line"] = error.line
            error_dict["column"] = error.column

            validated["errors"][alias] = error_dict

        return validated

    def columns(self):
        """Returns the column names of this :class:`~perspective.Table`.

        Returns:
            :obj:`list`: a list of string column names
        """
        return [
            name for name in self._table.get_schema().columns() if name != "psp_okey"
        ]

    def is_valid_filter(self, filter):
        """Tests whether a given filter expression string is valid, e.g. that
        the filter term is not None or an unparsable date/datetime.  `null`/
        `not null` operators don't need a comparison value.

        Args:
            filter (:obj:`string`): The filter expression to validate.

        Returns:
            :obj:`bool`: Whether this filter is valid.
        """
        if isinstance(filter[1], str):
            filter_op = str_to_filter_op(filter[1])
        else:
            filter_op = filter[1]

        if (
            filter_op == t_filter_op.FILTER_OP_IS_NULL
            or filter_op == t_filter_op.FILTER_OP_IS_NOT_NULL
        ):
            # null/not null operators don't need a comparison value
            return True

        value = filter[2]

        if value is None:
            return False

        schema = self.schema()
        in_schema = schema.get(filter[0], None)
        if in_schema and (schema[filter[0]] == date or schema[filter[0]] == datetime):
            if isinstance(value, str):
                value = self._date_validator.parse(value)

        return value is not None

    def update(self, data, port_id=0):
        """Update the :class:`~perspective.Table` with new data.

        Updates on :class:`~perspective.Table` without an explicit ``index``
        are treated as appends.  Updates on :class:`~perspective.Table` with
        an explicit ``index`` should have the index as part of the ``data``
        param, as this instructs the engine to locate the indexed row and write
        into it.  If an index is not provided, the update is treated as an
        append.

        Args:
            data (:obj:`dict`/:obj:`list`/:obj:`pandas.DataFrame`): The data
                with which to update the :class:`~perspective.Table`.

        Examples:
            >>> tbl = Table({"a": [1, 2, 3], "b": ["a", "b", "c"]}, index="a")
            >>> tbl.update({"a": [2, 3], "b": ["a", "a"]})
            >>> tbl.view().to_dict()
            {"a": [1, 2, 3], "b": ["a", "a", "a"]}
        """
        if not port_id:
            port_id = 0

        _is_arrow = isinstance(data, (bytes, bytearray))
        _is_csv = isinstance(data, str)

        if _is_csv:
            # CSVs are loaded using the Arrow interface, so is_arrow is
            # always true if we are loading a CSV
            _is_arrow = True

            if len(data) > 0 and data[0] == ",":
                data = "_" + data

        if _is_arrow:
            _accessor = data
            self._table = make_table(
                self._table,
                _accessor,
                self._limit or 4294967295,
                self._index or "",
                t_op.OP_INSERT,
                True,
                _is_arrow,
                _is_csv,
                port_id,
            )
            self._state_manager.set_process(
                self._table.get_pool(), self._table.get_id()
            )
            return

        columns = self.columns()
        types = self._table.get_schema().types()
        _accessor = _PerspectiveAccessor(data)
        _accessor._names = columns + [
            name for name in _accessor._names if name == "__INDEX__"
        ]
        _accessor._types = types[: len(columns)]

        if _accessor._is_numpy:
            # Try to cast arrays to the Perspective dtype before they end up in
            # the C++, thus allowing for int/floats to be copied when they are
            # the same bit width
            _accessor.try_cast_numpy_arrays()

        if "__INDEX__" in _accessor._names:
            if self._index is not None:
                index_pos = _accessor._names.index(self._index)
                index_dtype = _accessor._types[index_pos]
                _accessor._types.append(index_dtype)
            else:
                _accessor._types.append(t_dtype.DTYPE_INT32)

        self._table = make_table(
            self._table,
            _accessor,
            self._limit or 4294967295,
            self._index or "",
            t_op.OP_INSERT,
            True,
            False,
            False,
            port_id,
        )
        self._state_manager.set_process(self._table.get_pool(), self._table.get_id())

    def remove(self, pkeys, port_id=0):
        """Removes the rows with the primary keys specified in ``pkeys``.

        If the :class:`~perspective.Table` does not have an index, ``remove()``
        has no effect.  Removes propagate to views derived from the table.

        Args:
            pkeys (:obj:`list`): a list of primary keys to indicate the rows
                that should be removed.

        Example:
            >>> tbl = Table({"a": [1, 2, 3]}, index="a")
            >>> tbl.remove([2, 3])
            >>> tbl.view().to_records()
            [{"a": 1}]
        """
        if self._index is None:
            return

        pkeys = list(map(lambda idx: {self._index: idx}, pkeys))
        types = [self._table.get_schema().get_dtype(self._index)]
        _accessor = _PerspectiveAccessor(pkeys)
        _accessor._names = [self._index]
        _accessor._types = types

        t = make_table(
            self._table,
            _accessor,
            self._limit or 4294967295,
            self._index or "",
            t_op.OP_DELETE,
            True,
            False,
            False,
            port_id,
        )

        self._state_manager.set_process(t.get_pool(), t.get_id())

    def view(
        self,
        columns=None,
        group_by=None,
        split_by=None,
        aggregates=None,
        sort=None,
        filter=None,
        expressions=None,
    ):
        """Create a new :class:`~perspective.View` from this
        :class:`~perspective.Table` via the supplied keyword arguments.

        A View is an immutable set of transformations applied to the data stored
        in a :class:`~perspective.Table`, which can be used for querying,
        pivoting, aggregating, sorting, and filtering.

        Keyword Arguments:
            columns (:obj:`list` of :obj:`str`): A list of column names to be
                visible to the user.
            group_by (:obj:`list` of :obj:`str`): A list of column names to
                use as group by.
            split_by (:obj:`list` of :obj:`str`): A list of column names
                to use as split by.
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

        Returns:
            :class:`~perspective.View`: A new :class:`~perspective.View`
                instance bound to this :class:`~perspective.Table`.

        Examples:
            >>> tbl = Table({"a": [1, 2, 3]})
            >>> view = tbl.view(filter=[["a", "==", 1]]
            >>> view.to_dict()
            >>> {"a": [1]}
        """
        self._state_manager.call_process(self._table.get_id())

        config = {}

        if expressions is not None:
            config["expressions"] = _parse_expression_strings(expressions)

        if columns is None:
            config["columns"] = self.columns()

            if expressions is not None:
                for expression in config["expressions"]:
                    config["columns"].append(expression[0])
        else:
            config["columns"] = columns

        if group_by is not None:
            config["group_by"] = group_by
        if split_by is not None:
            config["split_by"] = split_by
        if aggregates is not None:
            config["aggregates"] = aggregates
        if sort is not None:
            config["sort"] = sort
        if filter is not None:
            config["filter"] = filter

        view = View(self, **config)
        self._views.append(view._name)
        return view

    def on_delete(self, callback):
        """Register a callback to be invoked when the
        :func:`~perspective.Table.delete()` method is called on this
        :class:`~perspective.Table`.

        Args:
            callback (:obj:`func`): A callback function to invoke on delete.

        Examples:
            >>> def deleter():
            ...     print("Delete called!")
            >>> table.on_delete(deleter)
            >>> table.delete()
            >>> Delete called!
        """
        if not callable(callback):
            raise ValueError("on_delete callback must be a callable function!")
        self._delete_callbacks.add_callback(callback)

    def remove_delete(self, callback):
        """De-register the supplied callback from the
        :func:`~perspective.Table.delete()` event for this
        :class:`~perspective.Table`

        Examples:
            >>> def deleter():
            ...     print("Delete called!")
            >>> table.on_delete(deleter)
            >>> table.remove_delete(deleter)
            >>> table.delete()
        """
        self._state_manager.remove_process(self._table.get_id())
        if not callable(callback):
            return ValueError("remove_delete callback should be a callable function!")
        self._delete_callbacks.remove_callbacks(lambda cb: cb == callback)

    def delete(self):
        """Delete this :class:`~perspective.Table` and clean up associated
        resources, assuming it has no :class:`~perspective.View` instances
        registered to it (which must be deleted first).
        """
        if len(self._views) > 0:
            raise PerspectiveError(
                "Cannot delete a Table with active views still linked to it "
                + "- call delete() on each view, and try again."
            )
        self._state_manager.remove_process(self._table.get_id())
        self._table.unregister_gnode(self._gnode_id)
        [cb() for cb in self._delete_callbacks]
        self._table = None

    def _update_callback(self, port_id):
        """After `process` completes internally, this method is called by the
        C++ with a `port_id`, indicating the port on which the update was
        processed.

        Arguments:
            port_id (:obj:`int`): an int indicating which port the update
            came from.
        """
        cache = {}
        for callback in self._update_callbacks:
            callback["callback"](port_id=port_id, cache=cache)
