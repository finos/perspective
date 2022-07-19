import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import {SUPERSTORE_TABLE} from "@site/src/data/superstore.js";

export async function main(colorMode) {
    const viewers = document.querySelectorAll(
        "perspective-viewer:not(.nosuperstore)"
    );

    for (const viewer of viewers) {
        viewer.load(SUPERSTORE_TABLE);
        const token = {
            settings: true,
            theme: colorMode === "dark" ? "Material Dark" : "Material Light",
        };

        for (const attribute of viewer.attributes) {
            if (attribute.name !== "settings" && attribute.name !== "theme") {
                token[attribute.name] = JSON.parse(attribute.nodeValue);
            }
        }

        viewer.restore(token);
    }
}
