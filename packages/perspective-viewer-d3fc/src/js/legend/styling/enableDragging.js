/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function enableDragging(element) {
    const node = element.node();
    node.style.cursor = "move";

    let xPositionDiff = 0,
        yPositionDiff = 0,
        xPositionLast = 0,
        yPositionLast = 0;

    node.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        xPositionLast = e.clientX;
        yPositionLast = e.clientY;
        document.onmouseup = releaseNode;
        document.onmousemove = dragNode;
    }

    function dragNode(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        xPositionDiff = xPositionLast - e.clientX;
        yPositionDiff = yPositionLast - e.clientY;
        xPositionLast = e.clientX;
        yPositionLast = e.clientY;
        // set the node's new position:
        node.style.top = node.offsetTop - yPositionDiff + "px";
        node.style.left = node.offsetLeft - xPositionDiff + "px";
    }

    function releaseNode() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
