from six import iteritems
import json


def convert_to_psp_schema(schema):
    d = {}
    for k, v in iteritems(schema):
        if 'float' in v:
            d[k] = 'float'
        elif 'int' in v:
            d[k] = 'integer'
        elif 'bool' in v:
            d[k] = 'boolean'
        elif ':' in v or '-' in v or 'date' in v or 'time' in v:
            d[k] = 'date'
        elif 'str' in v or 'string' in v:
            d[k] = 'string'
        else:
            d[k] = 'string'
    return d


def validate_schema(schema):
    return convert_to_psp_schema(schema)


def schema(data, typ):
    schema = validate_schema(data, typ)
    return json.dumps(schema)
