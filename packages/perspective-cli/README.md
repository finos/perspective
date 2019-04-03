# Perspective CLI

```bash
Usage: perspective [options] [command]

A convenient command-line client for Perspective.js.  Can convert between Perspective supported format, or host a local web server.

Options:
  -V, --version                 output the version number
  -h, --help                    output usage information

Commands:
  convert [options] [filename]  Convert a file into a new format.  Reads from STDIN if no filename is provided
    Options:
    -f, --format <format>    Which output format to use:  arrow, csv, columns, json.
    -o, --output <filename>  Filename to write to.  If not supplied, writes to STDOUT
    -h, --help               output usage information

  host [options] [filename]     Host a file on a local Websocket/HTTP server using a server-side Perspective.  Reads from STDIN if no filename is provided
    Options:
      -p, --port <port>  Which port to bind to (default: 8080)
      -o, --open         Open a browser automagically
      -h, --help         output usage information
```