################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import json
from datetime import datetime
from perspective import PerspectiveManager


class PerspectiveManagerWithTelemetry(PerspectiveManager):
    """An overloaded PerspectiveManager that tracks the execution time and
    memory usage of each message that it receives, and passes on that
    metadata to the `post_callback`.

    This can be used in test servers to measure performance."""

    def __init__(self, lock=False):
        """Initialize the manager with a map of message_id to dicts containing
        telemetry information to send to the client."""
        self._pending_telemetry = {}
        super(PerspectiveManagerWithTelemetry, self).__init__(lock=lock)

    def _process(self, msg, post_callback, client_id=None):
        """When the message arrives at the manager, create a telemetry
        packet that will be forwarded to the client."""
        json_msg = json.loads(msg)
        self._pending_telemetry[json_msg["id"]] = {
            "received": msg.get("received"),
            "start_time": datetime.now(),
            "cmd": msg.get("cmd"),
            "method": msg.get("method"),
            "args": msg.get("args")
        }
        super(PerspectiveManagerWithTelemetry, self)._process(self, msg, post_callback, client_id)

    def _message_to_json(self, id, message):
        """Attach the telemetry packet in self._pending_messages to the message
        before it is serialized to JSON."""
        if id in self._pending_telemetry:
            telemetry = self._pending_telemetry["id"]
            telemetry["end_time"] = datetime.now()
            message["telemetry"] = telemetry
        super(PerspectiveManagerWithTelemetry, self)._message_to_json(id, message)
