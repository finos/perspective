/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import Textfield from "faux-hypergrid/src/cellEditors/Textfield";

function px(n) {
    return n + "px";
}

function validateEditorValueDate(x) {
    const d = new Date(x);
    return !(d instanceof Date && !isNaN(d));
}

function setBoundsDate(cellBounds) {
    const style = this.el.style;
    style.left = px(cellBounds.x - 1);
    style.top = px(cellBounds.y - 1);
    style.width = px(cellBounds.width + 52);
    style.height = px(cellBounds.height + 2);
}

function setBoundsText(cellBounds) {
    const style = this.el.style;
    style.left = px(cellBounds.x - 1);
    style.top = px(cellBounds.y - 1);
    style.width = px(cellBounds.width + 2);
    style.height = px(cellBounds.height + 2);
}

function setEditorValueDate(x) {
    if (x === null) {
        return;
    }
    const now = new Date(x);
    const day = ("0" + now.getDate()).slice(-2);
    const month = ("0" + (now.getMonth() + 1)).slice(-2);
    this.input.value = `${now.getFullYear()}-${month}-${day}`;
    this.input.addEventListener("keydown", keydown.bind(this));
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
    this.input.addEventListener("keydown", keydown.bind(this));
}

function setEditorValueText(updated) {
    // Move keyup so nav and edit don't conflict
    this.input.addEventListener("keydown", keydown.bind(this));
    // refire mouseover so hover does not go away when mouse stays over edit
    // cell
    this.input.addEventListener("mouseover", event => {
        var mouseMoveEvent = document.createEvent("MouseEvents");
        mouseMoveEvent.initMouseEvent(
            "mouseover",
            event.canBubble,
            event.cancelable,
            window,
            event.detail,
            event.screenX,
            event.screenY,
            event.clientX,
            event.clientY,
            event.ctrlKey,
            event.altKye,
            event.shiftKey,
            event.metaKey,
            event.button,
            event.relatedTarget
        );
        this._canvas.dispatchEvent(mouseMoveEvent);
    });
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

function getEditorValueNumber(updated) {
    this._row.then(([old]) => {
        const index = old.__INDEX__;
        delete old["__INDEX__"];
        const colname = Object.keys(old)[0];
        this._table.update([{__INDEX__: index, [colname]: Number(updated.replace(/,/g, ""))}]);
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

function saveEditorValue(x) {
    var save = !(x && x === this.initialValue) && this.grid.fireBeforeCellEdit(this.event.gridCell, this.initialValue, x, this);
    if (save) {
        const row = this.event.gridCell.y + this.grid.renderer.dataWindow.top - 1;
        const col = this.event.gridCell.x;
        this._data[row][col] = x;
        this.grid.canvas.paintNow();
    }
}

function keyup() {}

function keydown(e) {
    e.stopPropagation();
    let grid = this.grid,
        cellProps = this.event.properties,
        feedbackCount = cellProps.feedbackCount,
        keyChar = grid.canvas.getKeyChar(e),
        specialKeyup,
        stopped;

    if ((specialKeyup = this.specialKeyups[e.keyCode]) && (stopped = this[specialKeyup](feedbackCount))) {
        grid.repaint();
    }

    if (cellProps.mappedNavKey(keyChar, e.ctrlKey)) {
        if (!specialKeyup && (stopped = this.stopEditing(feedbackCount))) {
            grid.repaint();
        }
    }

    this.grid.fireSyntheticEditorKeyUpEvent(this, e);

    return stopped;
}

function stopEditing(feedback) {
    var str = this.input.value;

    try {
        var error = this.validateEditorValue(str);
        if (!error) {
            var value = this.getEditorValue(str);
        }
    } catch (err) {
        error = err;
    }

    if (!error && this.grid.fireSyntheticEditorDataChangeEvent(this, this.initialValue, value)) {
        try {
            this.saveEditorValue(value);
        } catch (err) {
            error = err;
        }
    }

    if (!error) {
        const {x, y} = this.grid.selectionModel.getLastSelection().origin;
        this.grid.selectionModel.select(x, y + 1, 0, 0);
        this.hideEditor();
        this.grid.cellEditor = null;
        this.grid._is_editing = true;
        this.el.remove();
        this.grid._is_editing = false;
        this.grid.div.parentNode.parentNode.host.focus();
    } else if (feedback >= 0) {
        // false when `feedback` undefined
        this.errorEffectBegin(++this.errors % feedback === 0 && error);
    } else {
        // invalid but no feedback
        this.cancelEditing();
    }

    return !error;
}

function cancelEditing() {
    this.setEditorValue(this.initialValue);
    this.hideEditor();
    this.grid.cellEditor = null;
    this.grid._is_editing = true;
    this.el.remove();
    this.grid._is_editing = false;
    this.grid.takeFocus();

    return true;
}

export function set_editors(grid) {
    const date = Textfield.extend("perspective-date", {
        localizer: grid.localization.get("chromeDate"),
        template: "<input class='hypergrid-textfield' type='date'>",
        getEditorValue: getEditorValueDate,
        setEditorValue: setEditorValueDate,
        validateEditorValue: validateEditorValueDate,
        setBounds: setBoundsDate,
        selectAll: () => {},
        saveEditorValue,
        keyup,
        stopEditing,
        cancelEditing
    });

    const datetime = Textfield.extend("perspective-datetime", {
        localizer: grid.localization.get("chromeDate"),
        template: "<input class='hypergrid-textfield' type='datetime-local'>",
        getEditorValue: getEditorValueDate,
        setEditorValue: setEditorValueDatetime,
        validateEditorValue: validateEditorValueDate,
        setBounds: setBoundsDate,
        selectAll: () => {},
        saveEditorValue,
        keyup,
        stopEditing,
        cancelEditing
    });

    const text = Textfield.extend("perspective-text", {
        setBounds: setBoundsText,
        setEditorValue: setEditorValueText,
        getEditorValue: getEditorValueText,
        saveEditorValue,
        keyup,
        stopEditing,
        cancelEditing
    });

    const number = Textfield.extend("perspective-number", {
        setBounds: setBoundsText,
        setEditorValue: setEditorValueText,
        getEditorValue: getEditorValueNumber,
        validateEditorValue: x => isNaN(Number(x.replace(/,/g, ""))),
        saveEditorValue,
        keyup,
        stopEditing,
        cancelEditing
    });

    grid.cellEditors.add(number);
    grid.cellEditors.add(date);
    grid.cellEditors.add(datetime);
    grid.cellEditors.add(text);
}
