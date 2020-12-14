const puppeteer = require("puppeteer");

async function script(page) {
    await page.goto("http://localhost:8080/");
    await page.waitForSelector("perspective-viewer:not([updating])");
    const viewer = await page.$("perspective-viewer");

    const make_poke = viewer => async (...args) => {
        await page.evaluate(
            async (viewer, args) => {
                for (let i = 0; i < args.length; i += 2) {
                    const props = typeof args[i + 1] !== "string" ? JSON.stringify(args[i + 1]) : args[i + 1];
                    viewer.setAttribute(args[i], props);
                    await viewer.flush();
                }
            },
            viewer,
            args
        );
    };

    const poke = make_poke(viewer);

    const peek = async (name, json = true) => {
        const result = await page.evaluate((viewer, name) => viewer.getAttribute(name), viewer, name);
        if (json) {
            return JSON.parse(result);
        } else {
            return result;
        }
    };

    // open config

    await page.waitFor(3000);
    await page.evaluate(viewer => viewer.toggleConfig(), viewer);
    await page.waitFor(1000);

    // make a blotter

    await poke("aggregates", {
        lastUpdate: "last",
        name: "last",
        client: "last"
    });
    await poke("sort", [["lastUpdate", "asc"]]);
    await page.waitFor(200);
    await poke("sort", [["lastUpdate", "desc"]]);
    await page.waitFor(1000);

    // make a pivot table

    let cols = await peek("columns");
    cols = cols.filter(x => x != "name");
    await poke("columns", cols);
    await page.waitFor(200);
    cols = cols.filter(x => x != "symbol");
    await poke("columns", cols);
    await poke("row-pivots", ["symbol"]);
    await page.waitFor(1000);

    cols = cols.filter(x => x != "client");
    await poke("columns", cols);
    await poke("column-pivots", ["client"]);
    await page.waitFor(1000);

    cols = cols.filter(x => x != "lastUpdate");
    await poke("columns", cols);
    await page.waitFor(200);
    cols = cols.filter(x => x != "bid");
    await poke("columns", cols);
    await page.waitFor(200);
    cols = cols.filter(x => x != "ask");
    await poke("columns", cols);
    await page.waitFor(200);
    cols = cols.filter(x => x != "vol");
    await poke("columns", cols);
    await page.waitFor(200);

    // Split

    await page.evaluate(viewer => viewer.toggleConfig(), viewer);
    await page.waitFor(200);
    await page.mouse.click(300, 300, {button: "right"});
    await page.waitFor(200);
    await page.mouse.click(320, 340);
    await page.waitFor(1000);
    const viewer2 = (await page.$$("perspective-viewer"))[1];
    const poke2 = make_poke(viewer2);
    await page.evaluate(viewer => viewer.toggleConfig(), viewer2);

    // make a bar chart

    await poke2("column-pivots", [], "row-pivots", ["client"]);
    await page.waitFor(200);
    await poke2("plugin", "y_bar");
    await page.waitFor(500);
    await poke2("plugin", "x_bar");
    await page.waitFor(200);

    await poke2("columns", ["chg"]);
    await page.waitFor(200);
    await poke2("sort", [["chg", "desc"]]);
    await page.waitFor(200);
    await poke2("sort", [["chg", "asc"]]);
    await page.waitFor(1000);

    // create filter
    await page.evaluate(viewer => viewer.toggleConfig(), viewer);
    await page.waitFor(200);
    await poke("plugin", "datagrid");
    await page.waitFor(200);
    await poke("column-pivots", [], "columns", ["chg", "vol"]);
    await page.waitFor(200);
    await poke("row-pivots", ["client"]);
    await page.waitFor(200);
    await poke("sort", []);
    await page.waitFor(200);
    await page.evaluate(viewer => viewer.toggleConfig(), viewer);
    await page.waitFor(200);
    await page.mouse.click(300, 300, {button: "right"});
    await page.waitFor(200);
    await page.mouse.click(320, 360);
    await page.waitFor(200);

    await poke2("column-pivots", ["symbol"]);
    await page.waitFor(500);
    await poke2("column-pivots", ["client"], "row-pivots", ["symbol"]);
    await page.waitFor(1500);

    await page.mouse.move(100, 200);
    await page.mouse.click(100, 200);
    await page.waitFor(500);
    await page.mouse.move(100, 170);
    await page.mouse.click(100, 170);
    await page.waitFor(500);
    await page.mouse.move(100, 150);
    await page.mouse.click(100, 150);
    await page.waitFor(500);

    await poke2("column-pivots", [], "plugin", "treemap");
    await page.waitFor(500);
    await poke2("columns", ["vol", "chg"]);
    await page.waitFor(500);
    await poke2("sort", [["chg", "desc"]]);
    await page.waitFor(200);

    await page.mouse.move(100, 150);
    await page.mouse.click(100, 150);
    await page.mouse.move(0, 0);
    await page.waitFor(500);

    // close filter
    await page.evaluate(viewer => viewer.toggleConfig(), viewer2);
    await page.waitFor(200);
    await page.mouse.click(200, 200, {button: "right"});
    await page.waitFor(100);
    await page.mouse.click(220, 220);
    await page.waitFor(200);
    await page.evaluate(viewer => viewer.toggleConfig(), viewer);
    await page.waitFor(200);
    //await page.mouse.click(700, 40);
    await page.evaluate(() => window.reset());
    await page.waitFor(200);

    // time series

    await poke("computed-columns", ['second_bucket("lastUpdate")']);
    await poke("plugin", "y_line");
    await page.waitFor(200);
    await poke("columns", ["chg"]);
    await page.waitFor(200);

    await poke("sort", []);
    await page.waitFor(200);
    await poke("row-pivots", ["lastUpdate"]);

    await page.waitFor(1000);

    await poke("row-pivots", ["second_bucket(lastUpdate)"]);
    await page.waitFor(1000);
    await poke("column-pivots", ["client"]);
    await page.waitFor(3000);

    await poke("plugin", "heatmap");
    await page.waitFor(3000);

    await poke("filters", [["vol", ">", 107]]);
    await page.waitFor(200);
    await poke("filters", [["vol", ">", 108]]);
    await page.waitFor(200);
    await poke("filters", [["vol", ">", 109]]);
    await page.waitFor(200);
    await poke("filters", [["vol", ">", 109.5]]);
    await page.waitFor(200);
    await poke("filters", [["vol", ">", 109.7]]);
    await page.waitFor(200);

    await poke("columns", ["bid"]);
    await page.waitFor(3000);

    //script(page);
}

async function main() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [`--window-size=${1200},${800}`]
    });

    const page = await browser.newPage();

    script(page);
}

main();
