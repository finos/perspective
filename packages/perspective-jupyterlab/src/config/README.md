# Webpack config files

- [plugin.config.js](./plugin.config.js) this is the "main" webpack config for building a JupyterLab compatible asset via `jupyter labextension install @finos/perspective-jupyterlab`
- [notebook.config.js](./notebook.config.js) this tweaks `plugin.config.js` to product legacy notebook compatible assets (also useful in other envs like `nteract` and `colab`)
- [prebuilt.config.js](./prebuilt.config.js) this is the JupyterLab [prebuild extension webpack config](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#prebuilt-extensions)
