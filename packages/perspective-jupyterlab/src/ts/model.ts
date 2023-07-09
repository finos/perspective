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

import { DOMWidgetModel } from "@jupyter-widgets/base";
import { PERSPECTIVE_VERSION } from "./version";

/**
 * TODO: document
 */
export class PerspectiveModel extends DOMWidgetModel {
    static model_name: string;
    static model_module: string;
    static model_module_version: string;
    static view_name: string;
    static view_module: string;
    static view_module_version: string;

    defaults() {
        return {
            ...super.defaults(),
            _model_name: PerspectiveModel.model_name,
            _model_module: PerspectiveModel.model_module,
            _model_module_version: PerspectiveModel.model_module_version,
            _view_name: PerspectiveModel.view_name,
            _view_module: PerspectiveModel.view_module,
            _view_module_version: PerspectiveModel.view_module_version,
            server: false,
            client: false,
        };
    }
}

PerspectiveModel.serializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
};

PerspectiveModel.model_name = "PerspectiveModel";
PerspectiveModel.model_module = "@finos/perspective-jupyterlab";
PerspectiveModel.model_module_version = PERSPECTIVE_VERSION;
PerspectiveModel.view_name = "PerspectiveView";
PerspectiveModel.view_module = "@finos/perspective-jupyterlab";
PerspectiveModel.view_module_version = PERSPECTIVE_VERSION;
