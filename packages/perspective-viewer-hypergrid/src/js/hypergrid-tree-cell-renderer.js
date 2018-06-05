/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

function treeArrowRendererPaint(gc, config) {
    var x = config.bounds.x;
    var y = config.bounds.y;
    var width = config.bounds.width;
    var height = config.bounds.height;

    var value = config.value;
    var leaf = config.dataRow.isLeaf;
    var depth = config.dataRow.rowPath.length-1;
    var parent = config.expanded;
    var lastChild = config.last;

    var backgroundColor = config.backgroundColor;
    if (config.isSelected) {
        backgroundColor = config.backgroundSelectionColor;
    }
    if (config.isRowHovered && config.hoverRowHighlight.enabled && !config.isCellHovered) {
        backgroundColor = config.hoverRowHighlight.backgroundColor;
    } else if (config.isCellHovered && config.hoverCellHighlight.enabled) {
        backgroundColor = config.hoverCellHighlight.backgroundColor;
    }

    gc.save();
    gc.cache.fillStyle = backgroundColor;

    var fgColor = config.isSelected ? config.foregroundSelectionColor : config.color;
    gc.cache.strokeStyle = fgColor;
    gc.cache.fillStyle = fgColor;

    var xOffset = x;
    var lineNodeSpace = 12;
    var nodeRadius = 4;

    // Draw vertical line
    gc.globalAlpha = 0.3;
    gc.beginPath();
    xOffset = x + lineNodeSpace * depth;

    // Draw arrow
    var xCenter = xOffset + 10,
        yCenter = y + (height / 2);
    if (!parent && !leaf) {
        gc.moveTo(xCenter - (nodeRadius / 2), yCenter - nodeRadius);
        gc.lineTo(xCenter - (nodeRadius / 2), yCenter + nodeRadius);
        gc.lineTo(xCenter + (nodeRadius / 2) + 2, yCenter);
        gc.lineTo(xCenter - (nodeRadius / 2), yCenter - nodeRadius);
    } else if (parent && !leaf) {
        gc.moveTo(xCenter - nodeRadius, yCenter - (nodeRadius / 2));
        gc.lineTo(xCenter + nodeRadius, yCenter - (nodeRadius / 2));
        gc.lineTo(xCenter, yCenter + (nodeRadius / 2) + 2);
        gc.lineTo(xCenter - nodeRadius, yCenter - (nodeRadius / 2));
    }

    gc.fill();
    gc.closePath();

    // render message text
    var cellTextOffset = xOffset + lineNodeSpace + (2 * nodeRadius) + 3;
    gc.globalAlpha = 1.0;
    gc.fillStyle = config.isSelected ? config.foregroundSelectionColor : config.color;
    gc.textAlign = 'start';
    gc.textBaseline = 'middle';
    gc.font = config.isSelected ? config.foregroundSelectionFont : config.treeHeaderFont;
    var metrics = gc.getTextWidthTruncated(value, width - cellTextOffset + (x - 3), true);
    var yOffset = y + height / 2;
    config.minWidth = cellTextOffset + gc.getTextWidth(value);
    gc.fillText(metrics.string ? metrics.string : value, cellTextOffset, y + height / 2 + 0.5);
    gc.restore();
}


export function treeLineRendererPaint(gc, config) {
    var x = config.bounds.x;
    var y = config.bounds.y;
    var width = config.bounds.width;
    var height = config.bounds.height;

    var value = config.value;
    var leaf = config.dataRow.isLeaf;
    var depth = config.dataRow.rowPath.length-1;
    var parent = config.expanded;
    var lastChild = config.last;

    var backgroundColor = config.backgroundColor;
    if (config.isSelected) {
        backgroundColor = config.backgroundSelectionColor;
    }
    if (config.isRowHovered && config.hoverRowHighlight.enabled && !config.isCellHovered) {
        backgroundColor = config.hoverRowHighlight.backgroundColor;
    } else if (config.isCellHovered && config.hoverCellHighlight.enabled) {
        backgroundColor = config.hoverCellHighlight.backgroundColor;
    }

    gc.save();
    gc.cache.fillStyle = backgroundColor;
    gc.rect(x, y, width, height);
    gc.fillRect(x, y, width, height);
    //gc.strokeRect(x, y, width, height);
   // gc.clip();

    var fgColor = config.isSelected ? config.foregroundSelectionColor : config.color;
    gc.cache.strokeStyle = fgColor;
    gc.cache.fillStyle = fgColor;
    var xOffset = x;
    var lineNodeSpace = 16;
    var nodeRadius = 3;

    // Draw vertical line
    gc.globalAlpha = 0.3;
    gc.strokeStyle = fgColor;

    gc.beginPath();
    for (var i = 1; i <= depth; i++) {
        xOffset += lineNodeSpace;
        var lineHeight = (lastChild && !parent) ? height / 2 : height;
        gc.moveTo(xOffset, y);
        gc.lineTo(xOffset, y);
        gc.lineTo(xOffset, y + lineHeight);
        if (i === depth) {
            gc.moveTo(xOffset, y + (height / 2));
            gc.lineTo(xOffset, y + (height / 2));
            gc.lineTo(xOffset + lineNodeSpace - nodeRadius, y + (height / 2));
        } else {
            gc.lineTo(xOffset, y + height);
        }
    }

    // Draw node circle
    if (!leaf) {
        gc.moveTo(xOffset + lineNodeSpace + nodeRadius, y + (height / 2));
        gc.arc(xOffset + lineNodeSpace, y + (height / 2), nodeRadius, 0, 2 * Math.PI);
        if (config.isCellHovered) {
            gc.globalAlpha = 0.45;
            gc.fill();
            gc.globalAlpha = 0.3;
        }
    } else {
        gc.lineTo(xOffset + lineNodeSpace + nodeRadius, y + (height / 2));
    }

    if (parent && !leaf) {
        gc.globalAlpha = 0.8;
        gc.fill();
        gc.moveTo(xOffset + lineNodeSpace, y + (height / 2) + nodeRadius);
        gc.lineTo(xOffset + lineNodeSpace, y + height);
        gc.globalAlpha = 0.3;
    }

    gc.stroke();
    gc.closePath();

    // render message text

    gc.globalAlpha = 1.0;
    gc.fillStyle = config.isSelected ? config.foregroundSelectionColor : config.color;
    gc.textAlign = 'start';
    gc.textBaseline = 'middle';
    gc.font = config.isSelected ? config.foregroundSelectionFont : config.treeHeaderFont;
    var cellTextOffset = xOffset + lineNodeSpace + (2 * nodeRadius) + 3;
    let formatted_value = config.formatValue(config.value, config._type);
    config.minWidth = cellTextOffset + gc.getTextWidth(formatted_value) + 15;
    var metrics = gc.getTextWidthTruncated(formatted_value, width - cellTextOffset + (x - 3), true);
    var yOffset = y + height / 2;
    gc.fillText(metrics.string ? metrics.string : formatted_value, cellTextOffset, yOffset);
    gc.restore();
}

