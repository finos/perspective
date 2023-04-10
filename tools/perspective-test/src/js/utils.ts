// NOTE: This file contains many Typescript semantic errors due to the use of 
// page.evaluate() with global vars. There is also logic 
// @ts-nocheck

import { expect, Page } from "@playwright/test";
import crypto from "crypto";

export const SUPERSTORE_CSV_PATH =
    "/tools/perspective-test/assets/superstore.csv";

export const SUPERSTORE_ARROW_PATH =
    "/node_modules/superstore-arrow/superstore.arrow";

type SetupPageOptions = {
    htmlPage: string;
    selector: string;
};

export async function setupPage(page: Page, options: SetupPageOptions) {
    await page.goto(options.htmlPage);
    await page.waitForSelector(options.selector);
}

export type TableConfig = {
    plugin: string;
    columns?: (string | null)[];
    group_by?: string[];
    order_by?: string[];
    split_by?: string[];
    aggregates?: Record<string, string>;
};

export async function addPerspectiveToWindow(page: Page) {
    // NOTE: There is a compile issure, where `await import()` get transformed by
    // babel into something that is usable. Using this as text is a workaround.
    // QUESTION: is this neeeded?? Would it be better to just include it in the html?
    await page.evaluate(`(async () => {
        window.perspective = await import("/perspective.js");
    })()`);
}

export async function loadTableAsset(
    page: Page,
    assetPath: string,
    tableConfig: TableConfig
) {
    await addPerspectiveToWindow(page);

    await page.evaluate(
        async ({ assetPath, tableConfig }) => {
            async function loadTableAsset(tableConf) {
                let resp = await fetch(assetPath);
                let csv = await resp.text();

                const viewer =
                    document.getElementsByTagName("perspective-viewer")[0];

                await viewer.load(window.perspective.worker().table(csv));

                await viewer.restore(tableConf);
            }

            await loadTableAsset(tableConfig);
        },
        { assetPath, tableConfig }
    );
}

export async function loadWorkspace(
    page: Page,
    assetPath = SUPERSTORE_ARROW_PATH
) {
    await addPerspectiveToWindow(page);

    await page.evaluate(async (ap) => {
        window.__WORKER__ = window.perspective.worker();
        const resp = await fetch(ap);

        let arrBuffer = await resp.arrayBuffer();

        window.__TABLE__ = window.__WORKER__.table(arrBuffer);

        document
            .getElementById("workspace")
            .tables.set("superstore", window.__TABLE__);
    }, assetPath);
}

export async function getViewerConfig(page: Page) {
    const config = await page.evaluate(async () => {
        const viewer = document.querySelector("perspective-viewer");
        const config = await viewer.save();

        return config;
    });

    return config;
}

export const getSvgContentString = (selector: string) => async (page: Page) => {
    const content = await page.evaluate(async (s) => {
        let el = document.querySelector(s);

        function removeAttrs(node) {
            const svgAttrsToRemove = [
                "r",
                "d",
                "dx",
                "dy",
                "x",
                "y",
                "x1",
                "x2",
                "y1",
                "y2",
                "style",
                "d",
                "transform",
            ];

            if (node.nodeType === Node.ELEMENT_NODE) {
                for (const attr of svgAttrsToRemove) {
                    node.removeAttribute(attr);
                }
            }
        }

        function walkNode(node) {
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_ALL);

            walk(walker, walker.currentNode);
        }

        function walk(walker, node) {
            if (!node) return;

            if (node.shadowRoot) {
                walkNode(node.shadowRoot);
            }

            switch (node.nodeName) {
                case "style":
                    node.textContent = "";
                    break;
                case "svg":
                    removeAttrs(node);

                    node.remove("viewBox");
                    node.remove("height");
                    break;
                case "g":
                case "path":
                case "line":
                case "text":
                    removeAttrs(node);
                    break;
                default:
                    break;
            }
            walk(walker, walker.nextNode());
        }

        if (el?.shadowRoot) {
            el = el.shadowRoot as unknown as Element;
        }

        const svgs = el?.querySelectorAll("svg") || [];
        let htmlString = "";
        for (const svg of svgs) {
            const clonedSVG = svg.cloneNode(true) as SVGElement;

            walkNode(clonedSVG);

            htmlString += clonedSVG.outerHTML;
        }

        return htmlString;
    }, selector);

    return content;
};

export async function compareContentsToSnapshot(
    contents: string,
    snapshotPath: string[]
) {
    // Right now this creates a lot of individual files. Its a tradeoff between
    // having a lot of files, or reimplementing the snapshot testing logic.
    // const hash = crypto.createHash("md5").update(contents).digest("hex");

    // await expect(hash).toMatchSnapshot(snapshotPath);
    // const hash = crypto.createHash("md5").update(contents).digest("hex");

    await expect(contents).toMatchSnapshot(snapshotPath);
}

export async function compareSVGContentsToSnapshot(
    page: Page,
    selector: string,
    snapshotPath: string[]
) {
    const svgContent = await getSvgContentString(selector)(page);
    await compareContentsToSnapshot(svgContent, snapshotPath);
}

export function getWorkspaceLightDOMContents(page: Page): Promise<string> {
    return page.evaluate(async () => {
        return document.querySelector("perspective-workspace").outerHTML;
    });
}

export function getWorkspaceShadowDOMContents(page: Page): Promise<string> {
    return page.evaluate(async () => {
        return document
            .querySelector("perspective-workspace")
            .shadowRoot.querySelector("#container").innerHTML;
    });
}

export async function compareLightDOMContents(page, snapshotFileName) {
    const contents = await getWorkspaceLightDOMContents(page);

    await compareContentsToSnapshot(contents, [snapshotFileName]);
}

export async function compareShadowDOMContents(page, snapshotFileName) {
    const contents = await getWorkspaceShadowDOMContents(page);

    await compareContentsToSnapshot(contents, [snapshotFileName]);
}

export async function shadow_click(page, ...path) {
    await page.evaluate(({ path }) => {
        let elem = document;
        while (path.length > 0) {
            if (elem.shadowRoot) {
                elem = elem.shadowRoot;
            }
            elem = elem.querySelector(path.shift());
        }

        function triggerMouseEvent(node, eventType) {
            var clickEvent = document.createEvent("MouseEvent");
            clickEvent.initEvent(eventType, true, true);
            node.dispatchEvent(clickEvent);
        }

        triggerMouseEvent(elem, "mouseover");
        triggerMouseEvent(elem, "mousedown");
        triggerMouseEvent(elem, "mouseup");
        triggerMouseEvent(elem, "click");
    }, { path });
}

export async function shadow_type(page, content, is_incremental, ...path) {
    if (typeof is_incremental !== "boolean") {
        path.unshift(is_incremental);
        is_incremental = false;
    }

    await page.evaluate(
        async ({ content, path, is_incremental }) => {
            let elem = document;
            while (path.length > 0) {
                if (elem.shadowRoot) {
                    elem = elem.shadowRoot;
                }
                elem = elem.querySelector(path.shift());
            }

            elem.focus();

            function triggerInputEvent(element) {
                const event = new Event("input", {
                    bubbles: true,
                    cancelable: true,
                });

                element.dispatchEvent(event);
            }

            if (is_incremental) {
                while (content.length > 0) {
                    elem.value += content[0];
                    triggerInputEvent(elem);
                    await new Promise(requestAnimationFrame);
                    content = content.slice(1);
                }
            } else {
                elem.value = content;
                triggerInputEvent(elem);
            }
        },
        { content, path, is_incremental }
    );
}

export async function shadow_blur(page) {
    await page.evaluate(() => {
        let elem = document.activeElement;
        while (elem) {
            (elem as HTMLElement).blur();
            let shadowRoot = elem.shadowRoot;
            elem = shadowRoot ? shadowRoot.activeElement : null;
        }
    });
}
