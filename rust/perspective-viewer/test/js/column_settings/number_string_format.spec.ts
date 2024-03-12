// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { Type } from "@finos/perspective";
import {
    DEFAULT_CONFIG,
    PageView,
    compareContentsToSnapshot,
} from "@finos/perspective-test";
import { ColumnSelector } from "@finos/perspective-test/src/js/models/settings_panel";
import { test, expect } from "@finos/perspective-test";
import { DataGridPlugin } from "@finos/perspective-test/src/js/models/plugins";
import { DataGrid } from "@finos/perspective-test/src/js/models/plugins/datagrid";

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/basic-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

test("Integer/float styles", async ({ page }) => {
    const view = new PageView(page);
    await view.restore({
        settings: true,
        plugin: "Datagrid",
        columns: ["Profit", "Row ID"],
    });
    const profit = await view.settingsPanel.activeColumns.getColumnByName(
        "Profit"
    );
    await profit.editBtn.click();
    const styleContainer = view.columnSettingsSidebar.styleTab.container;
    await styleContainer.getByText("Fractional Digits").waitFor();
    const rowId = await view.settingsPanel.activeColumns.getColumnByName(
        "Row ID"
    );
    await rowId.editBtn.click();
    await styleContainer
        .getByText("Fractional Digits")
        .waitFor({ state: "detached" });
});

for (const name of ["Significant Digits", "Fractional Digits"]) {
    test.skip(`Rounding Increment doesn't send when ${name} is open`, async ({
        page,
    }) => {
        let view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Datagrid",
            columns: ["Profit"],
        });
        const profit = await view.settingsPanel.activeColumns.getColumnByName(
            "Profit"
        );
        await profit.editBtn.click();
        const styleContainer = view.columnSettingsSidebar.styleTab.container;
        await styleContainer
            .locator('div[data-value="Auto"] select')
            .first()
            .selectOption("20");

        await styleContainer.getByText(name).click();
        let config = await view.save();
        expect(config).toMatchObject({
            columns_config: {},
        });

        await styleContainer.getByText(name).click();
        config = await view.save();
        expect(config).toMatchObject({
            columns_config: {
                Profit: {
                    number_format: {
                        maximumFractionDigits: 0,
                        roundingIncrement: 20,
                    },
                },
            },
        });
    });
}

test.skip("Rounding Priority doesn't send unless Fractional and Significant Digits are open", async ({
    page,
}) => {
    const view = new PageView(page);
    await view.restore({
        settings: true,
        plugin: "Datagrid",
        columns: ["Profit"],
    });
    const col = await view.settingsPanel.activeColumns.getColumnByName(
        "Profit"
    );
    await col.editBtn.click();
    const styleContainer = view.columnSettingsSidebar.styleTab.container;
    await expect(
        styleContainer.locator("#Rounding-Priority-checkbox")
    ).toBeEnabled();

    const select = styleContainer
        .locator('div[data-value="Auto"] select')
        .nth(1);

    await select.scrollIntoViewIfNeeded();
    await select.selectOption("MorePrecision");
    const config = await view.save();
    expect(config).toMatchObject({
        columns_config: {
            Profit: {
                number_format: {
                    roundingPriority: "morePrecision",
                },
            },
        },
    });
    await styleContainer.getByText("Fractional Digits").click();
    const config2 = await view.save();
    expect(config2).toMatchObject({
        columns_config: {},
    });
});

test("Datagrid integration", async ({ page }) => {
    const view = new PageView(page);
    const datagrid = new DataGrid(page);
    await view.restore({
        plugin: "Datagrid",
        columns: ["Profit"],
        columns_config: {
            Profit: {
                number_format: {
                    minimumIntegerDigits: 3,
                    maximumFractionDigits: 0,
                    roundingIncrement: 50,
                    roundingMode: "ceil",
                    notation: "compact",
                    compactDisplay: "short",
                    signDisplay: "always",
                },
            },
        },
    });
    const decimal = await datagrid.regularTable.table.innerHTML();
    await compareContentsToSnapshot(decimal, [
        "datagrid-integration-decimal.html",
    ]);
    await view.restore({
        plugin: "Datagrid",
        columns: ["Profit"],
        columns_config: {
            Profit: {
                number_format: {
                    style: "currency",
                    currency: "USD",
                    currencySign: "accounting",
                },
            },
        },
    });
    const currency = await datagrid.regularTable.table.innerHTML();
    await compareContentsToSnapshot(currency, [
        "datagrid-integration-currency.html",
    ]);

    await view.restore({
        plugin: "Datagrid",
        columns: ["Profit"],
        columns_config: {
            Profit: {
                number_format: {
                    style: "unit",
                    unit: "byte",
                },
            },
        },
    });
    const unit = await datagrid.regularTable.table.innerHTML();
    await compareContentsToSnapshot(unit, ["datagrid-integration-unit.html"]);

    await view.restore({
        plugin: "Datagrid",
        columns: ["Profit"],
        columns_config: {
            Profit: {
                number_format: {
                    style: "percent",
                },
            },
        },
    });
    const data = await datagrid.regularTable.table.innerHTML();
    await compareContentsToSnapshot(data, [
        "datagrid-integration-percent.html",
    ]);
});
