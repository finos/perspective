/* eslint-env browser */

// NOTE: gulpfile.js's 'add-ons' task copies this file, altering the final line, to /demo/build/add-ons/, along with a minified version. Both files are eventually deployed to http://openfin.github.io/fin-hypergrid/add-ons/.

// NOTE: This page generates 2 jsdoc pages, one for the `GroupedHeader` cell renderer class and the other for the add-on (API with `mixInTo` method).

'use strict';

var CLASS_NAME = 'GroupedHeader';

/**
 * @summary For detailed tutorial-style documentation, see the {@link https://github.com/openfin/fin-hypergrid/wiki/Grouped+Column+Headers|wiki page}.
 *
 * @desc This page is about the `groupedHeader` API.
 *
 * For the cell renderer installed by this API, see {@link groupedHeader.mixInTo~GroupedHeader|GroupedHeader}.
 *
 * #### Table of contents
 *
 * Method|Description
 * ------|-----------
 * {@link groupedHeader.mixInTo}|Installs the {@link groupedHeader.mixInTo~GroupedHeader GroupedHeader} cell renderer.
 * {@link groupedHeader.decorateBackgroundWithBottomBorder}|The default background decorator.
 * {@link groupedHeader.decorateBackgroundWithLinearGradient}|An alternative background decorator.
 *
 * @mixin
 */
var groupedHeader;

/** @typedef gradientStop
 * @type {Array}
 * @desc Consists of two elements:
 * 1. Element `[0]` (number): Stop position ranging from `0.0` (start of gradient) to `1.0` (end of gradient).
 * 2. Element `[1]` (string): CSS color spec in a string, one of:
 *  * color name (caution: some browsers may only accept the 16 HTML4 color names here)
 *  * #nnnnnn
 *  * rgb(r,g,b)
 *  * rgba(r,g,b,a)
 *  * hsl(h,s,l)
 *  * hsla(h,s,l,a)
 *
 *  Applied to the graphic context's {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient/addColorStop|addColorStop} method.
 */

/** @typedef groupConfigObject
 * @type {object}
 * @summary Grouped header paint function `config` object overrides.
 * @desc Contains all of the regular paint function `config` object properties (see {@tutorial cell-renderer}).
 *
 * In addition, this object may contain the properties described below.
 *
 * Most of these properties (with some exceptions) may be "constructable":
 * That is, they may be functions and if so the function will be called and the property will take on the returned value.
 * Such functions are called once at the first column of each group with the cell renderer's `paint` function's {@link paintFunction|interface}.
 * The exceptions are properties that are already defined as methods (such as `paintBackground`).
 *
 * @property {paintFunction} [paintBackground=groupedHeader.mixInTo~GroupedHeader#paintBackground]
 * Reference to the current background renderer for this grid's grouped column labels.
 * If omitted, uses {@link groupedHeader.mixInTo~GroupedHeader#paintBackground|cell renderer's}.
 *
 * @property {function|number} [thickness]
 * Constant line thickness in pixels of the bottom border drawn when group config's (or cell renderer's) `paintBackground` is set to {@link groupedHeader.decorateBackgroundWithBottomBorder} (or a function that returns such a number).
 * If omitted, the bottom border will be drawn proportionally: Lowest-order nested group gets a 1-pixel thick border, with each higher-order group getting a progressively thicker border.
 *
 * @property {function|gradientStop[]} [gradientStops]
 * List of {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient/addColorStop|gradient stops} that define the gradient (or a function that returns such a list).
 * Required when group config's (or cell renderer's) `paintBackground` is set to {@link groupedHeader.decorateBackgroundWithLinearGradient}.
 */

var prototypeAdditions = {
    /**
     * @summary The grouped header paint function.
     * @desc This is the heart of the cell renderer.
     *
     * If you feel the urge to override this, you are on the wrong path! Write a new cell renderer instead.
     * @implements paintFunction
     * @default {@link groupedHeader.paintHeaderGroups}
     * @memberOf groupedHeader.mixInTo~GroupedHeader#
     */
    paint: paintHeaderGroups,

    // Remaining are exclusive to `GroupedHeader` and do not override regular cell renderer members:

    /**
     * @summary Group header delimiter.
     * @desc String used within header strings to concatenate group label(s), always ending with actual header.
     * @type {string}
     * @default '|' (the vertical bar character)
     * @memberOf groupedHeader.mixInTo~GroupedHeader#
     */
    delimiter: '|',

    /**
     * @summary An additional renderer for just the background.
     * @desc This is called by the `paint` function to paint the background before it calls the superclass's paint function to paint the foreground.
     * This will be overridden by similar definition in `groupConfig` for the current nesting level.
     * @implements paintFunction
     * @default {@link groupedHeader.decorateBackgroundWithLinearGradient}
     * @memberOf groupedHeader.mixInTo~GroupedHeader#
     */
    paintBackground: decorateBackgroundWithBottomBorder,

    /**
     * @summary Grouped header configuration overrides.
     * @desc This array is a list of {@link groupConfigObject} objects, one for each nesting level, each of which may contain:
     * * An override for the background decorator
     * * Properties of proprietary interest to the background decorator
     * * Miscellaneous overrides for the cell renderer's `paint` function's regular `config` object properties (`color` in the above example)
     *
     * The properties contained in each `config` object pertain to the group labels and their background decorators only. They do not pertain to the actual column headers. Those appear below all the nested group headers and are rendered using the unaltered paint function's config object.
     *
     * You can list a separate object for each level of group header nesting, beginning with the highest-order group header.
     * However, note that if there are fewer of these objects in the list than the maximum depth of nested group headers, the list wraps (repeats).
     *
     * The default is a single-element array.
     * As a consequence of the wrapping feature described above, it therefore accommodates all levels of nested group headers.
     * The default consists of:
     * * `color` - A new color 50% lighter than `config.color` (the cell's "foreground" color).
     * * `gradientStops` - A gradient, 0% at top to 35% at bottom, of the above derived color.
     * @type {groupConfigObject[]}
     * @default A single-element array (see above)
     * @memberOf groupedHeader.mixInTo~GroupedHeader#
     */
    groupConfig: [{
        color: function(gc, config) {
            return config.color; //lighterColor(gc, config.color, 0.0);
        },
        gradientStops: function(gc, config) {
            return [
                [0, lighterColor(gc, config.color, 0.5, 0)],
                [1, lighterColor(gc, config.color, 0.5, .35)]
            ];
        }
    }]
};

/**
 * @summary Mix in the code necessary to support grouped column headers.
 * @desc Performs the following mix ins:
 * 1. Creates a new renderer and adds it to the grid.
 * 2. Extend the behavior's {@link behaviors/JSON#setHeaders|setHeaders} method.
 * 3. Sets the data model's {@link dataModel#groupHeaderDelimiter|groupHeaderDelimiter} property, which tells the data model to prepend the up and down sort arrows to the last item (actual column header) of the header string rather than the start of the header string (which is the highest-order group label).
 * @function
 * @param {Hypergrid} grid - Your instantiated grid object.
 * @param {object} options - Additions/overrides for the grid's singleton {@link groupedHeader.mixInTo~GroupedHeader|GroupedHeader} instance.
 * @param {function} [options.CellRenderer] - Extend from this constructor.
 * If omitted, uses the constructor of the cell renderer being used by the first currently active header cell.
 * @memberOf groupedHeader
 */
function mixInTo(grid, options) {
    options = options || {};

    // 1. Creates a new renderer and adds it to the grid.
    var CellRenderer = options.CellRenderer;

    if (!CellRenderer || typeof CellRenderer === 'string') {
        var cellRendererName = CellRenderer || grid.behavior.getActiveColumn(0).getCellProperty(0, 'renderer'),
            cellRenderer = grid.cellRenderers.get(cellRendererName);
        CellRenderer = Object.getPrototypeOf(cellRenderer).constructor;
    }

    /**
     * This is the cell renderer.
     *
     * For the API containing the mix-in and set-up code, see {@link groupedHeader}.
     *
     * This cell renderer extends {@link CellRenderer} or a descendant class (usually {@link SimpleCell}).
     *
     * _Note:_
     * The code for this class is not in itw own file.
     * It is found inside {@link groupedHeader.mixInto}.
     *
     * @constructor
     */
    var GroupedHeader = CellRenderer.extend(CLASS_NAME, prototypeAdditions);

    // Create a special cell renderer to be used by the grouped header cells.
    var renderer = grid.cellRenderers.add(GroupedHeader);

    // Set instance variables from `options` object, overriding values in above prototype
    Object.getOwnPropertyNames(options).forEach(function(key) {
        renderer[key] = options[key];
    });

    // Extend the behavior's `setHeaders` method.
    grid.behavior.setHeaders = setHeaders; // This override calls the superclass's implementation

    // Extend the behavior's `isColumnReorderable` method.
    grid.behavior.isColumnReorderable = isColumnReorderable;

    // Set the data model's `groupHeaderDelimiter` property
    grid.behavior.dataModel.groupHeaderDelimiter = renderer.delimiter;
}

/**
 * @summary Set the headers _and_ set the header row height.
 * @desc Convenience function to:
 * 1. Call the underlying {@link behaviors/JSON#setHeaders|setHeaders} method.
 * 2. Set the header row height based on the maximum group depth.
 * 3. Set all active header cells to use the GroupHeader cell renderer.
 * @this {Behavior}
 * @param {string[]|object} headers - The header labels. One of:
 * * _If an array:_ Must contain all headers in column order.
 * * _If a hash:_ May contain any headers, keyed by field name, in any order.
 * @memberOf groupedHeader
 */
function setHeaders(headers) {
    var originalMethodFromPrototype = Object.getPrototypeOf(this).setHeaders,
        groupedHeaderCellRendererInstance = this.grid.cellRenderers.get(CLASS_NAME),
        delimiter = groupedHeaderCellRendererInstance.delimiter;

    // 1. Call the original implementation to actually set the headers
    originalMethodFromPrototype.call(this, headers);

    // 2. Set the header row height based on the maximum group depth among all active columns.
    var levels = this.columns.reduce(function(max, column) {
        return Math.max(column.header.split(delimiter).length, max);
    }, 0);

    var headerDataModel = this.grid.behavior.subgrids.lookup.header,
        headerRowHeight = 5 / 4 * this.grid.properties.defaultRowHeight;

    if (levels > 1) {
        headerRowHeight = levels * 4 / 5 * this.grid.properties.defaultRowHeight; 
    }

    this.grid.setRowHeight(0, headerRowHeight, headerDataModel);

    // 3. Set all active header cells to use the GroupHeader cell renderer
    this.columns.forEach(function(column) {
        column.properties.columnHeader.renderer = CLASS_NAME;
        // column.setCellProperty(0, 'renderer', CLASS_NAME, headerDataModel);
    });
}

/**
 * Prevent column moving when there are any grouped headers.
 * @returns {boolean}
 * @memberOf groupedHeader
 * @inner
 */
function isColumnReorderable() {
    var originalMethodFromPrototype = Object.getPrototypeOf(this).isColumnReorderable,
        isReorderable = originalMethodFromPrototype.call(this),
        groupedHeaderCellRendererInstance = this.grid.cellRenderers.get(CLASS_NAME),
        delimiter = groupedHeaderCellRendererInstance.delimiter;

    return (
        isReorderable &&
        !this.columns.find(function(column) { // but only if no grouped columns
            return column.getCellProperty(0, 'renderer') === CLASS_NAME && // header cell using GroupedHeader
                column.header.indexOf(delimiter) !== -1; // header is part of a group
        })
    );
}

/**
 * @summary This cell renderer's paint function.
 * @desc This function renders a grouped column header when both of the following are true:
 * * Cell is a header cell.
 * * Column's header string contains the `delimiter` string.
 * @type {function}
 * @memberOf groupedHeader.mixInTo~GroupedHeader#
 */

/**
 * @summary The {@link groupedHeader.mixInTo~GroupedHeader|GroupedHeader} cell renderer's `paint` function.
 * @desc This function is called by the Hypergrid renderer on every grid render, once for each column header from left to right.
 * Should be set on (and only on) all header cells — regardless of whether or not the header is part of a column group.
 * (See {@link groupedHeader.setHeaders} which does this for you.)
 * @implements paintFunction
 * @memberOf groupedHeader
 */
function paintHeaderGroups(gc, config) {
    var paint = this.super.paint,
        colIndex = config.dataCell.x;

    var values = config.value.split(this.delimiter), // each group header including column header
        groupCount = values.length - 1; // group header levels above column header

    if (groupCount === 0 || colIndex === 0) { // no group headers OR first column
        this.groups = []; // start out with no groups defined
    }

    if (groupCount) { // has group headers
        var group,
            groups = this.groups,
            rect = config.bounds,
            new_group = false,
            bounds = Object.assign({}, rect), // save bounds for final column header render and resetting

            // save cosmetic properties for final column header render that follows this if-block
            columnConfigStash = {
                isColumnHovered: config.isColumnHovered,
                isSelected: config.isSelected,
                font: config.font,
                columnHeaderHalign: config.columnHeaderHalign,
                backgroundColor: config.backgroundColor
            };

        // height of each level is the same, 1/levels of total height
        rect.height /= values.length;

        // Always paint the group header background
        config.prefillColor = null;

        for (var g = 0, y = rect.y; g < groupCount; g++, y += rect.height) {
            if (!groups[g] || values[g] !== groups[g].value) {
                // Level has changed so reset left position (group[g] as on the renderer and persists between calls)
                group = groups[g] = groups[g] || {};
                group.value = values[g];
                group.left = bounds.x;
                group.width = bounds.width;

                // save cosmetic properties for final column header render that follows this if-block
                group.configStash = {
                    font: config.font,
                    backgroundColor: config.backgroundColor
                };
                new_group = true;
                // Stash config values that will be overridden and save overrides in `group` from config of first column in group
                group.config = this.groupConfig[g % this.groupConfig.length]; // wrap if not enough elements
                Object.keys(group.config).forEach(stash);
            } else {
                // Continuation of same group level, so just repaint but with increased width
                group = groups[g];
                group.width += config.lineWidth + bounds.width;
            }

            rect.x = group.left;
            rect.y = y;
            rect.width = group.width;

            // Copy `group` members saved above from `group.config` to `config`
            Object.assign(config, group);

            if (group.value) {
                // Decorate the group header background
                this.groupIndex = g;
                this.groupCount = groupCount;
                // Suppress hover and selection effects for group headers
                config.isColumnHovered = config.isSelected = false;
                config.columnHeaderHalign = 'center';

                // Make group headers bold & grey
                config.value = group.value;
                config.font = '12px Arial'; //'bold ' + config.font;
                // config.backgroundColor = 'transparent';

                // Paint the group header foreground
                paint.call(this, gc, config);
              //  gc.cache.fillStyle = "#999"; //config.columnHeaderColor;
              //  gc.fillRect(bounds.x - 1, bounds.y, 1, bounds.y + bounds.height);

                var decorator = config.paintBackground || this.paintBackground;
                if (decorator) {
                    if (typeof decorator !== 'function') {
                        decorator = groupedHeader[decorator];
                        if (typeof decorator !== 'function') {
                            throw 'Expected decorator function or name of registered decorator function.';
                        }
                    }
                    decorator.call(this, gc, config);
                }
            }

            // Restore `config`
            Object.assign(config, group.configStash);
        }

        // Restore bounds for final column header render.
        // Note that `y` and `height` have been altered from their original values.
        rect.x = bounds.x;
        rect.y = y;
        rect.width = bounds.width;
        config.value = values[g]; // low-order header

        // restore original column cosmetic properties for actual column header
        Object.assign(config, columnConfigStash);
    }

    // Render the actual column header
    paint.call(this, gc, config);

    // Restore to original shape for next render
    if (groupCount) {
        if (new_group) {
            gc.cache.fillStyle = "#AAA"; //config.columnHeaderColor;
            gc.fillRect(bounds.x-1, bounds.y, 1, bounds.y + bounds.height);
        }
        Object.assign(rect, bounds);
    }

    function stash(key) { // iteratee function for iterating over `group.config`
        if (key in config) {
            if (key in group.configStash) {
                config[key] = group.configStash[key];
            } else {
                group.configStash[key] = config[key];
            }
        }
        var property = group.config[key];
        if (key !== 'paintBackground' && typeof property === 'function') {
            property = property.call(this, gc, config);
        }
        group[key] = property;
    }
}

/**
 * @summary Draw vertical gradient behind group label.
 * @desc _Do not call this function directly._
 *
 * Supply a reference to this function in one or both of the following options in your {@link groupedHeader.mixInTo} call:
 * * option.{@link groupedHeader.mixInTo~GroupedHeader#paintBackground|paintBackground}
 * * option.{@link groupedHeader.mixInTo~GroupedHeader#groupConfig|groupConfig} (within an element {@link groupConfigObject} object)
 *
 * @this {GroupHeader}
 * @param {CanvasRenderingContext2D} gc
 * @param {object} config - The `paint` method's `config` object.
 * @memberOf groupedHeader
 */
function decorateBackgroundWithLinearGradient(gc, config) {
    var bounds = config.bounds,
        grad = gc.createLinearGradient(bounds.x, bounds.y, bounds.x, bounds.y + bounds.height);

    (config.gradientStops || this.gradientStops).forEach(function(stop) {
        grad.addColorStop.apply(grad, stop);
    });

    gc.cache.fillStyle = grad;
    gc.fillRect(bounds.x + 2, bounds.y, bounds.width - 3, bounds.height);
}

/**

 * @summary Draw underscore under group label.
 * @desc _Do not call this function directly._
 *
 * Supply a reference to this function in one or both of the following options in your {@link groupedHeader.mixInTo} call:
 * * option.{@link groupedHeader.mixInTo~GroupedHeader#paintBackground|paintBackground}
 * * option.{@link groupedHeader.mixInTo~GroupedHeader#groupConfig|groupConfig} (within an element {@link groupConfigObject} object)
 *
 * @this {GroupHeader}
 * @param {CanvasRenderingContext2D} gc
 * @param {object} config - The `paint` method's `config` object.
 * @memberOf groupedHeader
 */
function decorateBackgroundWithBottomBorder(gc, config) {
    var bounds = config.bounds,
        thickness = 1 || config.thickness ||
            this.groupCount - this.groupIndex; // when `thickness` undefined, higher-order groups get progressively thicker borders

    gc.cache.fillStyle = config.columnHeaderSeparatorColor || "#fff"; // config.color;
    gc.fillRect(bounds.x + 3, bounds.y + bounds.height - thickness, bounds.width - 6, thickness);
}

// regexRGB - parses #rrggbb or rgb(r, g, b) or rgba(r, g, b, a)
var regexRGB = /(^#([0-9a-f]{2,2})([0-9a-f]{2,2})([0-9a-f]{2,2})|rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\))$/i;

function lighterColor(gc, color, factor, newAlpha) {
    var r, g, b, alpha;

    // translate color name to color spec
    gc.fillStyle = color;
    color = gc.fillStyle;
    gc.fillStyle = gc.cache.fillStyle;

    color = color.match(regexRGB);

    alpha = color[8];

    if (alpha) {
        r = parseInt(color[5], 10);
        g = parseInt(color[6], 10);
        b = parseInt(color[7], 10);
    } else {
        r = parseInt(color[2], 16);
        g = parseInt(color[3], 16);
        b = parseInt(color[4], 16);
    }

    r = lighterComponent(r, factor);
    g = lighterComponent(g, factor);
    b = lighterComponent(b, factor);

    if (newAlpha !== undefined) {
        alpha = newAlpha;
    }

    return (
        alpha !== undefined
            ? 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')'
            : '#' + toHex2(r) + toHex2(g) + toHex2(b)
    );
}

function lighterComponent(n, factor) {
    return n + (255 - n) * factor;
}

function toHex2(n) {
    var x = Math.round(n).toString(16);
    if (n < 0x10) { x = '0' + x; }
    return x;
}

module.exports = {
    mixInTo: mixInTo,
    install: mixInTo,
    decorateBackgroundWithBottomBorder: decorateBackgroundWithBottomBorder,
    decorateBackgroundWithLinearGradient: decorateBackgroundWithLinearGradient,
    lighterColor: lighterColor
};

