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

import base64
import logging
import os
import re
import importlib.metadata

from string import Template
from ipywidgets import DOMWidget
from traitlets import Unicode, observe
from .viewer import PerspectiveViewer

__version__ = re.sub(
    "(rc|alpha|beta)", "-\\1.", importlib.metadata.version("perspective-python")
)


class PerspectiveWidget(DOMWidget, PerspectiveViewer):
    """:class`~perspective.PerspectiveWidget` allows for Perspective to be used
    in the form of a Jupyter IPython widget.

    Using `perspective.Table`, you can create a widget that extends the full
    functionality of `perspective-viewer`.  Changes on the viewer can be
    programatically set on the :class`~perspective.PerspectiveWidget` instance,
    and state is maintained across page refreshes.

    Examples:
        >>> from perspective.widget import PerspectiveWidget
        >>> data = {
        ...     "a": [1, 2, 3],
        ...     "b": [
        ...         "2019/07/11 7:30PM",
        ...         "2019/07/11 8:30PM",
        ...         "2019/07/11 9:30PM"
        ...     ]
        ... }
        >>> widget = PerspectiveWidget(
        ...     data,
        ...     group_by=["a"],
        ...     sort=[["b", "desc"]],
        ...     filter=[["a", ">", 1]]
        ... )
        >>> widget.sort
        [["b", "desc"]]
        >>> widget.sort.append(["a", "asc"])
        >>> widget.sort
        [["b", "desc"], ["a", "asc"]]
        >>> widget.table.update({"a": [4, 5]}) # Browser UI updates
    """

    # Required by ipywidgets for proper registration of the backend
    _model_name = Unicode("PerspectiveModel").tag(sync=True)
    _model_module = Unicode("@finos/perspective-jupyterlab").tag(sync=True)
    _model_module_version = Unicode("~{}".format(__version__)).tag(sync=True)
    _view_name = Unicode("PerspectiveView").tag(sync=True)
    _view_module = Unicode("@finos/perspective-jupyterlab").tag(sync=True)
    _view_module_version = Unicode("~{}".format(__version__)).tag(sync=True)

    def __init__(
        self,
        data,
        index=None,
        limit=None,
        binding_mode="server",
        **kwargs,
    ):
        """Initialize an instance of :class`~perspective.PerspectiveWidget`
        with the given table/data and viewer configuration.

        If a pivoted DataFrame or MultiIndex table is passed in, the widget
        preserves pivots and applies them.  See `PerspectiveViewer.__init__` for
        arguments that transform the view shown in the widget.

        Args:
            data (:obj:`Table`|:obj:`View`|:obj:`dict`|:obj:`list`|:obj:`pandas.DataFrame`|:obj:`bytes`|:obj:`str`): a
                `perspective.Table` instance, a `perspective.View` instance, or
                a dataset to be loaded in the widget.

        Keyword Arguments:
            index (:obj:`str`): A column name to be used as the primary key.
                Ignored if `server` is True.

            limit (:obj:`int`): A upper limit on the number of rows in the Table.
                Cannot be set at the same time as `index`, ignored if `server`
                is True.

            binding_mode (:obj:`str`): "client-server" or "server"

            kwargs (:obj:`dict`): configuration options for the `PerspectiveViewer`,
                and `Table` constructor if `data` is a dataset.

        Examples:
            >>> widget = PerspectiveWidget(
            ...     {"a": [1, 2, 3]},
            ...     aggregates={"a": "avg"},
            ...     group_by=["a"],
            ...     sort=[["b", "desc"]],
            ...     filter=[["a", ">", 1]],
            ...     expressions=["\"a\" + 100"])
        """

        self.binding_mode = binding_mode

        # Pass table load options to the front-end, unless in server mode
        self._options = {}

        if index is not None and limit is not None:
            raise TypeError("Index and Limit cannot be set at the same time!")

        # Parse the dataset we pass in - if it's Pandas, preserve pivots
        # if isinstance(data, pandas.DataFrame) or isinstance(data, pandas.Series):
        #     data, config = deconstruct_pandas(data)

        #     if config.get("group_by", None) and "group_by" not in kwargs:
        #         kwargs.update({"group_by": config["group_by"]})

        #     if config.get("split_by", None) and "split_by" not in kwargs:
        #         kwargs.update({"split_by": config["split_by"]})

        #     if config.get("columns", None) and "columns" not in kwargs:
        #         kwargs.update({"columns": config["columns"]})

        # Initialize the viewer
        super(PerspectiveWidget, self).__init__(**kwargs)

        # Handle messages from the the front end
        self.on_msg(self.handle_message)
        self._sessions = {}

        # If an empty dataset is provided, don't call `load()` and wait
        # for the user to call `load()`.
        if data is None:
            if index is not None or limit is not None:
                raise TypeError(
                    "Cannot initialize PerspectiveWidget `index` or `limit` without a Table, data, or schema!"
                )
        else:
            if index is not None:
                self._options.update({"index": index})

            if limit is not None:
                self._options.update({"limit": limit})

            self.load(data, **self._options)

    def load(self, data, **options):
        """Load the widget with data."""
        # Viewer will ignore **options if `data` is a Table or View.
        super(PerspectiveWidget, self).load(data, **options)

    def update(self, data):
        """Update the widget with new data."""
        super(PerspectiveWidget, self).update(data)

    def clear(self):
        """Clears the widget's underlying `Table`."""
        super(PerspectiveWidget, self).clear()

    def replace(self, data):
        """Replaces the widget's `Table` with new data conforming to the same
        schema. Does not clear user-set state. If in client mode, serializes
        the data and sends it to the browser.
        """
        super(PerspectiveWidget, self).replace(data)

    def delete(self, delete_table=True):
        """Delete the Widget's data and clears its internal state.

        Args:
            delete_table (`bool`): whether the underlying `Table` will be
                deleted. Defaults to True.
        """
        super(PerspectiveWidget, self).delete(delete_table)

        # Close the underlying comm and remove widget from the front-end
        self.close()

    @observe("value")
    def handle_message(self, widget, content, buffers):
        """Given a message from `PerspectiveJupyterClient.send()`, process the
        message and return the result to `self.post`.

        Args:
            widget: a reference to the `Widget` instance that received the
                message.
            content (dict): the message from the front-end. Automatically
                de-serialized by ipywidgets.
            buffers : optional arraybuffers from the front-end, if any.
        """
        if content["type"] == "connect":
            client_id = content["client_id"]
            logging.debug("view {} connected", client_id)
            self._sessions[client_id] = self.new_proxy_session(
                lambda msg: self.send(
                    {"type": "binary_msg", "client_id": client_id}, [msg]
                )
            )
        elif content["type"] == "binary_msg":
            [binary_msg] = buffers
            client_id = content["client_id"]
            session = self._sessions[client_id]
            logging.debug("view {} message {}", client_id, len(binary_msg))
            if session is not None:
                session.handle_request(binary_msg)
            else:
                logging.error("No session for client_id {}".format(client_id))
        elif content["type"] == "hangup":
            # XXX(tom): client won't reliably send this so shouldn't rely on it
            # to clean up; does jupyter notify us when the client on the
            # websocket, i.e. the view, disconnects?
            client_id = content["client_id"]
            logging.debug("view {} hangup", client_id)
            session = self._sessions.pop(client_id, None)
            if session:
                session.close()

    def _repr_mimebundle_(self, **kwargs):
        super_bundle = super(DOMWidget, self)._repr_mimebundle_(**kwargs)
        if not _jupyter_html_export_enabled():
            return super_bundle

        # Serialize viewer attrs + view data to be rendered in the template
        viewer_attrs = self.save()
        data = self.table.view().to_arrow()
        b64_data = base64.encodebytes(data)
        template_path = os.path.join(
            os.path.dirname(__file__), "../templates/exported_widget.html.template"
        )
        with open(template_path, "r") as template_data:
            template = Template(template_data.read())

        def psp_cdn(module, path=None):
            if path is None:
                path = f"cdn/{module}.js"

            # perspective developer affordance: works with your local `pnpm run start blocks`
            # return f"http://localhost:8080/node_modules/@finos/{module}/dist/{path}"
            return f"https://cdn.jsdelivr.net/npm/@finos/{module}@{__version__}/dist/{path}"

        return super(DOMWidget, self)._repr_mimebundle_(**kwargs) | {
            "text/html": template.substitute(
                psp_cdn_perspective=psp_cdn("perspective"),
                psp_cdn_perspective_viewer=psp_cdn("perspective-viewer"),
                psp_cdn_perspective_viewer_datagrid=psp_cdn(
                    "perspective-viewer-datagrid"
                ),
                psp_cdn_perspective_viewer_d3fc=psp_cdn("perspective-viewer-d3fc"),
                psp_cdn_perspective_viewer_themes=psp_cdn(
                    "perspective-viewer-themes", "css/themes.css"
                ),
                viewer_id=self.model_id,
                viewer_attrs=viewer_attrs,
                b64_data=b64_data.decode("utf-8"),
            )
        }


def _jupyter_html_export_enabled():
    return os.environ.get("PSP_JUPYTER_HTML_EXPORT", None) == "1"


def set_jupyter_html_export(val):
    """Enables HTML export for Jupyter widgets, when set to True.
    HTML export can also be enabled by setting the environment variable
    `PSP_JUPYTER_HTML_EXPORT` to the string `1`.
    """
    os.environ["PSP_JUPYTER_HTML_EXPORT"] = "1" if val else "0"
