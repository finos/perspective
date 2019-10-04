# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import json
from datetime import datetime
from random import random
from ipywidgets import Widget
from traitlets import observe, Unicode
from .traitlets import PerspectiveTraitlets
from .validate import validate_plugin, validate_columns, validate_row_pivots, validate_column_pivots, \
    validate_aggregates, validate_sort, validate_filters, validate_plugin_config
from ..table import PerspectiveManager, Table


class DateTimeEncoder(json.JSONEncoder):
    '''Create a custom JSON encoder that allows serialization of datetime and date objects.'''

    def default(self, obj):
        if isinstance(obj, datetime):
            # Convert to milliseconds - perspective.js expects millisecond timestamps, but python generates them in seconds.
            return obj.timestamp() * 1000
        return super(DateTimeEncoder, self).default(obj)


class PerspectiveWidget(Widget, PerspectiveTraitlets):
    '''`PerspectiveWidget` allows for Perspective to be used in the form of a JupyterLab IPython widget.

    Using `perspective.Table`, you can create a widget that extends the full functionality of `perspective-viewer`.

    Changes on the viewer can be programatically set on the `PerspectiveWidget` instance, and state is maintained across page refreshes.

    Examples:
        >>> from perspective import Table, PerspectiveWidget
        >>> data = {"a": [1, 2, 3], "b": ["2019/07/11 7:30PM", "2019/07/11 8:30PM", "2019/07/11 9:30PM"]}
        >>> tbl = Table(data, index="a")
        >>> widget = PerspectiveWidget(row_pivots=["a"], sort=[["b", "desc"]], filter=[["a", ">", 1]])
        >>> widget.load(tbl) # or widget.load(data) - a Table will be created for you
        >>> widget
        PerspectiveWidget(row_pivots=["a"], sort=[["b", "desc"]], filter=[["a", ">", 1]])
        >>> widget.sort
        [["b", "desc"]]
        >>> widget.sort.append(["a", "asc"])
        >>> widget.sort
        [["b", "desc"], ["a", "asc"]]
        >>> tbl.update({"a": [4, 5]}) # updates to the table reflect on the widget
    '''

    # Required by ipywidgets for proper registration of the backend
    _model_name = Unicode('PerspectiveModel').tag(sync=True)
    _model_module = Unicode('@finos/perspective-jupyterlab').tag(sync=True)
    _model_module_version = Unicode('^0.3.0').tag(sync=True)
    _view_name = Unicode('PerspectiveView').tag(sync=True)
    _view_module = Unicode('@finos/perspective-jupyterlab').tag(sync=True)
    _view_module_version = Unicode('^0.3.0').tag(sync=True)

    def __init__(self,
                 plugin='hypergrid',
                 columns=None,
                 row_pivots=None,
                 column_pivots=None,
                 aggregates=None,
                 sort=None,
                 filters=None,
                 plugin_config=None,
                 dark=False,
                 *args,
                 **kwargs):
        '''Initialize an instance of `PerspectiveWidget` with the given viewer configuration.

        Do not pass a `Table` or data into the constructor—use the `load()` method to provide the widget with data.

        Params:
            plugin (str) : the grid or visualization that will be displayed on render. Defaults to "hypergrid".
            columns (list[str]) : column names that will be actively displayed to the user. Columns not in this list will exist on the viewer sidebar
                but not in the visualization. If not specified, all colummns present in the dataset will be shown.
            row_pivots (list[str]) : columns that will be used to group data together by row.
            column_pivots (list[str]) : columns that will be used to group data together by unique column value.
            aggregates (dict{str:str}) : a mapping of column names to aggregate types, specifying how data should be aggregated when pivots are applied.
            sort (list[list[str]]) : a list of sort specifications to apply to the view.
                Sort specifications are lists of two elements: a string column name to sort by, and a string sort direction ("asc", "desc").
            filters (list[list[str]]) : a list of filter configurations to apply to the view.
                Filter configurations are lists of three elements: a string column name, a string filter operator ("<", ">", "==", "not null", etc.),
                and a value to filter by. Make sure the type of the filter value is the same as the column type, i.e. a string column should not be filtered by integer.
            plugin_config (dict) : an optional configuration containing the interaction state of a `perspective-viewer`.
            dark (bool) : enables/disables dark mode on the viewer. Defaults to `False`.

        Example:
            >>> widget = PerspectiveWidget(aggregates={"a": "avg"}, row_pivots=["a"], sort=[["b", "desc"]], filter=[["a", ">", 1]])
        '''
        super(PerspectiveWidget, self).__init__(*args, **kwargs)

        # Create an instance of `PerspectiveManager`, which receives messages from the `PerspectiveJupyterClient` on the front-end.
        self.manager = PerspectiveManager()

        # Viewer configuration
        self.plugin = validate_plugin(plugin)
        self.columns = validate_columns(columns) or []
        self.row_pivots = validate_row_pivots(row_pivots) or []
        self.column_pivots = validate_column_pivots(column_pivots) or []
        self.aggregates = validate_aggregates(aggregates) or {}
        self.sort = validate_sort(sort) or []
        self.filters = validate_filters(filters) or []
        self.plugin_config = validate_plugin_config(plugin_config) or {}
        self.dark = dark

        '''
        Handle messages from the the front end `PerspectiveJupyterClient.send()`.

        The "data" value of the message should be a JSON-serialized string.

        Both `on_msg` and `@observe("value")` must be specified on the handler for custom messages to be parsed by the Python widget.
        '''
        self.on_msg(self.handle_message)

    def load(self, table_or_data, **options):
        '''Given a `perspective.Table` or data that can be handled by `perspective.Table`, pass it to the widget.

        `load()` resets the state of the viewer.

        If a `perspective.Table` is passed into `table_or_data`, `**options` is ignored as the options already set on the `Table` take precedence.

        If data is passed in, a `perspective.Table` is automatically created by this function,
        and the options passed to `**config` are extended to the new Table.

        Params:
            table_or_data (Table|dict|list|pandas.DataFrame) : a `perspective.Table` instance or a dataset to be displayed in the widget.
            **options : optional keyword arguments that will be parsed by the `perspective.Table` constructor if data is passed in.
                - index (str) : the name of a column that will be the dataset's primary key. This sorts the dataset in ascending order based on primary key.
                - limit (int) : cannot be applied at the same time as `index` - the total number of rows that will be loaded into Perspective.
                    If the table is updated and the number of rows is greater than `limit`, updates begin overwriting at row 0.

        Examples:
            >>> from perspective import Table, PerspectiveWidget
            >>> data = {"a": [1, 2, 3]}
            >>> tbl = Table(data)
            >>> widget = PerspectiveWidget()
            >>> widget.load(tbl)
            >>> widget.load(data, index="a") # kwargs are forwarded to the `Table` constructor.
        '''
        name = str(random())
        if isinstance(table_or_data, Table):
            table = table_or_data
        else:
            table = Table(table_or_data, **options)

        self.manager.host_table(name, table)

        # Don't pass the table through to `PerspectiveJupyterClient`, as it needs a different set of operations.
        self.send({
            "type": "table",
            "data": name
        })

        # TODO: move the init to __init__() - right now it only works in load()
        self.post({'id': -1, 'data': None})

    def post(self, msg):
        '''Post a serialized message to the `PerspectiveJupyterClient` in the front end.

        The posted message should conform to the `PerspectiveJupyterMessage` interface as defined in `@finos/perspective-jupyterlab`.

        Params:
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
            self.manager.process(parsed, self.post)
