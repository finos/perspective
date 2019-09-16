# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from ._date_validator import _PerspectiveDateValidator
from perspective.table.libbinding import t_dtype
try:
    import pandas
except (ImportError, ModuleNotFoundError):
    pandas = None


def _type_to_format(data_or_schema):
    '''deconstruct data or schema into type and processed data

    Returns:
        int: type
                - 0: records
                - 1: columns
                - 2: schema
        {list, dict, pandas.DataFrame}: processed_data, either input data
                                        or deconstructed dataframe
    '''
    if isinstance(data_or_schema, list):
        # records
        return 0, data_or_schema
    elif isinstance(data_or_schema, dict):
        # schema or columns
        for v in data_or_schema.values():
            if isinstance(v, type) or isinstance(v, str):
                # schema maps name-> type
                return 2, data_or_schema
            elif isinstance(v, list) or iter(v):
                # if columns entries are iterable, type 1
                return 1, data_or_schema
            else:
                # Can't process
                raise NotImplementedError("Dict values must be list or type!")
        # Can't process
        raise NotImplementedError("Dict values must be list or type!")
    else:
        if pandas is None or not (isinstance(data_or_schema, pandas.DataFrame) or isinstance(data_or_schema, pandas.Series)):
            # if pandas not installed or is not a dataframe or series
            raise NotImplementedError("Must be dict or list!")
        else:
            from perspective.core.data.pd import deconstruct_pandas

            # flatten column/index multiindex
            df, _ = deconstruct_pandas(data_or_schema)

            if isinstance(data_or_schema, pandas.DataFrame):
                # Dataframe
                return 1, {c: df[c].values for c in df.columns}

            # Columns
            return 1, {df.name: df.values}


class _PerspectiveAccessor(object):
    '''Internal class to manage perspective table state'''

    def __init__(self, data_or_schema):
        self._format, self._data_or_schema = _type_to_format(data_or_schema)
        self._date_validator = _PerspectiveDateValidator()
        self._row_count = \
            len(self._data_or_schema) if self._format == 0 else \
            len(max(self._data_or_schema.values(), key=len)) if self._format == 1 else \
            0
        if isinstance(self._data_or_schema, list):
            self._names = list(self._data_or_schema[0].keys()) if len(self._data_or_schema) > 0 else []
        elif isinstance(self._data_or_schema, dict):
            self._names = list(self._data_or_schema.keys())
        self._types = []

    def data(self):
        return self._data_or_schema

    def format(self):
        return self._format

    def names(self):
        return self._names

    def types(self):
        return self._types

    def date_validator(self):
        return self._date_validator

    def row_count(self):
        return self._row_count

    def get(self, cidx, ridx):
        '''Get the element at the specified column and row index.

        If the element does not exist, return None.

        Params:
            cidx (int)
            ridx (int)

        Returns:
            object or None
        '''
        try:
            if self._format == 0:
                return self._data_or_schema[ridx][list(self._data_or_schema[0].keys())[cidx]]
            elif self._format == 1:
                return self._data_or_schema[list(self._data_or_schema.keys())[cidx]][ridx]
            else:
                raise NotImplementedError()
        except (KeyError, IndexError):
            return None

    def marshal(self, cidx, ridx, type):
        '''Returns the element at the specified column and row index, and marshals it into an object compatible with the core engine's `fill` method.

        If DTYPE_DATE or DTYPE_TIME is specified for a string value, attempt to parse the string value or return `None`.

        Params:
            cidx (int)
            ridx (int)
            type (perspective.table.libbinding.t_dtype)

        Returns:
            object or None
        '''
        val = self.get(cidx, ridx)

        # parse string dates/datetimes into objects
        if isinstance(val, str) and type in (t_dtype.DTYPE_DATE, t_dtype.DTYPE_TIME):
            val = self._date_validator.parse(val)
        return val
