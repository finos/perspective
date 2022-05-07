__webpack_public_path__ = window.__webpack_public_path__ = `${document.querySelector("body").getAttribute("data-base-url")}nbextensions/@finos/perspective-jupyter`; // Configure requirejs

const {PerspectiveModel, PerspectiveView} = require("@finos/perspective-jupyterlab/src/js/nbextension");
// import {PerspectiveView} from "@finos/perspective-jupyterlab/src/js/view"
// import {PerspectiveModel} from "@finos/perspective-jupyterlab/src/js/model"
console.log(PerspectiveModel)
console.log(PerspectiveView)

module.exports = {
    PerspectiveModel,
    PerspectiveView,
}