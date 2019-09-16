.. perspective-python documentation master file, created by
   sphinx-quickstart on Fri Jan 12 22:07:11 2018.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

perspective-python
===================================

|build-status| |issues| |codecov| |bch| |pypiv| |pypil| |docs|


.. toctree::
   :maxdepth: 2
   :caption: Contents:

   installation
   quickstart
   advanced
   api


.. |build-status| image:: https://travis-ci.org/timkpaine/perspective-python.svg?branch=master
    :alt: Build Status
    :scale: 100%
    :target: https://travis-ci.org/timkpaine/perspective-python

.. |issues| image:: https://img.shields.io/github/issues/timkpaine/perspective-python.svg
    :alt: Issues
    :scale: 100%
    :target: https://img.shields.io/github/issues/timkpaine/perspective-python.svg

.. |codecov| image:: https://codecov.io/gh/timkpaine/perspective-python/branch/master/graph/badge.svg
    :alt: Codecov
    :scale: 100%
    :target: https://codecov.io/gh/timkpaine/perspective-python

.. |bch| image:: https://bettercodehub.com/edge/badge/timkpaine/perspective-python?branch=master
    :alt: BCH
    :scale: 100%
    :target: https://bettercodehub.com/

.. |pypiv| image:: https://img.shields.io/pypi/v/perspective-python.svg
    :alt: Version
    :scale: 100%
    :target: https://pypi.python.org/pypi/perspective-python

.. |pypil| image:: https://img.shields.io/pypi/l/perspective-python.svg
    :alt: License
    :scale: 100%
    :target: https://pypi.python.org/pypi/perspective-python

.. |docs| image:: https://img.shields.io/readthedocs/perspective-python.svg
    :alt: Docs
    :scale: 100%
    :target: https://perspective-python.readthedocs.io

============
Installation
============

From Pip
============

.. code:: bash

    pip install perspective-python

From Source
============

.. code:: bash

    python setup.py install

or 

.. code:: bash

    make install


Jupyter Extensions
==================
To install the JupyterLab extensions:

.. code:: bash

    jupyter labextension install @finos/perspective-jupyterlab


===============
Getting started
===============

Overview
===============
If you've successfully installed both perspective-python, and the perspective JupyterLab extension, its time to get plotting.

.. code:: python3

    import pandas as pd
    from perspective import psp
    df = pd.DataFrame([{'A':1, 'B':2}, {'A':3, 'B':4}])
    psp(df)

.. image:: ./img/grid1.png
    :scale: 100%
    :alt: grid1.png

The `psp` function
==================
.. function:: def psp(data, view='hypergrid', columns=None, rowpivots=None, columnpivots=None, aggregates=None, settings=False):

    '''Render a perspective javascript widget in jupyter

    :param data: data {dataframe or live source} -- The static or live datasource
    :type data: dataframe

    :param view: what view to use. available in the enum View. default: hypergrid
    :type view: str/View
     
    :param columns: what columns to display
    :type columns: list of strings
    :param rowpivots: what names to use as rowpivots
    :type rowpivots: list of strings
    :param columnpivots: what names to use as columnpivots
    :type columnpivots: list of strings
    :param aggregates: dictionary of name to aggregate type (either string or enum Aggregate)
    :type aggregates: dict(str, str or Aggregate)
    :param settings: display settings
    :type settings: boolean
    :rtype: IPython.display object

Example:

.. image:: ./img/scatter1.png
    :scale: 100%
    :alt: scatter1.png

===============
Advanced
===============

.. WARNING:: For API documentation, see the API section on the left


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

API
====

.. automodule:: perspective.core
    :members:
    :undoc-members:
    :show-inheritance:


.. automodule:: perspective.core.base
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.aggregate
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.computed
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.examples
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.exception
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.psp
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.schema
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.sort
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.validate
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.view
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.web
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.widget
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.data.base
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.data.pa
    :members:
    :undoc-members:
    :show-inheritance:

.. automodule:: perspective.core.data.pd
    :members:
    :undoc-members:
    :show-inheritance:


