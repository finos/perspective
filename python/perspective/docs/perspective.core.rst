``perspective.core`` contains modules that implements ``perspective-python`` in various environments,
most notably ``PerspectiveWidget`` and ``PerspectiveTornadoHandler``.

Additionally, ``perspective.core`` defines several enums that provide easy access to aggregate options, different plugins, sort directions etc.

For usage of ``PerspectiveWidget`` and ``PerspectiveTornadoHandler``, see the User Guide in the sidebar.

.. automodule:: perspective.core
   :members:
   :show-inheritance:

PerspectiveWidget
=================

``PerspectiveWidget`` is a Perspective integration into [JupyterLab](https://jupyterlab.readthedocs.io/en/stable).

.. automodule:: perspective.core.widget
   :members:
   :undoc-members:
   :show-inheritance:


PerspectiveTornadoHandler
=========================
.. automodule:: perspective.core.tornado_handler
   :members:
   :undoc-members:
   :show-inheritance:
   :exclude-members: DateTimeEncoder


PerspectiveManager
==================

``PerspectiveManager`` implements a communication protocol between Perspective runtimes in different languages.
Through its ``process()`` method, it allows runtimes to communicate instructions and interoperate.

.. automodule:: perspective.core.manager
   :members:
   :show-inheritance:
   :exclude-members: DateTimeEncoder

.. automodule:: perspective.core.session
   :members:
   :show-inheritance:


Exceptions
==========

``PerspectiveError`` will be raised by the runtime—to catch all errors raised by Perspective, catch ``PerspectiveError`` and ``PerspectiveCppError``.

.. automodule:: perspective.core.exception
   :members:
   :undoc-members:
   :show-inheritance:


Perspective Enums
=================

These enums provide a listing of the available aggregate operators, plugins, and sort directions for Perspective.

Pass these into a ``PerspectiveWidget`` or ``PerspectiveViewer`` instead of strings:

.. code-block:: python
    from perspective import PerspectiveWidget, Aggregate, Plugin, Sort
    widget = PerspectiveWidget(data, plugin=Plugin.YLINE, aggregates={"a": Aggregate.AVG}, sort=[["a", Sort.DESC]])
    # the above is equivalent to:
    widget = PerspectiveWidget(data, plugin="y_line, aggregates={"a": "avg}, sort=[["a", "desc"]])

.. automodule:: perspective.core.aggregate
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: perspective.core.plugin
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: perspective.core.sort
   :members:
   :undoc-members:
   :show-inheritance:


PerspectiveViewer
=================

PerspectiveViewer is the base class for ``PerspectiveWidget``. It implements a symmetrical API to ``<perspective-viewer>`` in Javascript.

.. automodule:: perspective.core.viewer
   :members:
   :show-inheritance:


PerspectiveViewer Traitlets
===========================

The following API documents the [Traitlets](https://traitlets.readthedocs.io/en/stable/index.html) that are assigned to ``PerspectiveViewer``,
providing the full list of parameters that can be passed into `PerspectiveWidget` or `PerspectiveViewer` on 

.. automodule:: perspective.core.viewer_traitlets
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: perspective.core.validate
   :members:
   :undoc-members:
   :show-inheritance:


