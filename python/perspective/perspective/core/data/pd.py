# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import sys
from .base import Data


def deconstruct_pandas(data):
    import pandas as pd
    kwargs = {}

    # level unstacking
    if isinstance(data, pd.DataFrame) and isinstance(data.columns, pd.MultiIndex):
        data = pd.DataFrame(data.unstack())
        columns = list(x for x in data.index.names if x)
        kwargs['columnpivots'] = list(x for x in data.index.names if x)
        kwargs['rowpivots'] = []
        orig_columns = [' ' for _ in data.columns.tolist()]

        # deal with indexes
        if len(columns) < len(data.index.names):
            for i in range(len(data.index.names) - len(columns)):
                if i == 0:
                    columns.append('index')
                    kwargs['rowpivots'].append('index')
                else:
                    columns.append('index-{}'.format(i))
                    kwargs['rowpivots'].append('index-{}'.format(i))

        # all columns in index
        columns += orig_columns
        data.reset_index(inplace=True)
        data.columns = columns

        # use these columns
        kwargs['columns'] = orig_columns

    if isinstance(data.index, pd.MultiIndex):
        kwargs['rowpivots'] = list(data.index.names)
        kwargs['columns'] = data.columns.tolist()

    return data, kwargs


class PandasData(Data):
    def __init__(self, data, schema, columns, transfer_as_arrow=False, **kwargs):
        import pandas as pd

        data, new_kwargs = deconstruct_pandas(data)
        kwargs.update(new_kwargs)

        # copy or not
        if isinstance(data, pd.Series) or 'index' not in map(lambda x: str(x).lower(), data.columns):
            df_processed = data.reset_index()
        else:
            df_processed = data

        # schema
        if isinstance(data, pd.Series):
            derived_schema = {data.name: str(data.dtype)}
        else:
            derived_schema = df_processed.dtypes.astype(str).to_dict()

        # datatype conversion
        for x in df_processed.dtypes.iteritems():
            if 'date' in str(x[1]):
                df_processed[x[0]] = df_processed[x[0]].astype(str)
            elif 'object' in str(x[1]):
                # attempt to coerce to date, else convert to string
                try:
                    df_processed[x[0]] = pd.to_datetime(df_processed[x[0]]).astype(str)
                    derived_schema[x[0]] = 'date'
                except Exception:
                    df_processed[x[0]] = df_processed[x[0]].astype(str)

        df_processed.fillna('', inplace=True)

        columns = kwargs.pop('columns', columns)
        if not columns:
            columns = data.columns.tolist() if isinstance(data, pd.DataFrame) else [data.name]

        schema = kwargs.pop('schema', schema)
        if not schema:
            schema = derived_schema

        if transfer_as_arrow:
            df_processed = self.convert_to_arrow(df_processed)
            super(PandasData, self).__init__(type='arrow',
                                             data=df_processed,
                                             schema=schema,
                                             columns=columns,
                                             **kwargs)

        else:
            df_processed = df_processed.to_dict('list')
            super(PandasData, self).__init__(type='json',
                                             data=df_processed,
                                             schema=schema,
                                             columns=columns,
                                             **kwargs)

    def convert_to_arrow(self, df):
        try:
            import pyarrow as pa
            batch = pa.RecordBatch.from_pandas(df)
            sink = pa.BufferOutputStream()
            writer = pa.RecordBatchStreamWriter(sink, batch.schema)
            writer.write_batch(batch)
            writer.close()
            return sink.getvalue()
        except ImportError:
            pass


def _is_pandas(data, schema, columns, transfer_as_arrow=False, **kwargs):
    try:
        if 'pandas' in sys.modules:
            import pandas as pd
            if isinstance(data, pd.DataFrame) or isinstance(data, pd.Series):
                return PandasData(data, schema=schema, columns=columns, transfer_as_arrow=transfer_as_arrow, **kwargs)
    except ImportError:
        return Data.Empty()
    return Data.Empty()
