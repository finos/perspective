/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as perspective from "@finos/perspective";

import MonacoEditor from "react-monaco-editor";
import * as monaco from "monaco-editor";

import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
import {
    PerspectiveViewerConfig,
    HTMLPerspectiveViewerElement,
} from "@finos/perspective-viewer";

import "./index.css";

const worker = perspective.default.shared_worker();

const config: PerspectiveViewerConfig = {
    row_pivots: ["State"],
};

type ConfigEditorProps = {
    view_callback: (t: monaco.editor.IStandaloneCodeEditor) => void;
};

class ConfigEditor extends React.Component<
    ConfigEditorProps,
    Record<string, string>
> {
    state: Record<string, string>;

    constructor(props: ConfigEditorProps) {
        super(props);
        this.state = {
            code: "// Loading ...",
        };
    }

    editorDidMount(editor: monaco.editor.IStandaloneCodeEditor) {
        const view_callback = this.props.view_callback;
        view_callback(editor);
    }

    render() {
        const code = this.state.code;
        const options = {
            selectOnLineNumbers: true,
        };

        return (
            <MonacoEditor
                language="json"
                theme="vs-light"
                value={code}
                options={options}
                editorDidMount={this.editorDidMount.bind(this)}
            />
        );
    }
}

const get_table = async (): Promise<perspective.Table> => {
    const req = fetch("./superstore.arrow");
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    return await worker.table(buffer as any);
};

async function run_task(
    editor: Promise<monaco.editor.IStandaloneCodeEditor>,
    viewer: Promise<HTMLPerspectiveViewerElement>
) {
    const [elem, table] = await Promise.all([viewer, get_table()]);
    elem.load(table);
    elem.restore(config);
    const [cfg, monaco] = await Promise.all([elem.save(), editor]);
    monaco.setValue(JSON.stringify(cfg, null, 4));
    elem.addEventListener("perspective-config-update", async (event) => {
        monaco.setValue(JSON.stringify(await elem.save(), null, 4));
        console.log((event as CustomEvent).detail);
    });
}

const EDITOR_STYLE: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: "50%",
};

const App = (): React.ReactElement => {
    const editor = invert_promise<monaco.editor.IStandaloneCodeEditor>();
    const viewer = invert_promise<HTMLPerspectiveViewerElement>();

    run_task(editor.promise, viewer.promise);

    return (
        <div>
            <div style={EDITOR_STYLE}>
                <ConfigEditor view_callback={editor.resolve}></ConfigEditor>
            </div>
            <perspective-viewer ref={viewer.resolve}></perspective-viewer>
        </div>
    );
};

window.addEventListener("load", () => {
    ReactDOM.render(<App />, document.getElementById("root"));
});

// Utils

type InvertPromise<T> = {
    promise: Promise<T>;
    resolve: (t: T) => void;
};

function invert_promise<T>() {
    const obj: InvertPromise<T> = {
        promise: undefined as unknown as Promise<T>,
        resolve: undefined as unknown as (t: T) => void,
    };

    obj.promise = new Promise((x) => {
        obj.resolve = function (y) {
            console.log(y);
            return x(y);
        };
    });

    return obj;
}
