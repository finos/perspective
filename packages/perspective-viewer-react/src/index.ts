declare global {
  export namespace JSX {
    interface IntrinsicElements {
      "perspective-viewer": any;
    }
  }
}

export { PerspectiveViewer, PerspectiveViewerProps } from "./viewer";