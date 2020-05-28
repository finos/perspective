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

.. automodule:: perspective.widget.widget
   :members:
   :show-inheritance:
   :exclude-members: post, send

.. automodule:: perspective.viewer.viewer
   :members:
   :show-inheritance:
   :exclude-members: random

PerspectiveTornadoHandler
=========================

``PerspectiveTornadoHandler`` is a ready-made Perspective server that interfaces seamlessly with
``@finos/perspective-viewer`` in Javascript.

.. automodule:: perspective.tornado_handler.tornado_handler
   :members:
   :show-inheritance:

PerspectiveManager
==================

``PerspectiveManager`` implements a communication protocol between Perspective runtimes in different languages.
Through its ``process()`` method, it allows runtimes to communicate instructions and interoperate.

.. automodule:: perspective.manager.manager
   :members:
   :show-inheritance:
   :exclude-members: DateTimeEncoder

.. automodule:: perspective.manager.session
   :members:
   :show-inheritance:


