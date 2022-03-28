////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

static JS: &str = "
import perspective from \"https://cdn.jsdelivr.net/npm/@finos/perspective@vlatest/dist/cdn/perspective.js\";
import \"https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@vlatest/dist/cdn/perspective-viewer.js\";
import \"https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@vlatest/dist/cdn/perspective-viewer-datagrid.js\";
import \"https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@vlatest/dist/cdn/perspective-viewer-d3fc.js\";
const worker = perspective.worker();
const binary_string = window.atob(window.data.textContent);
const len = binary_string.length;
const bytes = new Uint8Array(len);
for (let i = 0; i < len; i++) {{
bytes[i] = binary_string.charCodeAt(i);
}}
window.viewer.load(worker.table(bytes.buffer));
window.viewer.restore(JSON.parse(window.layout.textContent));
";

pub fn render(data: &str, layout: &str) -> String {
    format!("
<!DOCTYPE html lang=\"en\">
<html>
<head>
<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no\"/>
<link rel=\"stylesheet\" crossorigin=\"anonymous\" href=\"https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@vlatest/dist/css/themes.css\"/>
<script type=\"module\">{}</script>
<style>perspective-viewer{{position:absolute;top:0;left:0;right:0;bottom:0}}</style>
</head>
<body>
<script id='data' type=\"application/octet-stream\">{}</script>
<script id='layout' type=\"application/json\">{}</script>
<perspective-viewer id='viewer'></perspective-viewer>
</body>
</html>
", JS.trim(), data, layout)
}
