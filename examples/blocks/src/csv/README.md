A simple CSV loader demo of [Perspective](https://github.com/finos/perspective). The
given CSV must be in a form Perspective's `Table()` constructor supports:

-   First row must be column names.
-   Subsequent rows should be mono-typed (but if not you will just get `string` columns
    and you'll need to use ExprTK expressions to cast).
-   Well-formed (Consistent # of `,` per line, strings should be quoted, especially if
    they contain `,` themselves).

This example does not have a server component, all calculation/loading/manipulation of
the data is done in the browser, and the data "uploaded" never leaves your
browser/computer.
