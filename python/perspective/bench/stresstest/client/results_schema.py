################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from datetime import datetime

# The schema of the results table, defined outside of the application code
# for ease of use and consistency across multiple files.
RESULTS_SCHEMA = {
    "client_id": str,  # a unique ID for each PerspectiveWebSocketClient
    "cmd": str,
    "method": str,
    "args": str,
    "send_timestamp": datetime,  # When the client sends the message through tornado
    "receive_timestamp": datetime,  # When the client receives and parses the message
    "microseconds_on_wire": float,  # receive - send, or for on_update, receive - when the server invokes the update callback
    "message_id": int,
    "errored": bool,
    "binary": bool,  # whether the message is an Arrow binary
    "byte_length": int,
    "server_received": datetime,  # When the tornado handler on the server receives the message
    "server_start_process_time": datetime,  # When manager._process is called
    "server_send_time": datetime,  # When the server tornado handler sends the response to the client
    "num_messages_logged": int,  # The total number of messages logged by the client
}
