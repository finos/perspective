/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

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
