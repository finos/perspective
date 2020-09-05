import os
import os.path
import logging
import tornado.websocket
import tornado.web
import tornado.ioloop

from perspective import Table, PerspectiveManager, PerspectiveTornadoHandler


here = os.path.abspath(os.path.dirname(__file__))
file_path = os.path.join(here, "..", "..", "node_modules", "superstore-arrow", "superstore.arrow")


def make_app():
    with open(file_path, mode='rb') as file:        
        # Create an instance of `PerspectiveManager` and a table.
        MANAGER = PerspectiveManager()
        TABLE = Table(file.read(), index="Row ID")

        # Track the table with the name "data_source_one", which will be used
        # in the front-end to access the Table.
        MANAGER.host_table("data_source_one", TABLE)
        MANAGER.host_view("view_one", TABLE.view())

        return tornado.web.Application([
            # create a websocket endpoint that the client Javascript can access
            (r"/websocket", PerspectiveTornadoHandler, {
                "manager": MANAGER, 
                "check_origin": True
            }),
            (r"/node_modules/(.*)", tornado.web.StaticFileHandler, {
                "path": "../../node_modules/@finos/"
            }),
            (r"/(.*)",tornado.web.StaticFileHandler, {
                "path": "./", 
                "default_filename": "index.html"
            })
        ], websocket_ping_interval=15)


if __name__ == "__main__":
    app = make_app()
    app.listen(8080)
    logging.critical("Listening on http://localhost:8080")
    loop = tornado.ioloop.IOLoop.current()
    loop.start()
