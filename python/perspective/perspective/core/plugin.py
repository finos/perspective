################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from enum import Enum


class Plugin(Enum):
    """The plugins (grids/charts) available in Perspective.  Pass these into
    the `plugin` arg in `PerspectiveWidget` or `PerspectiveViewer`.

    Examples:
        >>> widget = PerspectiveWidget(data, plugin=Plugin.TREEMAP)
    """

    GRID = "Datagrid"

    YBAR = "Y Bar"
    XBAR = "X Bar"
    YLINE = "Y Line"
    YAREA = "Y Area"
    YSCATTER = "Y Scatter"
    XYLINE = "X/Y Line"
    XYSCATTER = "X/Y Scatter"
    TREEMAP = "Treemap"
    SUNBURST = "Sunburst"
    HEATMAP = "Heatmap"

    YBAR_D3 = "Y Bar"
    XBAR_D3 = "X Bar"
    YLINE_D3 = "Y Line"
    YAREA_D3 = "Y Area"
    YSCATTER_D3 = "Y Scatter"
    XYSCATTER_D3 = "X/Y Scatter"
    TREEMAP_D3 = "Treemap"
    SUNBURST_D3 = "Sunburst"
    HEATMAP_D3 = "Heatmap"

    CANDLESTICK = "Candlestick"
    OHLC = "OHLC"

    @staticmethod
    def options():
        return list(c.value for c in Plugin)
