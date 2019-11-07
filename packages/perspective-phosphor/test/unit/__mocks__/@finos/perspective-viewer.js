const originalCreateElement = document.createElement;

document.createElement = name => {
    const element = originalCreateElement.call(document, name);
    return name === "perspective-viewer" ? patchUnknownElement(element) : element;
};

const patchUnknownElement = element => {
    let config = {};
    element.save = () => config;
    element.restore = value => {
        config = {...config, ...value};
    };

    element.restyleElement = jest.fn();
    return element;
};
