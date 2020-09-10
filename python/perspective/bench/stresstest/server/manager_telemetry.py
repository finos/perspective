################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import logging
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
        self._pending_telemetry[msg["id"]] = {
            "server_received": msg.get("received"),
            "server_start_process_time": datetime.now(),
            "remote_client_id": msg.get("remote_client_id"),
            "cmd": msg.get("cmd"),
            "method": msg.get("method"),
            "args": msg.get("args"),
            "session_id": client_id,
        }
        logging.info(
            "Received %s from %s, id: %d",
            msg.get("method"),
            msg.get("remote_client_id"),
            msg["id"],
        )
        super(PerspectiveManagerWithTelemetry, self)._process(
            msg, post_callback, client_id=client_id
        )

    def callback(self, *args, **kwargs):
        msg = kwargs.get("msg")
        id = msg["id"]
        if id in self._pending_telemetry:
            telemetry = self._pending_telemetry[id]
            # server_start_process_time should be when the callback
            # was executed on the server, not the initial time the
            # server received the message.
            telemetry["server_start_process_time"] = datetime.now()
            msg["telemetry"] = telemetry

        logging.debug("manager.callback was executed for message ID %d", id)
        super(PerspectiveManagerWithTelemetry, self).callback(*args, **kwargs)

    def _message_to_json(self, id, message):
        """Attach the telemetry packet in self._pending_messages to the message
        before it is serialized to JSON."""
        if id in self._pending_telemetry:
            telemetry = self._pending_telemetry[id]
            telemetry["server_send_time"] = datetime.now()
            message["telemetry"] = telemetry

            if telemetry.get("method") != "on_update":
                self._pending_telemetry.pop(id)

        logging.debug(
            "Sending %s to %s, id: %d",
            telemetry.get("method"),
            telemetry.get("remote_client_id"),
            id,
        )
        return super(PerspectiveManagerWithTelemetry, self)._message_to_json(
            id, message
        )
