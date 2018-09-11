/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {Clipboard} from '@jupyterlab/apputils';

/* defines */
export
const MIME_TYPE = 'application/psp+json';

export
const PSP_CLASS = 'jp-PSPViewer';

export
const PSP_CONTAINER_CLASS = 'jp-PSPContainer';

export
const PSP_CONTAINER_CLASS_DARK = 'jp-PSPContainer-dark';

export function datasourceToSource(source: string){
    if(source.indexOf('comm://') !== -1){
        return 'comm';
    } else{
        return 'static';
    }
}

export function convertToCSV(objArray: Array<Object>): string {
    //https://medium.com/@danny.pule/export-json-to-csv-file-using-javascript-a0b7bc5b00d2
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var header = '';
        var line = '';
        for (var index in array[i]) {
            if (i === 0){
                if (header != ''){
                    header += ', ';
                }
                header += index;
            }
            if (line != ''){
                line += ', ';
            }
            line += array[i][index];
        }

        if (i === 0){
            str += header + '\r\n';
        }
        str += line + '\r\n';
    }

    return str;
}

export
function createCopyDl(psp: any) : {[key:string]:HTMLElement;} {
    let copy_button = document.createElement('button');
    copy_button.textContent = 'copy';
    let dl_button = document.createElement('button');
    dl_button.textContent = 'download';

    let viewtype: string;
    let data: any;
    let height: number;
    let width: number;
    let png: any;
    let canvas: HTMLCanvasElement;
    let img: any;

    copy_button.onmousedown = () => {
        viewtype = psp.getAttribute('view');
        if (viewtype === 'hypergrid') {
            psp._view.to_json().then((dat: Array<Object>) => {
                data = dat;
            });
        } else {
            let svg = psp.querySelector('svg') as SVGSVGElement;
            height = svg.height.baseVal.value;
            width = svg.width.baseVal.value;
            data = new XMLSerializer().serializeToString(svg);
            canvas = document.createElement('canvas') as HTMLCanvasElement;
            canvas.height = height;
            canvas.width = width;

            let ctx = canvas.getContext("2d");
            let DOMURL = window.URL || (window as any).webkitURL || window;
            img = new Image();
            let svg2 = new Blob([data], {type: "image/svg+xml;charset=utf-8"});

            let url = DOMURL.createObjectURL(svg2);
            img.onload = function() {
                ctx.drawImage(img, 0, 0, width, height);
                png = canvas.toDataURL("image/png");
            };
            img.src = url;
        }
    }

    dl_button.onmousedown = copy_button.onmousedown;

    copy_button.onclick = () => {
        let copied = false;
        let timeout = 100;
        while (timeout<=16000){
            setTimeout(() => {
                if(copied){
                    return;
                }
                if (data) {
                    if(viewtype === 'hypergrid'){
                        Clipboard.copyToSystem(convertToCSV(data));
                    } else {
                        if (!png){
                            //not ready
                            return
                        }
                        canvas.focus();
                        document.execCommand("copy");
                    }
                    copied = true;
                } else if (timeout == 16000){
                    console.error('Timeout waiting for perspective!');
                }
            }, timeout);
            timeout *= 2;
        }
    };

    dl_button.onclick = () => {
        let dl = false;
        let timeout = 100;
        while (timeout<=16000){
            setTimeout(() => {
                if(dl){
                    return;
                }
                if (data) {
                    if(viewtype === 'hypergrid'){
                        let csv = convertToCSV(data);
                        let csvContent = "data:text/csv;charset=utf-8," + csv;
                        let DOMURL = window.URL || (window as any).webkitURL || window;
                        var a = document.createElement('a');
                        a.download = 'psp.csv';
                        a.target = "_blank";
                        a.href = csvContent;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        DOMURL.revokeObjectURL(png);
                    } else {
                        if (!png){
                            //not ready
                            return
                        }
                        let DOMURL = window.URL || (window as any).webkitURL || window;
                        var a = document.createElement('a');
                        a.download = 'psp.png';
                        a.target = "_blank";
                        a.href = png;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        DOMURL.revokeObjectURL(png);
                    }
                    dl = true;
                } else if (timeout == 16000){
                    console.error('Timeout waiting for perspective!');
                }
            }, timeout);
            timeout *= 2;
        }
    };

    return {copy: copy_button, dl:dl_button};
}
