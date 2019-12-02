import {ActivityMonitor} from '@jupyterlab/coreutils';
import {ILayoutRestorer, JupyterFrontEnd, JupyterFrontEndPlugin} from '@jupyterlab/application';
import {IThemeManager, WidgetTracker, Dialog, showDialog} from '@jupyterlab/apputils';
import {ABCWidgetFactory, DocumentRegistry, IDocumentWidget, DocumentWidget} from '@jupyterlab/docregistry';
import {PerspectiveWidget} from "@finos/perspective-phosphor";

/**
 * The name of the factories that creates widgets.
 */
const FACTORY_CSV = 'CSVPerspective';
const FACTORY_JSON = 'JSONPerspective';

const RENDER_TIMEOUT = 1000;

type IPerspectiveDocumentType = "csv" | "json";


export class PerspectiveDocumentWidget extends DocumentWidget<PerspectiveWidget> {
  constructor(options: DocumentWidget.IOptionsOptionalContent<PerspectiveWidget>, 
              type: IPerspectiveDocumentType = "csv") {
    super({ content: new PerspectiveWidget("test"), context: options.context, reveal: options.reveal});

    this._psp = this.content;
    this._type = type;
    this._context = options.context;

    this._context.ready.then(() => {
      this._update();
      this._monitor = new ActivityMonitor({
        signal: this.context.model.contentChanged,
        timeout: RENDER_TIMEOUT
      });
      this._monitor.activityStopped.connect(this._update, this);
    });
  }

  private _update(): void {
    try {
      if(this._type === "csv") {
        const data: string = this._context.model.toString();
        this._psp._update(data);

      } else if (this._type === "json") {
        const data = this._context.model.toJSON();
        this._psp._update(data as any);
      } else {
        throw "Not handled";
      }
    } catch {
        showDialog({
          body: "Perspective could not render the data",
          buttons: [Dialog.okButton({ label: "Dismiss" })],
          focusNodeSelector: "input",
          title: "Error"});
    }
  }

  dispose(): void {
    if (this._monitor) {
      this._monitor.dispose();
    }
    super.dispose();
  }

  private _type: IPerspectiveDocumentType;
  private _context: DocumentRegistry.Context;
  private _psp: PerspectiveWidget;
  private _monitor: ActivityMonitor<DocumentRegistry.IModel, void> | null = null;
}


/**
 * A widget factory for CSV widgets.
 */
export class PerspectiveCSVFactory extends ABCWidgetFactory<IDocumentWidget<PerspectiveWidget> > {
  protected createNewWidget(context: DocumentRegistry.Context): IDocumentWidget<PerspectiveWidget> {
    return new PerspectiveDocumentWidget({context}, "csv");
  }
}

/**
 * A widget factory for JSON widgets.
 */
export class PerspectiveJSONFactory extends ABCWidgetFactory<IDocumentWidget<PerspectiveWidget> > {
  protected createNewWidget(context: DocumentRegistry.Context): IDocumentWidget<PerspectiveWidget> {
    return new PerspectiveDocumentWidget({context}, "json");
  }
}

/**
 * The perspective extension for files 
 */
export
const perspectiveRenderers: JupyterFrontEndPlugin<void> = {
  activate: activate,
  id: '@finos/perspective-jupyterlab:renderers',
  requires: [],
  optional: [
    ILayoutRestorer,
    IThemeManager
  ],
  autoStart: true
};

/**
 * Activate cssviewer extension for CSV files
 */
function activate(
  app: JupyterFrontEnd,
  restorer: ILayoutRestorer | null,
  themeManager: IThemeManager | null
): void {

  const factorycsv = new PerspectiveCSVFactory({
    name: FACTORY_CSV,
    fileTypes: ['csv'],
    defaultFor: ['csv'],
    readOnly: true
  });

  const factoryjson = new PerspectiveJSONFactory({
    name: FACTORY_JSON,
    fileTypes: ['json', 'jsonl'],
    defaultFor: ['json', 'jsonl'],
    readOnly: true
  });


  const trackercsv = new WidgetTracker<IDocumentWidget<PerspectiveWidget>>({
    namespace: 'csvperspective'
  });

  const trackerjson = new WidgetTracker<IDocumentWidget<PerspectiveWidget>>({
    namespace: 'jsonperspective'
  });

  if (restorer) {
    // Handle state restoration.
    void restorer.restore(trackercsv, {
      command: 'docmanager:open',
      args: widget => ({ path: widget.context.path, factory: FACTORY_CSV }),
      name: widget => widget.context.path
    });

    void restorer.restore(trackerjson, {
      command: 'docmanager:open',
      args: widget => ({ path: widget.context.path, factory: FACTORY_JSON }),
      name: widget => widget.context.path
    });
  }

  app.docRegistry.addWidgetFactory(factorycsv);
  app.docRegistry.addWidgetFactory(factoryjson);

  let ftcsv = app.docRegistry.getFileType('csv');
  let ftjson = app.docRegistry.getFileType('json');

  factorycsv.widgetCreated.connect((sender, widget) => {
    // Track the widget.
    void trackercsv.add(widget);
    // Notify the widget tracker if restore data needs to update.
    widget.context.pathChanged.connect(() => {
      void trackercsv.save(widget);
    });

    if (ftcsv) {
      widget.title.iconClass = ftcsv.iconClass!;
      widget.title.iconLabel = ftcsv.iconLabel!;
    }
  });

  factoryjson.widgetCreated.connect((sender, widget) => {
    // Track the widget.
    void trackerjson.add(widget);
    // Notify the widget tracker if restore data needs to update.
    widget.context.pathChanged.connect(() => {
      void trackerjson.save(widget);
    });

    if (ftjson) {
      widget.title.iconClass = ftjson.iconClass!;
      widget.title.iconLabel = ftjson.iconLabel!;
    }
  });


  // Keep the themes up-to-date.
  const updateThemes = () => {
    // const isLight = themeManager && themeManager.theme ? themeManager.isLight(themeManager.theme) : true;
    // style = isLight ? Private.LIGHT_STYLE : Private.DARK_STYLE;
    // rendererConfig = isLight ? Private.LIGHT_TEXT_CONFIG : Private.DARK_TEXT_CONFIG;
    // tracker.forEach(grid => {
    //   grid.content.style = style;
    //   grid.content.rendererConfig = rendererConfig;
    // });
  };
  if (themeManager) {
    themeManager.themeChanged.connect(updateThemes);
  }
}

