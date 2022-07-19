## Python

\`perspective-python\`, built on the same C++ data engine used by the
[WebAssembly version](https://perspective.finos.org/docs/md/js.html), implements
the Perspective API directly in Python, either as a virtualized server for
Production, or as an embedded JupyterLab Widget for Research.

For Application Developers, virtualized `<perspective-viewer>` will only
consume the data necessary to render the current screen, enabling _ludicrous size_
datasets with nearly instant load. Or - stream the entire dataset to the
WebAssembly runtime via efficiently via Apache Arrow, and give your server a
break!

For Researchers and Data Scientists, `PerspectiveWidget` is available as a
[Jupyter/JupyterLab](https://jupyterlab.readthedocs.io/en/stable/) widget,
allowing interactive [Pandas](https://pandas.pydata.org/) and
[Apache Arrow](https://arrow.apache.org/) visualization within a notebook.
