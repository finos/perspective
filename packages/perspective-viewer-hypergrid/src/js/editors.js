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
    const style = this.el.style;
    style.left = px(cellBounds.x + 4);
    style.top = px(cellBounds.y - 3);
    style.width = px(cellBounds.width + 50);
    style.height = px(cellBounds.height);
}

function setBoundsText(cellBounds) {
    const style = this.el.style;
    style.left = px(cellBounds.x + 4);
    style.top = px(cellBounds.y - 3);
    style.width = px(cellBounds.width - 10);
    style.height = px(cellBounds.height);
}

function setEditorValueDate(x) {
    if (x === null) {
        return;
    }
    const now = +new Date(x);
    const day = ("0" + now.getDate()).slice(-2);
    const month = ("0" + (now.getMonth() + 1)).slice(-2);
    this.input.value = `${now.getFullYear()}-${month}-${day}`;
}

function setEditorValueDatetime(x) {
    if (x === null) {
        return;
    }
    const now = new Date(x);
    const day = ("0" + now.getDate()).slice(-2);
    const month = ("0" + (now.getMonth() + 1)).slice(-2);
    const hour = ("0" + now.getHours()).slice(-2);
    const minute = ("0" + now.getMinutes()).slice(-2);
    const ss = ("0" + now.getSeconds()).slice(-2);
    this.input.value = `${now.getFullYear()}-${month}-${day}T${hour}:${minute}:${ss}`;
}

function setEditorValueText(updated) {
    if (updated === null) {
        return "";
    } else {
        this.input.value = this.localizer.format(updated);
        return updated;
    }
}

function getEditorValueText(updated) {
    this._row.then(([old]) => {
        const index = old.__INDEX__;
        delete old["__INDEX__"];
        const colname = Object.keys(old)[0];
        this._table.update([{__INDEX__: index, [colname]: updated}]);
    });
    return this.localizer.format(updated);
}

function getEditorValueDate(updated) {
    updated = new Date(updated);
    this._row.then(([old]) => {
        const index = old.__INDEX__;
        delete old["__INDEX__"];
        const colname = Object.keys(old)[0];
        this._table.update([{__INDEX__: index, [colname]: updated}]);
    });
    return this.localizer.format(updated);
}

export function set_editors(grid) {
    const date = Textfield.extend("perspective-date", {
        localizer: grid.localization.get("chromeDate"),
        template: "<input class='hypergrid-textfield' type='date'>",
        getEditorValue: getEditorValueDate,
        setEditorValue: setEditorValueDate,
        validateEditorValue: validateEditorValueDate,
        setBounds: setBoundsDate,
        selectAll: () => {}
    });

    const datetime = Textfield.extend("perspective-datetime", {
        localizer: grid.localization.get("chromeDate"),
        template: "<input class='hypergrid-textfield' type='datetime-local'>",
        getEditorValue: getEditorValueDate,
        setEditorValue: setEditorValueDatetime,
        validateEditorValue: validateEditorValueDate,
        setBounds: setBoundsDate,
        selectAll: () => {}
    });

    const text = Textfield.extend("perspective-text", {
        setBounds: setBoundsText,
        setEditorValue: setEditorValueText,
        getEditorValue: getEditorValueText,
        validateEditorValue: function(str) {
            return this.localizer.invalid && this.localizer.invalid(str || this.input.value);
        }
    });

    const number = Textfield.extend("perspective-number", {
        setBounds: setBoundsText,
        setEditorValue: setEditorValueText,
        getEditorValue: getEditorValueText,
        validateEditorValue: x => isNaN(Number(x))
    });

    grid.cellEditors.add(number);
    grid.cellEditors.add(date);
    grid.cellEditors.add(datetime);
    grid.cellEditors.add(text);
}
