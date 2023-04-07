const { execute, execute_throw } = require("../../scripts/script_utils.js");
const fs = require("fs");
const { get_examples, LOCAL_EXAMPLES } = require("./examples.js");

const version = JSON.parse(fs.readFileSync("./package.json")).version;

// TODO jsdelivr has slightly different logic for trailing '/' that causes
// the wasm assets to not load correctly when using aliases, hence we must link
// directly to the assets.
const replacements = {
    "/node_modules/": `https://cdn.jsdelivr.net/npm/`,
    "perspective/dist/umd/perspective.js": `perspective@${version}`,
    "perspective-viewer/dist/umd/perspective-viewer.js": `perspective-viewer@${version}`,
    "perspective-viewer-datagrid/dist/umd/perspective-viewer-datagrid.js": `perspective-viewer-datagrid@${version}`,
    "perspective-viewer-d3fc/dist/umd/perspective-viewer-d3fc.js": `perspective-viewer-d3fc@${version}`,
    "perspective-workspace/dist/umd/perspective-workspace.js": `perspective-workspace@${version}`,
    "perspective/dist/cdn/perspective.js": `perspective@${version}/dist/cdn/perspective.js`,
    "perspective-viewer/dist/cdn/perspective-viewer.js": `perspective-viewer@${version}/dist/cdn/perspective-viewer.js`,
    "perspective-viewer-datagrid/dist/cdn/perspective-viewer-datagrid.js": `perspective-viewer-datagrid@${version}/dist/cdn/perspective-viewer-datagrid.js`,
    "perspective-viewer-d3fc/dist/cdn/perspective-viewer-d3fc.js": `perspective-viewer-d3fc@${version}/dist/cdn/perspective-viewer-d3fc.js`,
    "perspective-workspace/dist/cdn/perspective-workspace.js": `perspective-workspace@${version}/dist/cdn/perspective-workspace.js`,
};

exports.dist_examples = function init(
    outpath = `${__dirname}/../../docs/static/blocks`
) {
    execute`mkdir -p ${outpath}`;
    const readme = generate_readme();
    let existing = fs.readFileSync(`${__dirname}/../../README.md`).toString();
    existing = existing.replace(
        /<\!\-\- Examples \-\->([\s\S]+?)<\!\-\- Examples \-\->/gm,
        `<!-- Examples -->\n${readme}\n<!-- Examples -->`
    );

    fs.writeFileSync(`${__dirname}/../../README.md`, existing);
    for (const name of LOCAL_EXAMPLES) {
        // Copy
        if (fs.existsSync(`${__dirname}/src/${name}`)) {
            for (const filename of fs.readdirSync(`${__dirname}/src/${name}`)) {
                execute`mkdir -p ${outpath}/${name}`;
                if (filename.endsWith(".js") || filename.endsWith(".html")) {
                    let filecontents = fs
                        .readFileSync(`${__dirname}/src/${name}/${filename}`)
                        .toString();
                    for (const pattern of Object.keys(replacements)) {
                        filecontents = filecontents.replace(
                            new RegExp(pattern, "g"),
                            replacements[pattern]
                        );
                    }
                    fs.writeFileSync(
                        `${outpath}/${name}/${filename}`,
                        filecontents
                    );
                } else if (filename !== ".git") {
                    execute`cp ${__dirname}/src/${name}/${filename} ${outpath}/${name}/${filename}`;
                }
            }
        }
    }
};

function partition(input, spacing) {
    let output = [];
    for (let i = 0; i < input.length; i += spacing) {
        output[output.length] = input.slice(i, i + spacing);
    }

    return output;
}

function generate_readme() {
    const all = get_examples();
    return `<table><tbody>${partition(all, 3)
        .map(
            (row) =>
                `<tr>${row
                    .map((y) => `<td>${y.name}</td>`)
                    .join("")}</tr><tr>${row
                    .map(
                        (y) =>
                            `<td><a href="${y.url}"><img height="125" src="${y.img}"></img></a></td>`
                    )
                    .join("")}</tr>`
        )
        .join("")}</tbody></table>`;
}
