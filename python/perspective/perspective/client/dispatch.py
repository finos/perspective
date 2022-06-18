################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import asyncio


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

    future = asyncio.Future()
    client.post(msg, future)
    return future


def subscribe(client, name, method, cmd, *args, **kwargs):
    """Subscribe to an event that occurs on the Perspective server
    implementation, like `on_update`."""
    arguments = list(args)
    callback = None

    for i in range(len(arguments)):
        if callable(arguments[i]):
            callback = arguments.pop(i)

    if len(kwargs) > 0:
        arguments.append(kwargs)

    # Instead of storing in a global map, store the callbacks on the
    # client itself.
    client._callback_id += 1
    client._callback_cache[callback] = client._callback_id
    client._callback_id_cache[client._callback_id] = callback

    msg = {
        "cmd": cmd,
        "name": name,
        "method": method,
        "args": arguments,
        "subscribe": True,
        "callback_id": client._callback_id,
    }

    client.post(msg, keep_alive=True)


def unsubscribe(client, name, method, cmd, *args, **kwargs):
    """Unsubscribe from an event that occurs on the Perspective server
    implementation, like `remove_update`."""
    arguments = list(args)
    callback = None

    for i in range(len(arguments)):
        if callable(arguments[i]):
            callback = arguments.pop(i)

    if len(kwargs) > 0:
        arguments.append(kwargs)

    callback_id = client._callback_cache.get(callback)
    del client._callback_cache[callback]
    del client._callback_id_cache[callback_id]

    msg = {
        "cmd": cmd,
        "name": name,
        "method": method,
        "args": arguments,
        "subscribe": True,
        "callback_id": callback_id,
    }

    client.post(msg, keep_alive=True)
