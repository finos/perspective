import {PerspectiveDockPanel} from "../../dist/esm/dockpanel";
import {PerspectiveWidget} from "../../dist/esm/widget";
import {Widget} from "@phosphor/widgets";

describe("dockpanel", () => {
    test("serialise returns a correct widget state", () => {
        const dockpanel = new PerspectiveDockPanel("name");
        Widget.attach(dockpanel, document.body);

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
        expect(dockpanel.save()).toStrictEqual(expectedConfig);
    });

    test("deserialise restore correct dockpanel state", () => {
        const dockpanel = new PerspectiveDockPanel("name", {node: document.body});

        const config = {
            main: {
                type: "tab-area",
                widgets: [{columns: ["A"]}],
                currentIndex: 0
            }
        };

        dockpanel.restore(config);

        const widgets = [];
        PerspectiveDockPanel.mapWidgets(widget => {
            widgets.push(widget);
        }, dockpanel.saveLayout());

        expect(widgets.length).toBe(1);
        expect(widgets[0].viewer.getAttribute("columns")).toBe(JSON.stringify(["A"]));
    });
});
