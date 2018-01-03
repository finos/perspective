/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import rectangular from 'rectangular';

export function GridUIFixPlugin(grid) {

    grid.canvas.resize = function() {
        var box = this.size = this.div.getBoundingClientRect();

        this.width = Math.floor(this.div.clientWidth);
        this.height = Math.floor(this.div.clientHeight);

        //fix ala sir spinka, see
        //http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        //just add 'hdpi' as an attribute to the fin-canvas tag
        var ratio = 1;
        var isHIDPI = window.devicePixelRatio && this.component.properties.useHiDPI;
        if (isHIDPI) {
            var devicePixelRatio = window.devicePixelRatio || 1;
            var backingStoreRatio = this.gc.webkitBackingStorePixelRatio ||
                this.gc.mozBackingStorePixelRatio ||
                this.gc.msBackingStorePixelRatio ||
                this.gc.oBackingStorePixelRatio ||
                this.gc.backingStorePixelRatio || 1;

            ratio = devicePixelRatio / backingStoreRatio;
            //this.canvasCTX.scale(ratio, ratio);
        }

        this.buffer.width = this.canvas.width = this.width * ratio;
        this.buffer.height = this.canvas.height = this.height * ratio;

        this.canvas.style.width = this.buffer.style.width = this.width + 'px';
        this.canvas.style.height = this.buffer.style.height = this.height + 'px';

        this.bc.scale(ratio, ratio);
        if (isHIDPI && !this.component.properties.useBitBlit) {
            this.gc.scale(ratio, ratio);
        }

        this.bounds = new rectangular.Rectangle(0, 0, this.width, this.height);
        this.component.setBounds(this.bounds);
        this.resizeNotification();
        this.paintNow();
    }

    grid.canvas._tickPaint = grid.canvas.tickPaint;
    grid.canvas.tickPaint = async function (t) {
        let range = this.component.grid.getVisibleRows();
        let s = range[1];
        let e = range[range.length - 1];
        if (this.component.grid._cache_update && range.length > 1 && this.dirty && (this.__cached_start !== s || this.__cached_end !== e)) {
            if (this._updating_cache) {
                this._updating_cache.cancel();
            }
            this._updating_cache = this.component.grid._cache_update(s, e);
            await this._updating_cache;
            this._updateing_cache = undefined;
            this.__cached_start = s;
            this.__cached_end = e;
        }
        this.component.grid.canvas._tickPaint(t);
    }

    grid._getGridCellFromMousePoint = grid.getGridCellFromMousePoint;
    grid.getGridCellFromMousePoint = function(mouse) {
        if (this.getRowCount() === 0) {
            return {'fake': 1};
        } else {
            try {
                return this._getGridCellFromMousePoint(mouse);
            } catch (e) {
                return {'fake': 1};

            }
        }
    };


    grid.renderer._paintGridlines = grid.renderer.paintGridlines;
    grid.renderer.paintGridlines = function(gc) {
        var visibleColumns = this.visibleColumns, C = visibleColumns.length,
            visibleRows = this.visibleRows, R = visibleRows.length;

        if (C && R) {
            var gridProps = this.properties,
                lineWidth = gridProps.lineWidth,
                lineColor = gridProps.lineColor,
                viewHeight = visibleRows[R - 1].bottom,
                viewWidth = visibleColumns[C - 1].right;

            gc.cache.fillStyle = lineColor;

            if (gridProps.fixedColumnCount > 0 && gridProps.fixedColumnCount < C) {
                var lw = gridProps.gridLinesV ? lineWidth + 1: lineWidth;
                var fixedX = visibleColumns[gridProps.fixedColumnCount].left - 1;
                gc.fillRect(fixedX, 0, lw, viewHeight);
            }

            if (gridProps.fixedRowCount > 0 && gridProps.fixedRowCount < R) {
                var lw = gridProps.gridLinesH ? lineWidth + 1: lineWidth;
                var fixedY = visibleRows[gridProps.fixedRowCount].bottom;
                gc.fillRect(0, fixedY, viewWidth, lw);
            }

            gc.fillRect(0, visibleRows[0].bottom, viewWidth, 1);

            this._paintGridlines(gc);
        }
    };

    grid.renderer.computeCellsBounds = function() {

        var scrollTop = this.getScrollTop(),
            scrollLeft = this.getScrollLeft(),

            fixedColumnCount = this.grid.getFixedColumnCount(),
            fixedRowCount = this.grid.getFixedRowCount(),

            bounds = this.getBounds(),
            grid = this.grid,
            behavior = grid.behavior,
            editorCellEvent = grid.cellEditor && grid.cellEditor.event,

            vcEd, xEd,
            vrEd, yEd,
            sgEd, isSubgridEd,

            insertionBoundsCursor = 0,
            previousInsertionBoundsCursorValue = 0,

            lineWidthX = grid.properties.gridLinesV ? grid.properties.lineWidth : 1,
            lineWidthY = grid.properties.gridLinesH ? grid.properties.lineWidth : 0,

            start = 0,
            numOfInternalCols = 0,
            x, X, // horizontal pixel loop index and limit
            y, Y, // vertical pixel loop index and limit
            c, C, // column loop index and limit
            g, G, // subgrid loop index and limit
            r, R, // row loop index and limitrows in current subgrid
            subrows, // rows in subgrid g
            base, // sum of rows for all subgrids so far
            subgrids = behavior.subgrids,
            subgrid,
            rowIndex,
            scrollableSubgrid,
            footerHeight,
            vx, vy,
            vr, vc,
            width, height,
            firstVX, lastVX,
            firstVY, lastVY,
            topR,
            xSpaced, widthSpaced, heightSpaced; // adjusted for cell spacing

        if (editorCellEvent) {
            xEd = editorCellEvent.gridCell.x;
            yEd = editorCellEvent.dataCell.y;
            sgEd = editorCellEvent.subgrid;
        }
        if (grid.properties.showRowNumbers) {
            start = behavior.rowColumnIndex;
            numOfInternalCols = Math.abs(start);
        }

        this.scrollHeight = 0;

        this.visibleColumns.length = 0;
        this.visibleRows.length = 0;

        this.visibleColumnsByIndex = []; // array because number of columns will always be reasonable
        this.visibleRowsByDataRowIndex = {}; // hash because keyed by (fixed and) scrolled row indexes

        this.insertionBounds = [];

        for (
            x = 0, c = start, C = grid.getColumnCount(), X = bounds.width || grid.canvas.width;
            c < C && x <= X;
            c++
        ) {
            if (c === behavior.treeColumnIndex && !behavior.hasTreeColumn()) {
                numOfInternalCols = (numOfInternalCols > 0) ? numOfInternalCols - 1 : 0;
                this.visibleColumns[c] = undefined;
                continue;
            }

            vx = c;
            if (c >= fixedColumnCount) {
                lastVX = vx += scrollLeft;
                if (firstVX === undefined) {
                    firstVX = lastVX;
                }
            }
            if (vx >= C) {
                break; // scrolled beyond last column
            }

            width = Math.ceil(behavior.getColumnWidth(vx));

            xSpaced = x ? x + lineWidthX : x;
            widthSpaced = x ? width - lineWidthX : width;
            this.visibleColumns[c] = this.visibleColumnsByIndex[vx] = vc = {
                index: c,
                columnIndex: vx,
                column: behavior.getActiveColumn(vx),
                left: xSpaced,
                width: widthSpaced,
                right: xSpaced + widthSpaced
            };
            if (xEd === vx) {
                vcEd = vc;
            }

            x += width;

            insertionBoundsCursor += Math.round(width / 2) + previousInsertionBoundsCursorValue;
            this.insertionBounds.push(insertionBoundsCursor);
            previousInsertionBoundsCursorValue = Math.round(width / 2);
        }

        // get height of total number of rows in all subgrids following the data subgrid
        footerHeight = grid.properties.defaultRowHeight *
            subgrids.reduce(function(rows, subgrid) {
                if (scrollableSubgrid) {
                    rows += subgrid.getRowCount();
                } else {
                    scrollableSubgrid = subgrid.isData;
                }
                return rows;
            }, 0);

        for (
            base = r = g = y = 0, G = subgrids.length, Y = bounds.height - footerHeight;
            g < G;
            g++, base += subrows
        ) {
            subgrid = subgrids[g];
            subrows = subgrid.getRowCount();
            scrollableSubgrid = subgrid.isData;
            isSubgridEd = (sgEd === subgrid);
            topR = r;

            // For each row of each subgrid...
            for (R = r + subrows; r < R && y < Y; r++) {
                vy = r;
                if (scrollableSubgrid && r >= fixedRowCount) {
                    vy += scrollTop;
                    lastVY = vy - base;
                    if (firstVY === undefined) {
                        firstVY = lastVY;
                    }
                    if (vy >= R) {
                        break; // scrolled beyond last row
                    }
                }

                rowIndex = vy - base;
                height = behavior.getRowHeight(rowIndex, subgrid);

                heightSpaced = height - lineWidthY;
                this.visibleRows[r] = vr = {
                    index: r,
                    subgrid: subgrid,
                    rowIndex: rowIndex,
                    top: y,
                    height: heightSpaced,
                    bottom: y + heightSpaced
                };

                if (scrollableSubgrid) {
                    this.visibleRowsByDataRowIndex[vy - base] = vr;
                }

                if (isSubgridEd && yEd === rowIndex) {
                    vrEd = vr;
                }

                y += height;
            }

            if (scrollableSubgrid) {
                subrows = r - topR;
                Y += footerHeight;
            }
        }

        if (editorCellEvent) {
            editorCellEvent.visibleColumn = vcEd;
            editorCellEvent.visibleRow = vrEd;
            editorCellEvent.gridCell.y = vrEd && vrEd.index;
            editorCellEvent._bounds = null;
        }

        this.viewHeight = Y;

        this.dataWindow = this.grid.newRectangle(firstVX, firstVY, lastVX - firstVX, lastVY - firstVY);

        // Resize CellEvent pool
        var pool = this.cellEventPool,
            previousLength = pool.length,
            P = (this.visibleColumns.length + numOfInternalCols) * this.visibleRows.length;

        if (P > previousLength) {
            pool.length = P; // grow pool to accommodate more cells
        }
        for (var p = previousLength; p < P; p++) {
            pool[p] = new behavior.CellEvent; // instantiate new members
        }

        this.resetAllGridRenderers();
    };
}