import {Widget} from '@phosphor/widgets';
import {IRenderMime} from '@jupyterlab/rendermime-interfaces';

export class RenderedPlotlyEditor extends Widget
  implements IRenderMime.IRenderer {
  /**
   * Create a new widget for rendering.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
  }

  /**
   * Dispose of the resources used by the widget.
   */
  dispose(): void {
    super.dispose();
  }

  /**
   * Render into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const state = model.data[this._mimeType] as any | PlotlyEditorState;
      try {
        const handleUpdate = (
          state: PlotlyEditorState | ReadonlyJSONObject
        ) => {
          const newData = {
            [this._mimeType]: state as any | PlotlyEditorState
          };
          model.setData({ data: newData });
        };
        this._ref = ReactDOM.render(
          <ChartEditor
            state={state}
            handleUpdate={handleUpdate}
            plotly={Plotly}
          />,
          this.node,
          () => {
            resolve(undefined);
          }
        ) as ChartEditor;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    this.update();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(): void {
    if (this.isVisible && this._ref) {
      this._ref.handleResize();
    }
  }

  private _mimeType: string;
  private _ref: ChartEditor;
}

/**
 * A mime renderer factory for Plotly Editor.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: options => new RenderedPlotlyEditor(options)
};

const extensions: IRenderMime.IExtension | IRenderMime.IExtension[] | any = [
  {
    id: 'jupyterlab-chart-editor:factory',
    name: 'jupyterlab-chart-editor:factory',
    rendererFactory,
    rank: 0,
    dataType: 'json',
    fileTypes: [
      {
        name: 'plotlyeditor',
        mimeTypes: [MIME_TYPE],
        extensions: ['.plotly', '.plotly.json'],
        iconClass: CSS_ICON_CLASS
      }
    ],
    documentWidgetFactoryOptions: {
      name: 'Plotly Editor',
      primaryFileType: 'plotlyeditor',
      // The 'plotly' type is defined in @jupyterlab/plotly-extension
      fileTypes: ['plotly', 'plotlyeditor', 'json'],
      defaultFor: ['plotlyeditor']
    }
  }
];

export default extensions;