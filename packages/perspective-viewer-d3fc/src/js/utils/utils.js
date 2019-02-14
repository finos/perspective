export function areArraysEqualSimple(arr1, arr2) {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
}

export function getOrCreateElement(container, selector, createCallback) {
    let element = container.select(selector);
    return element.size() > 0 ? element : createCallback();
}
