import sys
import json


def _is_pandas(data, as_string=False):
    try:
        if 'pandas' in sys.modules:
            import pandas as pd
            if isinstance(data, pd.DataFrame):
                if 'index' not in data.columns:
                    ret_df = data.reset_index()
                    df = data.reset_index()
                else:
                    df = data.copy()
                    ret_df = data
                for x in df.dtypes.iteritems():
                    if 'date' in str(x[1]):
                        df[x[0]] = df[x[0]].astype(str)
                if as_string:
                    ret_dat = df.to_json(orient='records')
                else:
                    ret_dat = df.to_dict(orient='records')
                return 'pandas', ret_df, ret_dat
            elif isinstance(data, pd.Series):
                ret_df = data.reset_index()
                df = data.reset_index()
                for x in df.dtypes.iteritems():
                    if 'date' in str(x[1]):
                        df[x[0]] = df[x[0]].astype(str)
                if as_string:
                    ret_dat = df.to_json(orient='records')
                else:
                    ret_dat = df.to_dict(orient='records')
                return 'pandas', ret_df, ret_dat
    except ImportError:
        return '', '', ''
    return '', '', ''


def _is_lantern(data, as_string=False):
    try:
        if 'lantern' in sys.modules:
            import lantern as l
            if isinstance(data, l.LanternLive):
                return 'lantern', data, data.path()
    except ImportError:
        return '', '', ''
    return '', '', ''


def _is_remote(data, as_string=False):
    if isinstance(data, str):
        if ('http://' in data and 'http://' == data[:7]) or \
           ('https://' in data and 'https://' == data[:8]) or \
           ('ws://' in data and 'ws://' == data[:5]) or \
           ('wss://' in data and 'wss://' == data[:6]) or \
           ('sio://' in data and 'sio://' == data[:6]):
            return 'url', data, data
    return '', '', ''


def _is_dict(data, as_string=False):
    if isinstance(data, dict):
        if as_string:
            return 'dict', data, json.dumps([data])
        else:
            return 'dict', data, [data]
    return '', '', ''


def _is_list(data, as_string=False):
    if isinstance(data, list):
        if as_string:
            return 'list', data, json.dumps(data)
        else:
            return 'list', data, data
    return '', '', ''


def type_detect(data, as_string=False):
    for foo in EXPORTERS:
        type_str, data_mod, data_ret = foo(data, as_string)
        if type_str:
            return type_str, data_mod, data_ret
    # throw error?
    return '', data, data


EXPORTERS = [_is_pandas, _is_lantern, _is_remote, _is_dict, _is_list]
