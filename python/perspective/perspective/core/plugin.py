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
    HYPERGRID = 'hypergrid'  # hypergrid
    GRID = 'hypergrid'  # hypergrid

    YBAR = 'y_bar'  # highcharts
    XBAR = 'x_bar'  # highcharts
    YLINE = 'y_line'  # highcharts
    YAREA = 'y_area'  # highcharts
    YSCATTER = 'y_scatter'  # highcharts
    XYLINE = 'xy_line'  # highcharts
    XYSCATTER = 'xy_scatter'  # highcharts
    TREEMAP = 'treemap'  # highcharts
    SUNBURST = 'sunburst'  # highcharts
    HEATMAP = 'heatmap'  # highcharts

    YBAR_D3 = 'd3_y_bar'  # d3fc
    XBAR_D3 = 'd3_x_bar'  # d3fc
    YLINE_D3 = 'd3_y_line'  # d3fc
    YAREA_D3 = 'd3_y_area'  # d3fc
    YSCATTER_D3 = 'd3_y_scatter'  # d3fc
    XYSCATTER_D3 = 'd3_xy_scatter'  # d3fc
    TREEMAP_D3 = 'd3_treemap'  # d3fc
    SUNBURST_D3 = 'd3_sunburst'  # d3fc
    HEATMAP_D3 = 'd3_heatmap'  # d3fc

    CANDLESTICK = 'd3_candlestick'  # d3fc
    CANDLESTICK_D3 = 'd3_candlestick'  # d3fc
    OHLC = 'd3_ohlc'  # d3fc
    OHLC_D3 = 'd3_ohlc'  # d3fc

    @staticmethod
    def options():
        return list(c.value for c in Plugin)
