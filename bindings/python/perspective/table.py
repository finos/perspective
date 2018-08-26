import numpy as np
import pandas as pd
from .libbinding import t_schema, t_dtype, t_table


class Perspective(object):
    def __init__(self, column_names, types):
        self._columns = {}

        dtypes = []
        for name, _type in zip(column_names, types):
            dtypes.append(self._type_to_dtype(_type))
            self._columns[name] = _type

        if len(column_names) != len(dtypes):
            raise Exception('column name/dtype length mismatch')

        _schema = t_schema(column_names, dtypes)
        self._t_table = t_table(_schema)
        self._t_table.init()

    @classmethod
    def _type_to_dtype(self, _type):
        if isinstance(_type, t_dtype):
            return _type
        if isinstance(_type, np.ndarray):
            if _type.dtype == np.int64:
                return t_dtype.INT64
            if _type.dtype == np.float64:
                return t_dtype.FLOAT64
            if _type.dtype == np.str:
                return t_dtype.STR
            if _type.dtype == np.bool:
                return t_dtype.BOOL
            if _type.dtype == np.object:
                return t_dtype.STR
            raise Exception('Type not recognized - %s' % _type)
        if isinstance(_type, list):
            if isinstance(_type[0], int):
                return t_dtype.INT64
            if isinstance(_type[0], float):
                return t_dtype.FLOAT64
            if isinstance(_type[0], str):
                return t_dtype.STR
            if isinstance(_type[0], bool):
                return t_dtype.BOOL
            raise Exception('Type not recognized - %s' % _type)
        if _type == np.int64:
            return t_dtype.INT64
        if _type == np.float64:
            return t_dtype.FLOAT64
        if _type == int:
            return t_dtype.INT64
        if _type == float:
            return t_dtype.FLOAT64
        if _type == bool:
            return t_dtype.BOOL
        if _type == str:
            return t_dtype.STR
        if _type == np.str:
            return t_dtype.STR
        if _type == np.bool:
            return t_dtype.BOOL
        elif _type == object:
            return t_dtype.STR
        else:
            raise Exception('%s not currently supported' % _type)

    def _validate_col(self, col):
        for i in range(len(col)):
            if i == 0:
                continue
            if not isinstance(col[i-1], type(col[i])) and not (isinstance(col[i], type(col[i-1]))):
                raise Exception('data must be homogenous type')

    def load(self, col, data):
        if self._t_table.size() < len(data):
            self._t_table.extend(len(data))

        if not self._t_table.get_schema().has_column(col):
            raise Exception('schema change not implemented')

        self._validate_col(data)
        self._t_table.load_column(col, data, self._type_to_dtype(data))

    def print(self):
        self._t_table.pprint()

    def __repr__(self):
        # FIXME
        self.print()
        return ''

    def __getitem__(self, col):
        if not self._t_table.get_schema().has_column(col):
            raise Exception('col not in table - %s' % col)
        return self._t_table.get_column(col)

    def to_df(self):
        df = pd.DataFrame()
        for col in self._columns:
            df[col] = self[col]
        return df

    @staticmethod
    def from_df(df):
        cols = []
        types = []
        for k, v in dict(df.dtypes).items():
            cols.append(k)
            types.append(Perspective._type_to_dtype(v))

        t = Perspective(cols, types)
        t._t_table.extend(len(df.index))

        for col in cols:
            t.load(col, df[col].values)

        return t
