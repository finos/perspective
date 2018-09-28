/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

window.addEventListener("WebComponentsReady", function() {
    var dropArea = document.getElementById("drop-area");
    var input = document.getElementById("fileElem");

    dropArea.addEventListener("dragenter", () => {}, false);
    dropArea.addEventListener("dragleave", () => {}, false);
    dropArea.addEventListener("dragover", () => {}, false);
    dropArea.addEventListener("drop", x => console.log(x), false);

    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ["dragenter", "dragover"].forEach(function(eventName) {
        dropArea.addEventListener(eventName, highlight, false);
    });
    ["dragleave", "drop"].forEach(function(eventName) {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add("highlight");
    }

    function unhighlight() {
        dropArea.classList.remove("highlight");
    }

    dropArea.addEventListener("drop", handleDrop, false);

    input.addEventListener("change", function() {
        handleFiles(this.files);
    });

    function handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;

        handleFiles(files);
    }

    function handleFiles(files) {
        [...files].forEach(uploadFile);
    }

    function uploadFile(file) {
        let reader = new FileReader();
        reader.onload = function(fileLoadedEvent) {
            let txt = fileLoadedEvent.target.result;
            const parent = dropArea.parentElement;
            parent.removeChild(dropArea);
            let psp = document.createElement("perspective-viewer");
            parent.appendChild(psp);
            psp.load(txt);
        };
        reader.readAsText(file);
    }
});
