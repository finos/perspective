class MockPerspectiveViewer extends HTMLElement {
    restore(config) {
        this.config = {...config};
    }
    save() {
        return this.config;
    }
    load(table) {
        this.table = table;
    }
    restyleElement(){}
}

window.customElements.define("perspective-viewer", MockPerspectiveViewer);
