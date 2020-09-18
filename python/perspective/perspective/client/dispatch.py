################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
_CALLBACK_CACHE = {}
_CALLBACK_INDEX = 0


def async_queue(client, name, method, cmd, *args, **kwargs):
    """Given a method, command, and expected arguments, create a message to
    send to the Perspective server implementation and `post` it through
    the client."""
    arguments = list(args)

    if len(kwargs) > 0:
        arguments.append(kwargs)

    msg = {
        "cmd": cmd,
        "name": name,
        "method": method,
        "args": arguments,
        "subscribe": False,
    }

    future = client._create_future()
    client.post(msg, future, keep_alive=False)
    return future


def subscribe(client, name, method, cmd, *args, **kwargs):
    """Subscribe to an event that occurs on the Perspective server
    implementation, like `on_update`."""
    global _CALLBACK_INDEX

    arguments = list(args)
    callback = None

    for arg in arguments[::-1]:
        if callable(arg):
            callback = arg

    if len(kwargs) > 0:
        arguments.append(kwargs)

    _CALLBACK_INDEX += 1
    _CALLBACK_CACHE[callback] = _CALLBACK_INDEX

    msg = {
        "cmd": cmd,
        "name": name,
        "method": method,
        "args": arguments,
        "subscribe": True,
        "callback_id": _CALLBACK_INDEX,
    }

    future = client._create_future()
    client.post(msg, future, keep_alive=True)
    return future


def unsubscribe(client, name, method, cmd, *args, **kwargs):
    """Unsubscribe from an event that occurs on the Perspective server
    implementation, like `remove_update`."""
    arguments = list(args)
    callback = None

    for arg in arguments[::-1]:
        if callable(arg):
            callback = arg

    if len(kwargs) > 0:
        arguments.append(kwargs)

    callback_id = _CALLBACK_CACHE.get(callback)
    del _CALLBACK_CACHE[callback]

    msg = {
        "cmd": cmd,
        "name": name,
        "method": method,
        "args": arguments,
        "subscribe": True,
        "callback_id": callback_id,
    }

    future = client._create_future()
    client.post(msg, future, keep_alive=True)
    return future
