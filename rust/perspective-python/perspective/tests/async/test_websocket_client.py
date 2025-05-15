#  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
#  ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
#  ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
#  ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
#  ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
#  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
#  ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
#  ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
#  ┃ This file is part of the Perspective library, distributed under the terms ┃
#  ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
#  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import asyncio
import threading
import websocket

import tornado.websocket
import tornado.web
import tornado.ioloop

import perspective
import perspective.handlers.tornado

PORT = 8082


def test_big_multi_thing(superstore):
    async def init_table(client):
        global SERVER_DATA
        global SERVER_TABLE

        SERVER_DATA = "x,y\n1,2\n3,4"
        # with open(file_path, mode="rb") as file:
        SERVER_TABLE = client.table(SERVER_DATA, name="superstore")

        global ws
        ws = websocket.WebSocketApp(
            "ws://localhost:{}/websocket".format(PORT),
            on_open=on_open,
            on_message=on_message,
            # on_error=on_error,
            # on_close=on_close,
        )

        global ws_thread
        ws_thread = threading.Thread(target=ws.run_forever)
        ws_thread.start()

    def server_thread():
        def make_app(perspective_server):
            return tornado.web.Application(
                [
                    (
                        r"/websocket",
                        perspective.handlers.tornado.PerspectiveTornadoHandler,
                        {"perspective_server": perspective_server},
                    ),
                ]
            )

        perspective_server = perspective.Server()
        app = make_app(perspective_server)
        global server
        server = app.listen(PORT, "0.0.0.0")

        global server_loop
        server_loop = tornado.ioloop.IOLoop.current()
        client = perspective_server.new_local_client()
        server_loop.call_later(0, init_table, client)
        server_loop.start()

    server_thread = threading.Thread(target=server_thread)
    server_thread.start()

    client_loop = asyncio.new_event_loop()
    client_loop.set_debug(True)
    client_thread = threading.Thread(target=client_loop.run_forever)
    client_thread.start()

    async def send_request(msg):
        global ws
        ws.send(msg, websocket.ABNF.OPCODE_BINARY)

    def on_message(ws, message):
        async def poke_client():
            await client.handle_response(message)

        asyncio.run_coroutine_threadsafe(poke_client(), client_loop)

    # def on_error(ws, error):
    #     print(f"Error!: {error}")

    # def on_close(ws, close_status_code, close_msg):
    #     print("Connection closed")

    def on_open(ws):
        global client
        client = perspective.AsyncClient(send_request)
        asyncio.run_coroutine_threadsafe(test(client), client_loop)

    global count
    count = 0

    def update(x):
        global count
        count += 1

    async def test(client):
        table = await client.open_table("superstore")
        view = await table.view()
        await view.on_update(update)
        SERVER_TABLE.update(SERVER_DATA)
        assert await table.size() == 4
        assert count == 1
        await server.close_all_connections()
        client_loop.stop()

    client_thread.join()
    client_loop.close()
    ws.close()
    ws_thread.join()
    server_loop.add_callback(server_loop.stop)
    server_thread.join()
    server_loop.close()
