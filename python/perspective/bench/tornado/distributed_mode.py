################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import logging
import time

from bench import PerspectiveTornadoBenchmark

DOWNLOAD_ITERATIONS = 1
ARROW_LENGTH = 250000


async def make_view_arrow(client):
    """Test how long it takes to create a view on the remote table and
    retrieve an arrow."""
    table = client.open_table("data_source_one")
    view = table.view()
    start = time.time()
    arrow = await view.to_arrow(end_row=ARROW_LENGTH)
    end = time.time() - start
    assert len(arrow) > 0
    return [end]


async def open_view_arrow(client):
    """Test how long it takes to open a remote view and retrieve an arrow"""
    view = client.open_view("view_one")
    start = time.time()
    arrow = await view.to_arrow(end_row=ARROW_LENGTH)
    end = time.time() - start
    assert len(arrow) > 0
    return [end]


if __name__ == "__main__":
    """To allow your test script to run within the benchmark harness,
    import and create a `PerspectiveTornadoBenchmark`, and call its
    `run()` method.

    The `task` function you give to the benchmark must have `client` as
    an argument, and return a list of float times as the benchmark
    result.

    This will allow you to call the script from the command line with
    timing options:

    ```bash
    # 10 clients, 5 runs of task per client
    yarn bench test_benchmark.py -c10 -r5 ws://localhost:8080
    ```
    """
    logging.info("Create view, request arrow length %d", ARROW_LENGTH)
    runner = PerspectiveTornadoBenchmark(make_view_arrow)
    runner.run()
    logging.info("Open view, request arrow length %d", ARROW_LENGTH)
    runner2 = PerspectiveTornadoBenchmark(open_view_arrow)
    runner2.run()
