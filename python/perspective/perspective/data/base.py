from six import iteritems


class Data(object):
    def __init__(self, type, data, schema, **kwargs):
        self.type = type
        self.data = data
        self.schema = schema
        self.kwargs = kwargs

    @staticmethod
    def Empty():
        return Data('', [], {})


class DictData(Data):
    def __init__(self, data, schema=None, **kwargs):
        super(DictData, self).__init__('json', [data], schema if schema else {k: str(type(v)) for k, v in iteritems(data)}, **kwargs)


class ListData(Data):
    def __init__(self, data, schema=None, **kwargs):
        if len(data) > 0 and not isinstance(data[0], dict):
            raise NotImplementedError()
        super(ListData, self).__init__('json', data, schema if schema else {k: str(type(v)) for k, v in iteritems(data[0])} if len(data) > 0 else {}, **kwargs)


def _is_dict(data, schema=None):
    if isinstance(data, dict):
        return DictData(data, schema)
    return Data.Empty()


def _is_list(data, schema=None):
    if isinstance(data, list):
        return ListData(data, schema)
    return Data.Empty()
