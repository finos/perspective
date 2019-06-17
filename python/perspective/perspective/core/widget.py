# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from ipywidgets import Widget
from traitlets import Unicode
from .base import PerspectiveBaseMixin
from .data import type_detect


class PerspectiveWidget(PerspectiveBaseMixin, Widget):
    '''Perspective IPython Widget'''
    ############
    # Required #
    ############
    _model_name = Unicode('PerspectiveModel').tag(sync=True)
    _model_module = Unicode('@finos/perspective-jupyterlab').tag(sync=True)
    _model_module_version = Unicode('^0.3.0').tag(sync=True)
    _view_name = Unicode('PerspectiveView').tag(sync=True)
    _view_module = Unicode('@finos/perspective-jupyterlab').tag(sync=True)
    _view_module_version = Unicode('^0.3.0').tag(sync=True)
    ############

    def delete(self): self.send({'type': 'delete'})

    def update(self, data): self.send({'type': 'update', 'data': type_detect(data).data})

    def __del__(self): self.send({'type': 'delete'})

    def __init__(self,
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
        '''Render a perspective javascript widget in jupyter

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
        self.setup(data=data,
                   view=view,
                   schema=schema,
                   columns=columns,
                   rowpivots=rowpivots,
                   columnpivots=columnpivots,
                   aggregates=aggregates,
                   sort=sort,
                   index=index,
                   limit=limit,
                   computedcolumns=computedcolumns,
                   filters=filters,
                   plugin_config=plugin_config,
                   settings=settings,
                   embed=embed,
                   dark=dark,
                   transfer_as_arrow=transfer_as_arrow,
                   *args,
                   **kwargs)
        super(PerspectiveWidget, self).__init__(*args, **kwargs)
