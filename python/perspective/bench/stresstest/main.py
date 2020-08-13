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


HERE = os.path.abspath(os.path.dirname(__file__))
CLIENT_PATH = os.path.join(HERE, "client.py")

PARSER = argparse.ArgumentParser(description="Stress testing for Perspective's websocket interface.")

PARSER.add_argument(
    "--num_clients",
    default=5,
    type=int,
    dest="num_clients",
    help="The number of clients to run - each client will have its own subprocess.")

if __name__ == "__main__":
    # Make sure you have an instance of server.py running in a separate
    # Python process. This script will run 10 Python subprocesses, each
    # making websocket requests to the server.
    logging.basicConfig(level=logging.DEBUG)

    args = PARSER.parse_args()
    NUM_CLIENTS = args.num_clients

    logging.info("Running %d client(s)", NUM_CLIENTS)

    results_folder = os.path.join(HERE, "results")

    if not os.path.exists(results_folder):
        logging.warning("Creating results folder: %s", results_folder)
        os.mkdir(results_folder)

    processes = []

    async def run_subprocess(client_name):
        proc = await asyncio.create_subprocess_exec("python3", CLIENT_PATH, client_name)
        await proc.wait()

    loop = asyncio.get_event_loop()

    tasks = [
        asyncio.ensure_future(run_subprocess("client_{}".format(i))) for i in range(NUM_CLIENTS)
    ]

    loop.run_until_complete(asyncio.gather(*tasks))
    loop.close()
