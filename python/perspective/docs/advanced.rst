===============
Advanced
===============

`psp` function targets
==================
The `data` argument for the `psp` function can accept a variety of types:
    
    - Pandas DataFrame
    - Python Dictionary
    - Python List


`psp` view types
=================
The following view types are supported through psp plugins

    - Grids
        - Hypergrid (`'grid'` or `'hypergrid'`)
    - Charts
        - Vertical Bar (`'y_bar'`)
        - Horizontal Bar (`'x_bar'`)
        - Line (`'y_line'`)
        - Area (`'y_area'`)
        - XY Line (`'xy_line'`)
        - XY Line (`'xy_scatter'`)
        - Treemap (`'treemap'`)
        - Sunburst (`'sunburst'`)
        - Heatmap (`'heatmap'`)

`psp` aggregation types
========================
    - ANY
    - AVG
    - COUNT
    - DISTINCT_COUNT
    - DOMINANT
    - FIRST
    - LAST
    - HIGH
    - LOW
    - MEAN
    - MEAN_BY_COUNT
    - MEDIAN
    - PCT_SUM_PARENT
    - PCT_SUM_GRAND_TOTAL
    - SUM
    - SUM_ABS
    - SUM_NOT_NULL
    - UNIQUE
