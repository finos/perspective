import ujson


def config(config, data):
    if not isinstance(data, str):
        return ''

    config = {} if config is None else config
    if isinstance(config, str):
        config = ujson.loads(config)

    if ('http://' in data and 'http://' == data[:7]) or \
       ('https://' in data and 'https://' == data[:8]):

        ret = {}
        ret['field'] = config.get('field', '')
        ret['records'] = config.get('records', False)
        ret['repeat'] = config.get('repeat', 10)
        return ujson.dumps(ret)

    elif ('ws://' in data and 'ws://' == data[:5]) or \
         ('wss://' in data and 'wss://' == data[:6]):

        ret = {}
        ret['send'] = ujson.dumps(config.get('send', {}))  # double json
        ret['records'] = config.get('records', False)
        return ujson.dumps(ret)

    elif ('sio://' in data and 'sio://' == data[:6]):

        ret = {}
        ret['channel'] = config.get('channel', '')
        ret['records'] = config.get('records', False)
        return ujson.dumps(ret)

    else:
        return ''
