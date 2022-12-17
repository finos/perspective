A classic [fractal](https://en.wikipedia.org/wiki/Mandelbrot_set) implemented entirely
in ExprTK/[Perspective](https://github.com/finos/perspective). This example's dataset
is just a single column, `"index"`, with 40,000 integers [0, 39999]. From this column,
the columns `x` and `y` are derived forming a 200x200 grid, and finally the column
`color` is calculated from the standard Mandelbrot formula, using the complex point at
`x + yi`. The controls at the top of the page allow the programmatic redefinition of
this column to e.g. modify the Mandelbrot function's max iterations, window, resolution,
etc.

This examples has no server component and the data is generated in-memory on load. All
calculation is done in the Perspective WebAssembly engine itself.
