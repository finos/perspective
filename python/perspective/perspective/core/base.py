# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import json
from six import iteritems
from traitlets import HasTraits, Unicode, List, Bool, Int, Dict, Any, Bytes, Union, validate
from .data import type_detect
from .validate import validate_view, validate_columns, validate_rowpivots, validate_columnpivots, validate_aggregates, validate_sort, validate_computedcolumns, validate_filters, validate_plugin_config
from .schema import validate_schema


class PerspectiveBaseMixin(HasTraits):
    '''Perspective Base Mixin'''
    # Data (private)
    _data = Union((List(default_value=[]), Dict(default_value={}))).tag(sync=True)
    _bin_data = Bytes().tag(sync=True)  # binary data
    _dat_orig = Any()

    # Data source
    datasrc = Unicode(default_value='').tag(sync=True)
    schema = Dict(default_value={}).tag(sync=True)

    # layout
    view = Unicode('hypergrid').tag(sync=True)
    columns = List(default_value=[]).tag(sync=True)
    rowpivots = List(trait=Unicode(), default_value=[]).tag(sync=True, o=True)
    columnpivots = List(trait=Unicode(), default_value=[]).tag(sync=True)
    aggregates = Dict(trait=Unicode(), default_value={}).tag(sync=True)
    sort = List(default_value=[]).tag(sync=True)
    index = Unicode(default_value='').tag(sync=True)
    limit = Int(default_value=-1).tag(sync=True)
    computedcolumns = List(trait=Dict, default_value=[]).tag(sync=True)
    filters = List(trait=List, default_value=[]).tag(sync=True)
    plugin_config = Dict(default_value={}).tag(sync=True)

    # show settings (currently broken)
    settings = Bool(True).tag(sync=True)

    # set perspective in embedded mode (work outside jlab)
    embed = Bool(False).tag(sync=True)

    # dark mode
    dark = Bool(False).tag(sync=True)

    # try to use apache arrow to transfer data
    transfer_as_arrow = Bool(True).tag(sync=True)

    def load(self, value):
        data_object = type_detect(value, schema=self.schema, columns=self.columns, transfer_as_arrow=self.transfer_as_arrow)
        self.datasrc = data_object.type
        if data_object.type in ('arrow'):
            self.schema = validate_schema(data_object.schema)
            self.columns = data_object.columns
            self._bin_data = data_object.data
            self._data = []
            return

        # len in case dataframe
        if len(data_object.data) and data_object.type:
            s = validate_schema(data_object.schema)
            self.schema = s

            computedcolumns = []
            if self.computedcolumns:
                for c in self.computedcolumns:
                    if c['name'] not in computedcolumns:
                        computedcolumns.append(c['name'])

            if not self.columns and 'columns' not in data_object.kwargs:
                columns = list(map(lambda x: str(x), data_object.columns))

                # reasonable default, pivot by default in non-grid view
                if not self.rowpivots and self.view != 'hypergrid':
                    if 'index' in columns:
                        self.rowpivots = ['index']
                        if 'index' in columns:
                            columns.remove('index')

                if self.computedcolumns:
                    for c in self.computedcolumns:
                        if c['name'] not in columns:
                            columns.append(c['name'])

                self.columns = columns + computedcolumns

            elif not self.columns and 'columns' in data_object.kwargs:
                columns = list(map(lambda x: str(x), data_object.kwargs.pop('columns')))
                self.columns = columns + computedcolumns

        else:
            self.schema = {}

        for k, v in iteritems(data_object.kwargs):
            if not getattr(self, k):
                setattr(self, k, v)

        # set data last
        self._data = data_object.data

    @validate('datasrc')
    def _validate_datasrc(self, proposal): return proposal.value  # validated elsewhere

    @validate('schema')
    def _validate_schema(self, proposal): return proposal.value  # validated elsewhere

    @validate('view')
    def _validate_view(self, proposal): return validate_view(proposal.value)

    @validate('columns')
    def _validate_columns(self, proposal): return validate_columns(proposal.value)

    @validate('rowpivots')
    def _validate_rowpivots(self, proposal): return validate_rowpivots(proposal.value)

    @validate('columnpivots')
    def _validate_columnpivots(self, proposal): return validate_columnpivots(proposal.value)

    @validate('aggregates')
    def _validate_aggregates(self, proposal): return validate_aggregates(proposal.value)

    @validate('sort')
    def _validate_sort(self, proposal): return validate_sort(proposal.value)

    @validate('computedcolumns')
    def _validate_computedcolumns(self, proposal): return validate_computedcolumns(proposal.value, self.columns)

    @validate('filters')
    def _validate_filters(self, proposal): return validate_filters(proposal.value, self.columns)

    @validate('plugin_config')
    def _validate_plugin_config(self, proposal): return validate_plugin_config(proposal.value)

    def _as_json(self, data_only=False, allow_nan=False):
        if data_only:
            if self.datasrc in ('arrow',):
                return getattr(self, '_bin_data')
            else:
                return json.dumps(getattr(self, '_data'), allow_nan=allow_nan)

        ret = {}
        if self.datasrc in ('arrow'):
            ret['data'] = 'ARROW'
        else:
            ret['data'] = getattr(self, '_data')
        ret['datasrc'] = getattr(self, 'datasrc')
        ret['schema'] = getattr(self, 'schema')
        ret['view'] = getattr(self, 'view')
        ret['columns'] = getattr(self, 'columns')
        ret['rowpivots'] = getattr(self, 'rowpivots')
        ret['columnpivots'] = getattr(self, 'columnpivots')
        ret['aggregates'] = getattr(self, 'aggregates')
        ret['sort'] = getattr(self, 'sort')
        ret['index'] = getattr(self, 'index')
        ret['limit'] = getattr(self, 'limit')
        ret['computedcolumns'] = getattr(self, 'computedcolumns')
        ret['filters'] = getattr(self, 'filters')
        ret['plugin_config'] = getattr(self, 'plugin_config')
        ret['settings'] = getattr(self, 'settings')
        ret['embed'] = getattr(self, 'embed')
        ret['dark'] = getattr(self, 'dark')
        return json.dumps(ret, allow_nan=allow_nan)

    def setup(self,
              data,
              view='hypergrid',
              schema=None,
              columns=None,
              rowpivots=None,
              columnpivots=None,
              aggregates=None,
              sort=None,
              index='',
              limit=-1,
              computedcolumns=None,
              filters=None,
              plugin_config=None,
              settings=True,
              embed=False,
              dark=False,
              transfer_as_arrow=False,
              *args,
              **kwargs):
        '''Setup perspective base class

        Arguments:
            data : dataframe/list/dict
                The static or live datasource

        Keyword Arguments:
            view : str or View
                what view to use. available in the enum View (default: {'hypergrid'})
            columns : list of str
                what columns to display
            rowpivots : list of str
                what names to use as rowpivots
            columnpivots : list of str
                what names to use as columnpivots
            aggregates:  dict(str: str or Aggregate)
                dictionary of name to aggregate type (either string or enum Aggregate)
            index : str
                columns to use as index
            limit : int
                row limit
            computedcolumns : list of dict
                computed columns to set on the perspective viewer
            filters: list of list
                list of filters to apply to columns
            plugin_config: dict
                configuration dictionary to pass to perspective plugin
            settings : bool
                display settings
            embed : bool
                embedded mode
            dark : bool
                use dark theme

        '''
        self.transfer_as_arrow = transfer_as_arrow
        self.view = validate_view(view)
        self.schema = schema or {}
        self.sort = validate_sort(sort) or []
        self.index = index
        self.limit = limit
        self.settings = settings
        self.embed = embed
        self.dark = dark

        self.rowpivots = validate_rowpivots(rowpivots) or []
        self.columnpivots = validate_columnpivots(columnpivots) or []
        self.aggregates = validate_aggregates(aggregates) or {}

        self.columns = validate_columns(columns) or []
        self.computedcolumns = validate_computedcolumns(computedcolumns) or []

        self.filters = validate_filters(filters) or []
        self.plugin_config = validate_plugin_config(plugin_config) or {}

        self.load(data)
