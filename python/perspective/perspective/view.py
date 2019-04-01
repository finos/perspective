from enum import Enum


class View(Enum):
    HYPERGRID = 'hypergrid'
    GRID = 'hypergrid'
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

    @staticmethod
    def options():
        return list(map(lambda c: c.value, View))
