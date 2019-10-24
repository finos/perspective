import {PerspectiveDockPanel} from "../../dist/esm/dockpanel";
import {PerspectiveWidget} from "../../dist/esm/widget";
import {mapWidgets} from "../../dist/esm/utils";

describe("dockpanel", () => {
    test("serialise returns a correct widget state", () => {
        const dockpanel = new PerspectiveDockPanel("name");

        // eslint-disable-next-line @typescript-eslint/camelcase
        const widget = new PerspectiveWidget("One", {plugin_config: {columns: ["A"]}});
        dockpanel.addWidget(widget);

        const expectedConfig = {
            main: {
                type: "tab-area",
                widgets: [{columns: ["A"]}],
                currentIndex: 0
            }
        };
        expect(dockpanel.serialize()).toStrictEqual(expectedConfig);
    });

    test("deserialise restore correct dockpanel state", () => {
        const dockpanel = new PerspectiveDockPanel("name");
        const config = {
            main: {
                type: "tab-area",
                widgets: [{columns: ["A"]}],
                currentIndex: 0
            }
        };

        dockpanel.deserialize(config);

        const widgets = [];
        mapWidgets(widget => {
            widgets.push(widget);
        }, dockpanel.saveLayout());

        expect(widgets.length).toBe(1);
        expect(widgets[0].viewer.getAttribute("columns")).toBe(JSON.stringify(["A"]));
    });
});
