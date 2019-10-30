# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import six
import pandas
import numpy
from math import isnan
from ._date_validator import _PerspectiveDateValidator
from ..core.data import deconstruct_numpy
from ..core.exception import PerspectiveError

try:
    from .libbinding import t_dtype
except ImportError:
    pass


def _type_to_format(data_or_schema):
    '''Deconstructs data passed in by the user into a standard format:

    - A list of dicts, each of which represents a single row.
    - A dict of lists, each of which represents a single column.

    Schemas passed in by the user are preserved as-is.

    Pandas DataFrames are flattened and returned as a columnar dataset.

    Finally, an integer is assigned to represent the type of the dataset to the internal engine.

    Returns:
        int: type
                - 0: records (list[dict])
                - 1: columns (dict[str:list])
                - 2: schema (dist[str]/dict[type])
        {list, dict}: processed data
    '''
    if isinstance(data_or_schema, list):
        # records
        return False, 0, data_or_schema
    elif isinstance(data_or_schema, dict):
        # schema or columns
        for v in data_or_schema.values():
            if isinstance(v, type) or isinstance(v, str):
                # schema maps name -> type
                return False, 2, data_or_schema
            elif isinstance(v, list) or iter(v):
                # if columns entries are iterable, type 1
                return isinstance(v, numpy.ndarray), 1, data_or_schema
            else:
                # Can't process
                raise NotImplementedError("Dict values must be list or type!")
        # Can't process
        raise NotImplementedError("Dict values must be list or type!")
    elif isinstance(data_or_schema, numpy.recarray):
        columns = [data_or_schema[col] for col in data_or_schema.dtype.names]
        return True, 1, dict(zip(data_or_schema.dtype.names, columns))
    else:
        if not (isinstance(data_or_schema, pandas.DataFrame) or isinstance(data_or_schema, pandas.Series)):
            # if pandas not installed or is not a dataframe or series
            raise NotImplementedError("Must be dict or list!")
        else:
            from ..core.data import deconstruct_pandas

            # flatten column/index multiindex
            df, _ = deconstruct_pandas(data_or_schema)

            # try to squash object dtype as much as possible
            df.fillna(value=numpy.nan, inplace=True)

            return True, 1, {c: df[c].values for c in df.columns}


class _PerspectiveAccessor(object):
    '''A uniform accessor that wraps data/schemas of varying formats with a common `marshal` function.'''

    def __init__(self, data_or_schema):
        self._is_numpy, self._format, self._data_or_schema = _type_to_format(data_or_schema)
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

        # store the transformed arrays and null mappings in a separate location
        self._numpy_meta = {}

        # Additional transformations for numpy array-backed datasets
        if self._is_numpy:
            # try to normalize column data as much as we can
            try:
                for name in self._data_or_schema:
                    array = self._data_or_schema[name]
                    deconstructed = deconstruct_numpy(array)
                    self._numpy_meta[name] = deconstructed
                    self._types.append(deconstructed["array"].dtype)
            except AttributeError:
                raise PerspectiveError("Perspective does not support mixed dictionaries of numpy.ndarray and list.")

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

    def get(self, column_name, ridx):
        '''Get the element at the specified column name and row index.

        If the element does not exist, return None.

        Args:
            column_name (str)
            ridx (int)

        Returns:
            object or None
        '''
        val = None
        try:
            if self._format == 0:
                return self._data_or_schema[ridx][column_name]
            elif self._format == 1:
                return self._data_or_schema[column_name][ridx]
            else:
                raise NotImplementedError()
            return val
        except (KeyError, IndexError):
            return None

    def marshal(self, cidx, ridx, dtype):
        '''Returns the element at the specified column and row index, and marshals it into an object compatible with the core engine's `fill` method.

        If DTYPE_DATE or DTYPE_TIME is specified for a string value, attempt to parse the string value or return `None`.

        Args:
            cidx (int)
            ridx (int)
            dtype (.libbinding.t_dtype)

        Returns:
            object or None
        '''
        column_name = self._names[cidx]
        val = self.get(column_name, ridx)

        if val is None:
            return val

        # first, check for numpy nans without using numpy.isnan as it tries to cast values
        if isinstance(val, float) and isnan(val):
            val = None
        elif isinstance(val, list) and len(val) == 1:
            # strip out values encased lists
            val = val[0]
        elif dtype == t_dtype.DTYPE_INT32 or dtype == t_dtype.DTYPE_INT64:
            if not isinstance(val, bool) and isinstance(val, (float, numpy.floating)):
                # should be able to update int columns with either ints or floats
                val = int(val)
        elif dtype == t_dtype.DTYPE_FLOAT32 or dtype == t_dtype.DTYPE_FLOAT64:
            if not isinstance(val, bool) and isinstance(val, (int, numpy.integer)):
                # should be able to update float columns with either ints or floats
                val = float(val)
        elif dtype == t_dtype.DTYPE_DATE:
            # return datetime.date
            if isinstance(val, str):
                parsed = self._date_validator.parse(val)
                val = self._date_validator.to_date_components(parsed)
            else:
                val = self._date_validator.to_date_components(val)
        elif dtype == t_dtype.DTYPE_TIME:
            # return unix timestamps for time
            if isinstance(val, str):
                parsed = self._date_validator.parse(val)
                val = self._date_validator.to_timestamp(parsed)
            else:
                val = self._date_validator.to_timestamp(val)
        elif dtype == t_dtype.DTYPE_STR:
            if isinstance(val, (bytes, bytearray)):
                val = val.decode("utf-8")
            else:
                if six.PY2:
                    # six.u mangles quotes with escape sequences - use native unicode()
                    val = unicode(val)  # noqa: F821
                else:
                    val = str(val)
        return val

    def _get_numpy_column(self, name):
        '''For columnar datasets, return the list/Numpy array that contains the data for a single column.

        Args:
            name (str) : the column name to look up

        Returns:
            list/numpy.array/None : returns the column's data, or None if it cannot be found.
        '''
        return self._numpy_meta.get(name, None)

    def _has_column(self, ridx, name):
        '''Given a column name, validate that it is in the row.

        This allows differentiation between value is None (unset) and value not in row (no-op).

        Args:
            ridx (int)
            name (str)

        Returns:
            bool : True if column is in row, or if column belongs to pkey/op columns required by the engine. False otherwise.
        '''
        if name in ("psp_pkey", "psp_okey", "psp_op"):
            return True
        if self._format == 0:
            return name in self._data_or_schema[ridx]
        else:
            # no partial updates available on schema or dict updates
            return True
