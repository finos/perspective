################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import os
import os.path
import time
import numpy
from runner import PerspectiveBenchRunner

TABLE_SCALAR = 20
DOWNLOAD_ITERATIONS = 1
NUM_CLIENTS = 10

file_path = os.path.join(
    os.path.abspath(os.path.dirname(__file__)),
    "..",
    "..",
    "..",
    "..",
    "..",
    "node_modules",
    "superstore-arrow",
    "superstore.arrow",
)


async def client_task(client):
    """Given a Perspective websocket client connected to the `url` specified
    when running this script, run and time a set of actions, returning a
    list of times to the runner."""
    times = numpy.zeros(DOWNLOAD_ITERATIONS)
    table = client.open_table("data_source_one")
    view = table.view()
    for i in range(DOWNLOAD_ITERATIONS):
        start = time.time()
        arrow = await view.to_arrow()
        times[i] = time.time() - start
        assert len(arrow) > 0
    return times


if __name__ == "__main__":
    """To allow your test script to run within the benchmark harness,
    import and create a `PerspectiveBenchRunner`. This will allow you to
    call the script from the command line with timing options:

    ```bash
    python3 gil_test.py -c10 -r5 # 10 clients, 5 runs of `client_task`/client
    ```
    """
    PerspectiveBenchRunner(client_task)
