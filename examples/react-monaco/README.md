
# Perspective + React + Monaco Editor

This example shows how to use Perspective in a project with its own instance
of `monaco-editor`, when compiled with `webpack` and `monaco-webpack-plugin`.
Using `monaco-webpack-plugin` will create a single global worker that
Perspective and your application will share, with support for `ExprTK` as well
as the other languages you configure via the plugins' `languages` property.