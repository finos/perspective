import json


def config(config, data, as_string=True):
    if not isinstance(data, str):
        if as_string:
            return '{}'
        return {}

    config = {} if config is None else config

    if isinstance(config, str):
        config = json.loads(config)

    ret = {}
    if ('http://' in data and 'http://' == data[:7]) or \
       ('https://' in data and 'https://' == data[:8]):
        ret['field'] = config.get('field', '')
        ret['records'] = config.get('records', False)
        ret['repeat'] = config.get('repeat', 10)

    elif ('ws://' in data and 'ws://' == data[:5]) or \
         ('wss://' in data and 'wss://' == data[:6]):
        ret['send'] = json.dumps(config.get('send', {}))  # double json
        ret['records'] = config.get('records', False)

    elif ('sio://' in data and 'sio://' == data[:6]):
        ret['channel'] = config.get('channel', '')
        ret['records'] = config.get('records', False)

    if as_string:
        return json.dumps(ret)
    return ret
