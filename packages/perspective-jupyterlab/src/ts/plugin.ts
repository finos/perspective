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

const EXTENSION_ID = 'perspective';

const pspWidget: IPlugin<Application<Widget>, void> = {
  id: EXTENSION_ID,
  requires: [IJupyterWidgetRegistry],
  activate: activateWidgetExtension,
  autoStart: true
};

export default pspWidget;


/**
 * Activate the widget extension.
 */
function activateWidgetExtension(app: Application<Widget>, registry: IJupyterWidgetRegistry): void {
  registry.registerWidget({
    name: 'perspective',
    version: PERSPECTIVE_VERSION,
    exports: {
      PerspectiveModel: PerspectiveModel,
      PerspectiveView: PerspectiveView
    }
  });
}
