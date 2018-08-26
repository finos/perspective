// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

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
} from './widget.ts';

import {
  PERSPECTIVE_VERSION
} from './version.ts';


const pspPlugin: IPlugin<Application<Widget>, void> = {
  id: '@jpmorganchase/perspective-jupyterlab',
  requires: [IJupyterWidgetRegistry],
  activate: (app: Application<Widget>, registry: IJupyterWidgetRegistry): void => {
    console.log(app);
    console.log(registry);
    registry.registerWidget({
      name: '@jpmorganchase/perspective-jupyterlab',
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
