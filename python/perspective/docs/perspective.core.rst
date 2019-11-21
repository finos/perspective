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
   :show-inheritance:
   :exclude-members: post, send

.. automodule:: perspective.core.viewer
   :members:
   :show-inheritance:
   :exclude-members: random

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


