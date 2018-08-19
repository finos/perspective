import * as debug from "debug";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { HTMLPerspectiveElement } from "@jpmorganchase/perspective-viewer";

interface PerspectiveViewerAPI {
  load(...args: any[]): void;
  update(...args: any[]): void;
  doLayout(): void;
  save(): any;
  restore(element: any): void;
}

export interface PerspectiveViewerProps {
  onViewerReady?(api: PerspectiveViewerAPI): void;
  columns?: string[];
  filters?: string[][];
  sort?: string[];
  view?: string;
  columnPivots: string[];
  index: string;
  rowPivots: string[];
  message?: React.ReactElement<any>;
}

export interface PerspectiveViewerState {
  loaded: boolean;
}

const logger = debug("perspective:viewer:react");

export class PerspectiveViewer extends React.Component<PerspectiveViewerProps, PerspectiveViewerState> {
  private ref: HTMLPerspectiveElement;

  constructor(props: PerspectiveViewerProps) {
    super(props);
    
    // Bind all viewer functions to ensure we don't re-render the viewer
    this.save = this.save.bind(this);
    this.load = this.load.bind(this);
    this.update = this.update.bind(this);
    this.bindRef = this.bindRef.bind(this);
    this.restore = this.restore.bind(this);
    this.doLayout = this.doLayout.bind(this);
  }

  public render() {
    const { columns, filters, sort, view, columnPivots, index, rowPivots } = this.props;
    return (
      <perspective-viewer
        ref={this.bindRef} 
        columns={JSON.stringify(columns)}
        filters={JSON.stringify(filters)}
        sort={JSON.stringify(sort)}
        view={JSON.stringify(view)}
        columnPivots={JSON.stringify(columnPivots)}
        index={index}
        rowPivots={JSON.stringify(rowPivots)}
        message={this.getMessage()}
      />
    );
  }

  private getMessage() {
    if (!this.props.message) {
      return void 0;
    }
    
    return ReactDOMServer.renderToStaticMarkup(this.props.message);
  }

  private bindRef(ref: HTMLPerspectiveElement) {
    this.ref = ref;
  }
  
  public componentWillMount() {
    if (this.props.onViewerReady) {
      this.props.onViewerReady({
        load: this.load,
        update: this.update,
        save: this.save,
        restore: this.restore,
        doLayout: this.doLayout
      })
    }
  }

  public async componentWillUnmount() {
    this.checkRef();

    await this.ref.delete();
  }

  private checkRef() {
    if (!this.ref) {
      throw Error("Perspective Viewer is not loaded yet");
    }
  }

  private doLayout() {
    this.checkRef();

    this.ref.notifyResize();
  }

  private save() {
    this.checkRef();

    return this.ref.save();
  }

  private restore(element: any) {
    this.checkRef();

    this.ref.restore(element);
  }

  private load(...args: any[]) {
    this.checkRef();

    if (this.state.loaded) {
      logger("Calling load multiple times is not advised for performance reasons");
    }

    this.ref.load(...args);
  }

  private update(...args: any[]) {
    this.checkRef();

    if (this.state.loaded) {
      // We've loaded data before, so we can load 
      this.ref.update(...args);
    } else {
      this.ref.load(...args);
    }
  }
}