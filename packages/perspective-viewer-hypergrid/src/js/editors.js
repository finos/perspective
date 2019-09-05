/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const Textfield = require("fin-hypergrid/src/cellEditors/Textfield");

function px(n) {
    return n + "px";
}

function validateEditorValueDate(x) {
    const d = new Date(x);
    return !(d instanceof Date && !isNaN(d));
}

function setBoundsDate(cellBounds) {
    var style = this.el.style;
    style.left = px(cellBounds.x + 4);
    style.top = px(cellBounds.y - 3);
    style.width = px(cellBounds.width + 50);
    style.height = px(cellBounds.height);
}

function setBoundsText(cellBounds) {
    var style = this.el.style;
    style.left = px(cellBounds.x + 4);
    style.top = px(cellBounds.y - 3);
    style.width = px(cellBounds.width - 10);
    style.height = px(cellBounds.height);
}

function setEditorValueDate(x) {
    const now = +new Date(x);
    const day = ("0" + now.getDate()).slice(-2);
    const month = ("0" + (now.getMonth() + 1)).slice(-2);
    this.input.value = `${now.getFullYear()}-${month}-${day}`;
}

function setEditorValueDatetime(x) {
    const now = new Date(x);
    const day = ("0" + now.getDate()).slice(-2);
    const month = ("0" + (now.getMonth() + 1)).slice(-2);
    const hour = ("0" + now.getHours()).slice(-2);
    const minute = ("0" + now.getMinutes()).slice(-2);
    const ss = ("0" + now.getSeconds()).slice(-2);
    this.input.value = `${now.getFullYear()}-${month}-${day}T${hour}:${minute}:${ss}`;
}

export function set_editors(grid) {
    const base_args = {
        localizer: grid.localization.get("chromeDate"),
        getEditorValue: x => new Date(x),
        validateEditorValue: validateEditorValueDate,
        setBounds: setBoundsDate,
        selectAll: () => {}
    };

    const date = Textfield.extend("perspective-date", {
        template: "<input class='hypergrid-textfield' type='date'>",
        setEditorValue: setEditorValueDate,
        setBounds: setBoundsDate,
        ...base_args
    });

    const datetime = Textfield.extend("perspective-datetime", {
        template: "<input class='hypergrid-textfield' type='datetime-local'>",
        getEditorValue: x => +new Date(x),
        setEditorValue: setEditorValueDatetime,
        setBounds: setBoundsDate,
        ...base_args
    });

    const text = Textfield.extend("perspective-text", {
        setBounds: setBoundsText
    });

    grid.cellEditors.add(date);
    grid.cellEditors.add(datetime);
    grid.cellEditors.add(text);
}
