/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {
    Application, IPlugin
} from '@phosphor/application';

import {
    Widget
} from '@phosphor/widgets';

import {
    IJupyterWidgetRegistry
} from '@jupyter-widgets/base';

import {
    PerspectiveModel, PerspectiveView
} from './widget';

import {
    PERSPECTIVE_VERSION
} from './version';


export
    const pspPlugin: IPlugin<Application<Widget>, void> = {
        id: '@finos/perspective-jupyterlab',
        requires: [IJupyterWidgetRegistry],
        activate: (app: Application<Widget>, registry: IJupyterWidgetRegistry): void => {
            registry.registerWidget({
                name: '@finos/perspective-jupyterlab',
                version: PERSPECTIVE_VERSION,
                exports: {
                    PerspectiveModel: PerspectiveModel,
                    PerspectiveView: PerspectiveView
                }
            });
        },
        autoStart: true
    };

export default pspPlugin;
