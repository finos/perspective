``perspective.core`` contains modules that implements ``perspective-python`` in various environments,
most notably ``PerspectiveWidget`` and the various Perspective web server handlers.

Additionally, ``perspective.core`` defines several enums that provide easy access to aggregate options, different plugins, sort directions etc.

For usage of ``PerspectiveWidget`` and the Perspective web server handlers, see the User Guide in the sidebar.

.. autofunction:: perspective.set_threadpool_size

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

Perspective Webserver Handlers
=================================

Perspective provides several ready-made integrations with webserver libraries that interfaces seamlessly with
``@finos/perspective-viewer`` in Javascript.

.. automodule:: perspective.handlers.tornado
   :members:
   :show-inheritance:

.. automodule:: perspective.handlers.starlette
   :members:
   :show-inheritance:

.. automodule:: perspective.handlers.aiohttp
   :members:
   :show-inheritance:

Perspective Websocket Clients
==============================
Perspective also provides several client interfaces to integrate with the above Perspective webserver handlers.

.. automodule:: perspective.client.tornado
   :members:
   :show-inheritance:

.. automodule:: perspective.client.aiohttp
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


