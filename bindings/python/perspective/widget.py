import ujson

from ipywidgets import Widget
from traitlets import Unicode, List, Bool, Dict, Any, validate

from ._type import type_detect
from ._layout import validate_view, validate_columns, validate_rowpivots, validate_columnpivots, validate_aggregates, validate_sort
from ._schema import validate_schema
from ._config import config


class PerspectiveWidget(Widget):
    _model_name = Unicode('PerspectiveModel').tag(sync=True)
    _model_module = Unicode('@jpmorganchase/perspective-jupyterlab').tag(sync=True)
    _model_module_version = Unicode('0.1.18').tag(sync=True)
    _view_name = Unicode('PerspectiveView').tag(sync=True)
    _view_module = Unicode('@jpmorganchase/perspective-jupyterlab').tag(sync=True)
    _view_module_version = Unicode('0.1.18').tag(sync=True)

    _data = List(default_value=[]).tag(sync=True)
    # _data_tick = List(default_value=[]).tag(sync=True)

    _dat_orig = Any()

    datasrc = Unicode(default_value='').tag(sync=True)
    schema = Dict(default_value={}).tag(sync=True)
    view = Unicode('hypergrid').tag(sync=True)
    columns = List(default_value=[]).tag(sync=True)
    rowpivots = List(trait=Unicode(), default_value=[]).tag(sync=True)
    columnpivots = List(trait=Unicode(), default_value=[]).tag(sync=True)
    aggregates = Dict(trait=Dict(trait=Unicode()), default_value={}).tag(sync=True)
    sort = List(default_value=[]).tag(sync=True)

    settings = Bool(True).tag(sync=True)
    dark = Bool(False).tag(sync=True)

    # FIXME
    helper_config = Unicode('{}').tag(sync=True)

    def _get_data(self):
        return self._dat_orig

    def _set_data(self, value):
        typ, dat_orig, dat = type_detect(value)

        if isinstance(dat, str):
            # unconvertable, must be http/ws/sio/comm
            dat = {}
            self.set_trait('datasrc', dat)
            self._dat_orig = dat_orig
        else:
            self._dat_orig = dat_orig
            self.set_trait('datasrc', 'static')

        if len(dat_orig) and typ:
            s = validate_schema(dat_orig, typ)
            self.set_trait('schema', s)
            self.set_trait('columns', list(map(lambda x: str(x), s.keys())))
        else:
            self.set_trait('schema', {})

        self.set_trait('_data', dat)

    # FIXME
    data = property(_get_data, _set_data)
    # @validate('_data')
    # def _validate_data(self, proposal):
    #     return proposal.value

    @validate('datasrc')
    def _validate_datasrc(self, proposal):
        datasrc = proposal.value
        return datasrc

    @validate('schema')
    def _validate_schema(self, proposal):
        schema = proposal.value
        return schema

    @validate('view')
    def _validate_view(self, proposal):
        view = validate_view(proposal.value)
        return view

    @validate('columns')
    def _validate_columns(self, proposal):
        columns = validate_columns(proposal.value)
        return columns

    @validate('rowpivots')
    def _validate_rowpivots(self, proposal):
        rowpivots = validate_rowpivots(proposal.value)
        return rowpivots

    @validate('columnpivots')
    def _validate_columnpivots(self, proposal):
        columnpivots = validate_columnpivots(proposal.value)
        return columnpivots

    @validate('aggregates')
    def _validate_aggregates(self, proposal):
        aggregates = validate_aggregates(proposal.value)
        return aggregates

    @validate('sort')
    def _validate_sort(self, proposal):
        sort = validate_sort(proposal.value)
        return sort

    @validate('helper_config')
    def _validate_helper_config(self, proposal):
        conf = config(proposal.value, self._dat_orig)
        return conf

    @staticmethod
    def new(data, view='hypergrid', schema=None, columns=None, rowpivots=None, columnpivots=None, aggregates=None, sort=None, settings=False, dark=False, helper_config=None, **kwargs):
        return PerspectiveWidget(
            data=data,
            schema=schema,
            view=view,
            columns=columns,
            rowpivots=rowpivots,
            columnpivots=columnpivots,
            aggregates=aggregates,
            sort=sort,
            settings=settings,
            dark=dark,
            helper_config=helper_config)
