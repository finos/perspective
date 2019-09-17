# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import os
import os.path
import psutil
import shutil
import subprocess
import zerorpc

_PSP_ENV_VAR = 'PERSPECTIVE_NODE_HOST'
_NODE_BUNDLE = os.path.abspath(os.path.join(os.path.dirname(__file__), 'assets', 'bundle.js'))


def _get_open_port():
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("", 0))
    s.listen(1)
    port = s.getsockname()[1]
    s.close()
    return port


def _kill(proc_pid):
    process = psutil.Process(proc_pid)
    for proc in process.children(recursive=True):
        proc.kill()
    process.kill()


class _PerspectiveView(object):
    def __init__(self, view_id=-1, parent=None):
        if not parent:
            raise Exception('PSP in inconsistent state!')
        self._parent = parent
        self.__view_id = view_id

    @property
    def view_id(self):
        return self.__view_id

    def to_json(self):
        return self._parent.to_json(self)

    def to_columns(self):
        return self._parent.to_columns(self)


class Perspective(object):
    def __init__(self, node_server='127.0.0.1', port=None):
        if not shutil.which('node'):
            raise Exception('Must have node available')

        if node_server == '127.0.0.1':
            self.launch_node = True
            if port:
                self.node_host = '{node_server}:{port}'.format(node_server=node_server, port=port)
            else:
                self.node_host = '{node_server}:{port}'.format(node_server=node_server, port=_get_open_port())
        else:
            self.launch_node = False
            if port:
                self.node_host = '{node_server}:{port}'.format(node_server=node_server, port=port)
            else:
                self.node_host = '{node_server}'.format(node_server=node_server)
        self.connected = False

    def start(self):
        if not self.launch_node:
            self.node_pid = None
        else:
            env = os.environ.copy()
            env[_PSP_ENV_VAR] = self.node_host
            self.node_pid = subprocess.Popen([shutil.which('node'), _NODE_BUNDLE], env=env).pid
        self.client = zerorpc.Client()
        self.reconnect()

    def reconnect(self):
        while True:
            try:
                self.client.connect("tcp://{host}".format(host=self.node_host))
                self.client.heartbeat()
                self.connected = True
                break
            except zerorpc.LostRemote:
                pass

    def stop(self):
        if self.node_pid:
            _kill(self.node_pid)
            self.node_pid = None

    def _raise_disconnected(self):
        raise Exception('Disconnected from node server!')

    def table(self, data, options=None):
        if not self.connected:
            self._raise_disconnected()
        options = None or {}
        self.client.table(data, options)

    def update(self, data):
        if not self.connected:
            self._raise_disconnected()
        self.client.update(data)

    def remove(self, data):
        if not self.connected:
            self._raise_disconnected()
        self.client.remove(data)

    def view(self, config):
        if not self.connected:
            self._raise_disconnected()
        return _PerspectiveView(self.client.view(config), self)

    def to_json(self, view=None):
        if not self.connected:
            self._raise_disconnected()
        if view:
            return self.client.to_json(view.view_id)
        return self.client.to_json(-1)

    def to_columns(self, view=None):
        if not self.connected:
            self._raise_disconnected()
        if view:
            return self.client.to_columns(view.view_id)
        return self.client.to_columns(-1)
