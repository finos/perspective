An example of Remote Perspective as a CLI tool.  Reads from STDIN, loads a
Perspective instance via node.js, and opens a web browser to display the data.
Can infer CSV, JSON and Apache Arrow data.  Example:

```bash
cat example.arrow | perspective-cli
```