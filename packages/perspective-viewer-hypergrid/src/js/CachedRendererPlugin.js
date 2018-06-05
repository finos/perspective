/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

'use strict';

const rectangular = require('rectangular');

const Range = require('./Range');


function CachedRendererPlugin(grid) {

    async function update_cache() {
        if (grid._lazy_load) {
            let range = Range.estimate(grid);
            if (!range.isInvalid()) {
                var is_processing_range = grid._updating_cache && !range.within(grid._updating_cache.range);
                var is_range_changed = !grid._updating_cache && !range.within(grid._cached_range);
            }
            if (is_processing_range || is_range_changed) {
                grid._updating_cache = grid._cache_update(range);
                grid._updating_cache.range = range;
                let updated = await grid._updating_cache;
                if (updated) {
                    grid._updating_cache = undefined;
                    grid._cached_range = range;
                }
                return updated;
            } else if (!range.within(grid._cached_range)) {
                return false;
            }
        }
        return true;
    }

    grid.canvas._paintNow = grid.canvas.paintNow;

    grid.canvas.resize = async function() {
        var box = this.size = this.getDivBoundingClientRect(),
            width = this.width = Math.round(box.width),
            height = this.height = Math.round(box.height),
            ratio = 1,
            isHIDPI = window.devicePixelRatio && this.component.properties.useHiDPI;

        if (isHIDPI) {
            var devicePixelRatio = window.devicePixelRatio || 1;
            var backingStoreRatio = this.gc.webkitBackingStorePixelRatio ||
                this.gc.mozBackingStorePixelRatio ||
                this.gc.msBackingStorePixelRatio ||
                this.gc.oBackingStorePixelRatio ||
                this.gc.backingStorePixelRatio || 1;

            ratio = devicePixelRatio / backingStoreRatio;
        }


        this.bounds = new rectangular.Rectangle(0, 0, width, height);
        this.component.setBounds(this.bounds);
        this.resizeNotification();

        let render = await update_cache();

        if (render) {
            this.buffer.width = this.canvas.width = width * ratio;
            this.buffer.height = this.canvas.height = height * ratio;

            this.canvas.style.width = this.buffer.style.width = width + 'px';
            this.canvas.style.height = this.buffer.style.height = height + 'px';

            this.bc.scale(ratio, ratio);
            if (isHIDPI && !this.component.properties.useBitBlit) {
                this.gc.scale(ratio, ratio);
            }

            grid.canvas._paintNow();
        }
    };

    grid.canvas.paintNow = async function() {
        let render = await update_cache();
        if (render) {
            grid.canvas._paintNow();
        }
    };

}


module.exports = CachedRendererPlugin;
