################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import time
import json
from datetime import datetime
from perspective import PerspectiveTornadoHandler
from perspective.manager.manager_internal import DateTimeEncoder


class PerspectiveTornadoHandlerWithTelemetry(PerspectiveTornadoHandler):
    """An implementation of PerspectiveTornadoHandler that accesses telemetry
    data from its PerspectiveManagerWithTelemetry instance."""

    def on_message(self, message):
        """Logs when the message is received by the server before passing it on
        to the tornado handler to process."""
        if message == "heartbeat":
            return

        msg = json.loads(message)
        msg["received"] = datetime.now()
        super(PerspectiveTornadoHandlerWithTelemetry, self).on_message(
            json.dumps(msg, cls=DateTimeEncoder)
        )

    def post(self, message, binary=False):
        """Add telemetry to the message with a `send_time` field, which
        contains the `time.time()` in microseconds of when the message
        was sent."""
        if not binary:
            msg = json.loads(message)

            # Fallback for on_update, which calls "post_callback" without
            # going through `_process`
            if msg["id"] in self._manager._pending_telemetry:
                telemetry = self._manager._pending_telemetry[msg["id"]]
                telemetry["server_send_time"] = datetime.now()
                msg["telemetry"] = telemetry

                if telemetry.get("method") != "on_update":
                    self._manager._pending_telemetry.pop(msg["id"])

            msg["send_time"] = time.time() * 100000
            super(PerspectiveTornadoHandlerWithTelemetry, self).post(
                json.dumps(msg, cls=DateTimeEncoder), binary
            )
        else:
            super(PerspectiveTornadoHandlerWithTelemetry, self).post(message, binary)
