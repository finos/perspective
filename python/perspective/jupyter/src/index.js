// import "./build/perspective-nbextension.css";
// import "@finos/perspective-jupyterlab/dist/umd/perspective-nbextension.css";
// export * as default from "./build/perspective-nbextension"
// export * as default from "@finos/perspective-jupyterlab/dist/umd/perspective-nbextension"

// import "@finos/perspective-jupyterlab/dist/umd/perspective-nbextension.css";
export {PerspectiveModel, PerspectiveView} from "@finos/perspective-jupyterlab/src/js/nbextension"
import {PerspectiveView} from "@finos/perspective-jupyterlab/src/js/view"
import {PerspectiveModel} from "@finos/perspective-jupyterlab/src/js/model"
console.log(PerspectiveModel)
console.log(PerspectiveView)