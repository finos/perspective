/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// DELETE ME!

/**
 * This injects a box into the page that moves with the mouse; Useful for
 * debugging.
 *
 * Lifted from https://github.com/puppeteer/puppeteer/issues/4336
 */
module.exports.track_mouse = function track_mouse() {
    this.evaluate(() => {
        const CSS = `
        .mouse-helper {
        pointer-events: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 20px;
        height: 20px;
        background: rgba(0,0,0,.4);
        border: 1px solid red;
        border-radius: 0px;
        margin-left: -10px;
        margin-top: -10px;
        }
        .mouse-helper.button-1 {
        transition: none;
        background: rgba(0,0,0,0.9);
        }
        .mouse-helper.butto
        n-2 {
        transition: none;
        border-color: rgba(0,0,255,0.9);
        }
        .mouse-helper.button-3 {
        transition: none;
        border-radius: 4px;
        }
        .mouse-helper.button-4 {
        transition: none;
        border-color: rgba(255,0,0,0.9);
        }
        .mouse-helper.button-5 {
        transition: none;
        border-color: rgba(0,255,0,0.9);
        }`;
        const box = document.createElement("div");
        box.classList.add("mouse-helper");
        const styleElement = document.createElement("style");
        styleElement.innerHTML = CSS;
        document.head.appendChild(styleElement);
        document.body.appendChild(box);
        document.addEventListener(
            "mousemove",
            (event) => {
                box.style.left = event.pageX + "px";
                box.style.top = event.pageY + "px";
                updateButtons(event.buttons);
            },
            true
        );
        document.addEventListener(
            "mousedown",
            (event) => {
                updateButtons(event.buttons);
                box.classList.add("button-" + event.which);
            },
            true
        );
        document.addEventListener(
            "mouseup",
            (event) => {
                updateButtons(event.buttons);
                box.classList.remove("button-" + event.which);
            },
            true
        );
        function updateButtons(buttons) {
            for (let i = 0; i < 5; i++)
                box.classList.toggle("button-" + i, buttons & (1 << i));
        }
    });
};
