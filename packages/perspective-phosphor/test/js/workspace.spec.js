/* eslint-disable @typescript-eslint/camelcase */
import {PerspectiveWorkspace} from "../../dist/esm/workspace";
import {toArray} from "@phosphor/algorithm";
import {PerspectiveWidget} from "../../dist/esm/widget";

describe("workspace", () => {
    test("addViewer adds widget to underlying dockpanel", () => {
        const workspace = new PerspectiveWorkspace();
        const widget = new PerspectiveWidget("One", {plugin_config: {columns: ["A"]}});
        workspace.addViewer(widget);

        const widgets = toArray(workspace.dockpanel.widgets());

        expect(widgets.length).toBe(1);
        expect(widgets[0]).toBe(widget);
    });

    test("makeMaster moves widget from dock to split panel", () => {
        const workspace = new PerspectiveWorkspace();
        const widget = new PerspectiveWidget("One", {plugin_config: {columns: ["A"]}});
        workspace.addViewer(widget);

        let widgets = toArray(workspace.dockpanel.widgets());
        expect(widgets.length).toBe(1);
        expect(widgets[0]).toBe(widget);
        expect(widgets[0].dark).toBeFalsy();

        workspace.makeMaster(widget);

        widgets = toArray(workspace.dockpanel.widgets());
        expect(widgets.length).toBe(0);

        widgets = workspace.masterpanel.widgets;
        expect(widgets.length).toBe(1);
        expect(widgets[0]).toBe(widget);
        expect(widgets[0].dark).toBeTruthy();
    });

    test("makeDetail moves widget from split to dock panel", () => {
        const workspace = new PerspectiveWorkspace();
        const widget = new PerspectiveWidget("One", {plugin_config: {columns: ["A"]}});
        workspace.addViewer(widget);

        let widgets = toArray(workspace.dockpanel.widgets());
        expect(widgets.length).toBe(1);
        expect(widgets[0]).toBe(widget);

        workspace.makeMaster(widget);

        widgets = toArray(workspace.dockpanel.widgets());
        expect(widgets.length).toBe(0);

        widgets = workspace.masterpanel.widgets;
        expect(widgets.length).toBe(1);
        expect(widgets[0]).toBe(widget);

        workspace.makeDetail(widget);
        expect(workspace.masterpanel.widgets.length).toBe(0);

        widgets = toArray(workspace.dockpanel.widgets());
        expect(widgets.length).toBe(1);
        expect(widgets[0]).toBe(widget);
        expect(widgets[0].dark).toBeFalsy();
    });

    test("`perspective-click` event handlers are registered on masterpanel widgets", () => {
        const workspace = new PerspectiveWorkspace();
        const widget = new PerspectiveWidget("One", {plugin_config: {columns: ["A"]}});
        workspace.addViewer(widget);

        workspace.onPerspectiveClick = jest.fn();

        widget.node.dispatchEvent(new CustomEvent("perspective-click"));
        expect(workspace.onPerspectiveClick).not.toHaveBeenCalled();

        workspace.makeMaster(widget);
        widget.node.dispatchEvent(new CustomEvent("perspective-click"));
        expect(workspace.onPerspectiveClick).toHaveBeenCalledTimes(1);
    });

    test("`perspective-click` event handlers are unregistered when widget is moved to detailpanel", () => {
        const workspace = new PerspectiveWorkspace();
        const widget = new PerspectiveWidget("One", {plugin_config: {columns: ["A"]}});
        workspace.addViewer(widget);

        workspace.onPerspectiveClick = jest.fn();

        widget.node.dispatchEvent(new CustomEvent("perspective-click"));
        expect(workspace.onPerspectiveClick).not.toHaveBeenCalled();

        workspace.makeMaster(widget);
        widget.node.dispatchEvent(new CustomEvent("perspective-click"));
        expect(workspace.onPerspectiveClick).toHaveBeenCalledTimes(1);

        workspace.makeDetail(widget);
        widget.node.dispatchEvent(new CustomEvent("perspective-click"));
        expect(workspace.onPerspectiveClick).toHaveBeenCalledTimes(1);
    });

    test("`perspective-click` events from master panel filter detail views when columns match", done => {
        const workspace = new PerspectiveWorkspace();
        const detailWidget = new PerspectiveWidget("One", {plugin_config: {columns: ["A"]}});
        const masterWidget = new PerspectiveWidget("One", {plugin_config: {columns: ["A", "B"]}});

        const mockTable = jest.fn();
        mockTable.schema = () => new Promise(resolve => resolve({A: "string"}));

        detailWidget.viewer.table = mockTable;

        workspace.addViewer(detailWidget);
        workspace.addViewer(masterWidget);

        workspace.makeMaster(masterWidget);
        const config = {filters: [["A", "===", "testValue"]]};
        masterWidget.node.dispatchEvent(new CustomEvent("perspective-click", {detail: {config}}));

        setTimeout(() => {
            expect(detailWidget.save().filters).toEqual(config.filters);
            done();
        }, 0);
    });

    test("`perspective-click` events from master panel do NOT filter detail views when columns do NOT match", done => {
        const workspace = new PerspectiveWorkspace();
        const detailWidget = new PerspectiveWidget("One", {plugin_config: {columns: ["A"]}});
        const masterWidget = new PerspectiveWidget("One", {plugin_config: {columns: ["A", "B"]}});

        const mockTable = jest.fn();
        mockTable.schema = () => new Promise(resolve => resolve({A: "string"}));

        detailWidget.viewer.table = mockTable;

        workspace.addViewer(detailWidget);
        workspace.addViewer(masterWidget);

        workspace.makeMaster(masterWidget);
        const config = {filters: [["B", "===", "testValue"]]};
        masterWidget.node.dispatchEvent(new CustomEvent("perspective-click", {detail: {config}}));

        setTimeout(() => {
            expect(detailWidget.save().filters).toEqual([]);
            done();
        }, 0);
    });
});
