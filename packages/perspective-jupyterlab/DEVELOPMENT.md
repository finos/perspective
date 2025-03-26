## Build

As of March 2025, the build process is a little different from the jupyterlab
extension cookiecutter template. The build works as follows:

### labextension

1. esbuild produces a bundle in `dist/esm` with `src/index.js` as its entrypoint
2. `jupyter labextension build` packages that bundle, which is read from the
   `main` field in `package.json`, into `dist/cjs`
3. the `dist/cjs` output is copied to the perspective-python package's `.data`
   directory.

This means running `jupyter labextension build` or `watch` out-of-band from the
build script won't rebuild the labextension on its own; the `labextension` step
runs on the output of the esbuild step.
