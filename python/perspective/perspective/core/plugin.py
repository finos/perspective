################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from enum import Enum


class Plugin(Enum):
    '''The plugins (grids/charts) available in Perspective.  Pass these into
    the `plugin` arg in `PerspectiveWidget` or `PerspectiveViewer`.

    Examples:
        >>> widget = PerspectiveWidget(data, plugin=Plugin.TREEMAP)
    '''

    GRID = 'datagrid'

    YBAR = 'y_bar'
    XBAR = 'x_bar'
    YLINE = 'y_line'
    YAREA = 'y_area'
    YSCATTER = 'y_scatter'
    XYLINE = 'xy_line'
    XYSCATTER = 'xy_scatter'
    TREEMAP = 'treemap'
    SUNBURST = 'sunburst'
    HEATMAP = 'heatmap'

    CANDLESTICK = 'd3_candlestick'
    OHLC = 'd3_ohlc'

    @staticmethod
    def options():
        return list(c.value for c in Plugin)
