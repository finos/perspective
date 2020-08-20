################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import os
import argparse
import logging
import asyncio

from datetime import datetime


HERE = os.path.abspath(os.path.dirname(__file__))
CLIENT_PATH = os.path.join(HERE, "client_runner.py")

PARSER = argparse.ArgumentParser(description="Stress testing for Perspective's websocket interface.")

PARSER.add_argument(
    "--delay",
    dest="delay",
    type=float,
    default=0,
    help="The number of seconds to wait between starting each client."
)

PARSER.add_argument(
    "--debug",
    dest="debug",
    type=bool,
    default=False,
    help="Shows debug output."
)

PARSER.add_argument(
    "--type",
    dest="test_type",
    default="table",
    choices=["table", "view"],
    help="Whether the client should mimic a remote table (all operations are sent to the server) or a remote view (only updates are streamed)."
)

PARSER.add_argument(
    "--num_clients",
    default=5,
    type=int,
    dest="num_clients",
    help="The number of clients to run - each client will have its own subprocess.")

PARSER.add_argument(
    "url",
    type=str,
    help="A full Websocket URL to a remote Perspective server, which MUST host a table named `table` or/and a view named `view`."
)

if __name__ == "__main__":
    # Make sure you have an instance of server.py running in a separate
    # Python process. This script will run `--num_clients` Python subprocesses, each
    # making websocket requests to the server.
    log_level = logging.INFO

    args = PARSER.parse_args()

    if args.debug:
        log_level = logging.DEBUG

    logging.basicConfig(level=log_level)

    logging.info("Running %d client(s)", args.num_clients)

    dt = "{:%Y%m%dT%H%M%S}".format(datetime.now())
    subfolder_name = "{}_run_{}".format(args.test_type, dt)
    results_folder = os.path.join(HERE, "results")
    results_subfolder = os.path.join(results_folder, subfolder_name)

    if not os.path.exists(results_folder):
        logging.warning("Creating results folder: %s", results_folder)
        os.mkdir(results_folder)

    if not os.path.exists(subfolder_name):
        logging.warning("Creating results subfolder: %s", results_subfolder)
        os.mkdir(results_subfolder)

    logging.info("To display results, run host_results.py from python/perspective/bench/stresstest")

    processes = []

    async def run_subprocess(client_name):
        if args.delay:
            await asyncio.sleep(args.delay)
        proc = await asyncio.create_subprocess_exec("python3", CLIENT_PATH, results_subfolder, client_name, args.test_type, args.url)
        await proc.wait()

    loop = asyncio.get_event_loop()

    tasks = [
        asyncio.ensure_future(run_subprocess("client_{}".format(i))) for i in range(args.num_clients)
    ]

    loop.run_until_complete(asyncio.gather(*tasks))
    loop.close()
