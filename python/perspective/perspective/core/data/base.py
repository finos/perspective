# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from six import iteritems


class Data(object):
    def __init__(self, type, data, schema, columns, transfer_as_arrow=False, **kwargs):
        self.type = type
        self.data = data
        self.columns = columns
        self.schema = schema
        self.kwargs = kwargs
        if transfer_as_arrow:
            self.data = self.convert_to_arrow(self.data)

    @staticmethod
    def Empty():
        return Data('', [], {}, [])

    def convert_to_arrow(self, data):
        try:
            import pyarrow as pa
            sink = pa.BufferOutputStream()
            arrs = [pa.array([y[z] for y in self.data])
                    for z in self.schema.keys()]
            batch = pa.RecordBatch.from_arrays(arrs, list(self.schema.keys()))
            sink = pa.BufferOutputStream()
            writer = pa.RecordBatchStreamWriter(sink, batch.schema)
            writer.write_batch(batch)
            writer.close()
            return sink.getvalue()
        except ImportError:
            pass


class DictData(Data):
    def __init__(self, data, schema=None, columns=None, **kwargs):
        super(DictData, self).__init__('json',
                                       [data],
                                       schema if schema else {k: str(type(v)) for k, v in iteritems(data)},
                                       columns if columns else [k for k in data],
                                       **kwargs)


class ListData(Data):
    def __init__(self, data, schema=None, columns=None, **kwargs):
        if len(data) > 0 and not isinstance(data[0], dict):
            raise NotImplementedError()
        super(ListData, self).__init__('json',
                                       data,
                                       schema if schema else {k: str(type(v)) for k, v in iteritems(data[0])} if len(data) > 0 else {},
                                       columns if columns else [k for k in data[0]] if len(data) > 0 else [],
                                       **kwargs)


def _is_dict(data, schema=None, columns=None, transfer_as_arrow=False):
    if isinstance(data, dict):
        return DictData(data, schema=schema, columns=columns, transfer_as_arrow=transfer_as_arrow)
    return Data.Empty()


def _is_list(data, schema=None, columns=None, transfer_as_arrow=False):
    if isinstance(data, list):
        return ListData(data, schema=schema, columns=columns, transfer_as_arrow=transfer_as_arrow)
    return Data.Empty()
