# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import pandas
import json
from datetime import datetime
from functools import wraps
from time import mktime
from ipywidgets import Widget
from traitlets import observe, Unicode
from .data.pandas import deconstruct_pandas
from .exception import PerspectiveError
from .viewer import PerspectiveViewer


class DateTimeEncoder(json.JSONEncoder):
    '''Create a custom JSON encoder that allows serialization of datetime and date objects.'''

    def default(self, obj):
        if isinstance(obj, datetime):
            # Convert to milliseconds - perspective.js expects millisecond timestamps, but python generates them in seconds.
            return int((mktime(obj.timetuple()) + obj.microsecond / 1000000.0) * 1000)
        return super(DateTimeEncoder, self).default(obj)


class PerspectiveWidget(Widget, PerspectiveViewer):
    '''`PerspectiveWidget` allows for Perspective to be used in the form of a JupyterLab IPython widget.

    Using `perspective.Table`, you can create a widget that extends the full functionality of `perspective-viewer`.

    Changes on the viewer can be programatically set on the `PerspectiveWidget` instance, and state is maintained across page refreshes.

    Examples:
        >>> from perspective import Table, PerspectiveWidget
        >>> data = {"a": [1, 2, 3], "b": ["2019/07/11 7:30PM", "2019/07/11 8:30PM", "2019/07/11 9:30PM"]}
        >>> tbl = Table(data, index="a")
        >>> widget = PerspectiveWidget(tbl, row_pivots=["a"], sort=[["b", "desc"]], filter=[["a", ">", 1]])
        >>> widget
        PerspectiveWidget(tbl, row_pivots=["a"], sort=[["b", "desc"]], filter=[["a", ">", 1]])
        >>> widget.sort
        [["b", "desc"]]
        >>> widget.sort.append(["a", "asc"])
        >>> widget.sort
        [["b", "desc"], ["a", "asc"]]
        >>> widget.update({"a": [4, 5]}) # updates to the table reflect on the widget
    '''

    # Required by ipywidgets for proper registration of the backend
    _model_name = Unicode('PerspectiveModel').tag(sync=True)
    _model_module = Unicode('@finos/perspective-jupyterlab').tag(sync=True)
    _model_module_version = Unicode('^0.3.9').tag(sync=True)
    _view_name = Unicode('PerspectiveView').tag(sync=True)
    _view_module = Unicode('@finos/perspective-jupyterlab').tag(sync=True)
    _view_module_version = Unicode('^0.3.9').tag(sync=True)

    @wraps(PerspectiveViewer.__init__)
    def __init__(self,
                 table_or_data,
                 index=None,
                 limit=None,
                 **kwargs):
        '''Initialize an instance of `PerspectiveWidget` with the given table/data and viewer configuration.

        If a pivoted DataFrame or MultiIndex table is passed in, the widget preserves pivots and applies them.

        Args:
            table_or_data (perspective.Table|dict|list|pandas.DataFrame) : the table or data that will be viewed in the widget.
            **kwargs : configuration options for the `PerspectiveViewer`, and `Table` constructor if `table_or_data` is a dataset.

        Example:
            >>> widget = PerspectiveWidget(
                    {"a": [1, 2, 3]},
                    aggregates={"a": "avg"},
                    row_pivots=["a"],
                    sort=[["b", "desc"]],
                    filter=[["a", ">", 1]])
        '''
        # Handle messages from the the front end `PerspectiveJupyterClient.send()`.
        # - The "data" value of the message should be a JSON-serialized string.
        # - Both `on_msg` and `@observe("value")` must be specified on the handler for custom messages to be parsed by the Python widget.
        self.on_msg(self.handle_message)

        # Parse the dataset we pass in - if it's Pandas, preserve pivots
        if isinstance(table_or_data, pandas.DataFrame) or isinstance(table_or_data, pandas.Series):
            data, pivots = deconstruct_pandas(table_or_data)
            table_or_data = data

            if pivots.get("row_pivots", None):
                kwargs.update({"row_pivots": pivots["row_pivots"]})

            if pivots.get("column_pivots", None):
                kwargs.update({"column_pivots": pivots["column_pivots"]})

            if pivots.get("columns", None):
                kwargs.update({"columns": pivots["columns"]})

        # Initialize the viewer
        super(PerspectiveWidget, self).__init__(**kwargs)

        #  If an empty dataset is provided, don't call `load()`
        if table_or_data is None:
            if index is not None or limit is not None:
                raise PerspectiveError("Cannot initialize PerspectiveWidget `index` or `limit` without a Table, data, or schema!")
        else:
            if index is not None:
                kwargs.update({"index": index})

            if limit is not None:
                kwargs.update({"limit": limit})

            self.load(table_or_data, **kwargs)

    def post(self, msg):
        '''Post a serialized message to the `PerspectiveJupyterClient` in the front end.

        The posted message should conform to the `PerspectiveJupyterMessage` interface as defined in `@finos/perspective-jupyterlab`.

        Args:
            msg : a message from `PerspectiveManager` for the front-end viewer to process.
        '''
        self.send({
            "id": msg["id"],
            "type": "cmd",
            "data": json.dumps(msg, cls=DateTimeEncoder)
        })

    @observe("value")
    def handle_message(self, widget, content, buffers):
        '''Given a message from `PerspectiveJupyterClient.send()`, process the message and return the result to `self.post`.

        Args:
            widget : a reference to the `Widget` instance that received the message.
            content (dict) : the message from the front-end. Automatically de-serialized by ipywidgets.
            buffers : optional arraybuffers from the front-end, if any.
        '''
        if content["type"] == "cmd":
            parsed = json.loads(content["data"])

            if parsed["cmd"] == "init":
                self.post({'id': -1, 'data': None})
            elif parsed["cmd"] == "table" and self.table_name is not None:
                # Only pass back the table if it's been loaded. If the table isn't loaded, the `load()` method will handle synchronizing the front-end.
                self.send({
                    "id": -2,
                    "type": "table",
                    "data": self.table_name
                })
            else:
                # For all calls to Perspective, process it in the manager.
                self.manager.process(parsed, self.post)
