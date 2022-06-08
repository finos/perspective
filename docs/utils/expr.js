// Quick one-off utility to convert a Column Expression into a single-line
// string that is compatible with the `expressions` attribute of
// <perspective-viewer>. Compatible with WSL.

function clip(data) {
  var proc = require('child_process').spawn('clip.exe');
  proc.stdin.write(data); proc.stdin.end();
}

const expression =
`
// My Column Name

// REPLACE ME
`

const formatted = expression
  .trim()
  .replace(/\r?\n|\r/g, '\\n')
  .replaceAll("\"", "\\\"");

console.log(formatted);
clip(formatted);
