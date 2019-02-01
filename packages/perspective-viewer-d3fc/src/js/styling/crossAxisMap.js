import {LABEL_TICK_PADDING, STANDARD_TICK_LENGTH, HORIZONTAL_STANDARD_TICK_LENGTH, HORIZONTAL_LABEL_TICK_PADDING} from "./chartStyling";
import {isNullOrUndefined} from "util";

export class CrossAxisMap {
    constructor(crossLabels, dataset) {
        this._map = this.generateMap(crossLabels, dataset);
    }

    get map() {
        return this._map;
    }

    generateMap(crossLabels, dataset) {
        let levelMap = [];

        for (let levelIndex = 0; levelIndex < crossLabels.length; levelIndex++) {
            let parentLevel = levelIndex === 0 ? null : levelMap[levelIndex - 1];
            let level = new Level(crossLabels[levelIndex], parentLevel, levelIndex);

            let workingNode;
            dataset.forEach((dataPoint, dpIndex) => {
                let dpLevelVal = dataPoint.crossValue[levelIndex];
                if (dpIndex === 0) {
                    let parentNode = levelIndex === 0 ? null : parentLevel.nodes[0];
                    workingNode = new LevelNode(dpLevelVal, parentNode, levelIndex);
                    workingNode.addTick(dpIndex);
                    return;
                }

                if (workingNode.name === dpLevelVal) {
                    if (workingNode.canShareParentage(dpIndex)) {
                        workingNode.addTick(dpIndex);
                        return;
                    }
                }

                level.addNode(workingNode);
                let parentNode = levelIndex === 0 ? null : parentLevel.nodeWithTick(dpIndex);
                workingNode = new LevelNode(dpLevelVal, parentNode, levelIndex);
                workingNode.addTick(dpIndex);
                return;
            });

            level.addNode(workingNode);
            levelMap.push(level);
        }

        console.log("levelMap: ", levelMap);
        return levelMap;
    }

    calculateLabelPositions(tickList, horizontal) {
        let labelsMappedToTicks = this._map
            .map(level => level.nodes.map(node => node.calculateLabelPosition(tickList, this._map.length, horizontal)))
            .flat()
            .filter(mapping => !isNullOrUndefined(mapping));

        return labelsMappedToTicks;
    }
}

class Level {
    constructor(name, parentLevel, levelIndex) {
        this._name = name;
        this._parentLevel = parentLevel;
        this._levelIndex = levelIndex;
        this._levelNodes = [];
    }

    get name() {
        return this._name;
    }

    get nodes() {
        return this._levelNodes;
    }

    get parentLevel() {
        return this._parentLevel;
    }

    get levelIndex() {
        return this._levelIndex;
    }

    isTopLevel() {
        return this._parentLevel === null;
    }

    addNode(node) {
        this._levelNodes.push(node);
    }

    nodeWithTick(tickIndex) {
        return this._levelNodes.filter(node => node.nodeContainsTick(tickIndex))[0];
    }
}

class LevelNode {
    constructor(name, parentNode, levelIndex) {
        this._name = name;
        this._parentNode = parentNode;
        this._levelIndex = levelIndex;
        this._ticks = [];
    }

    get name() {
        return this._name;
    }

    get parentNode() {
        return this._parentNode;
    }

    get ticks() {
        return this._ticks;
    }

    isTopLevel() {
        return this._parentNode === null;
    }

    addTick(tickIndex) {
        this._ticks.push(tickIndex);
    }

    nodeContainsTick(tickIndex) {
        return this._ticks.includes(tickIndex);
    }

    canShareParentage(proposedChildTickIndex) {
        return this.isTopLevel() || this._parentNode.nodeContainsTick(proposedChildTickIndex);
    }

    calculateLabelPosition(tickList, totalLevels, horizontal) {
        let middleTickIndex = Math.round((this._ticks.length + 1) / 2) - 1;
        let middleTick = this._ticks[middleTickIndex];

        if (this._levelIndex === totalLevels - 1) {
            return;
        }

        let levelDepth = totalLevels - this._levelIndex;

        // eslint-disable-next-line prettier/prettier
        let result = this._ticks.length % 2 !== 1
                ? placeLabelOnTick(middleTick, tickList, this._name, levelDepth, horizontal)
                : placeLabelInSpaceBesideTick(middleTick, tickList, this._name, levelDepth, horizontal);

        return result;
    }
}

// TODO: only handles horizontal for now
function placeLabelOnTick(tickIndex, tickList, labelText, labelDepth, horizontal) {
    let tickElement = tickList[tickIndex];
    let tickStroke = tickElement.firstChild;

    // eslint-disable-next-line prettier/prettier
    let [horizontalOffset, verticalOffset] = horizontal 
        ? calculateXGraphLabelOffsets(tickStroke, labelDepth) 
        : calculateYGraphLabelOffsets(tickStroke, labelDepth);

    return cloneThenModifyLabel(tickElement, horizontalOffset, verticalOffset, labelText);
}

function placeLabelInSpaceBesideTick(tickIndex, tickList, labelText, labelDepth, horizontal) {
    let tickElement = tickList[tickIndex];
    let tickBaseText = tickElement.childNodes[1];

    // eslint-disable-next-line prettier/prettier
    let [horizontalOffset, verticalOffset] = horizontal 
        ? calculateXGraphLabelOffsets(tickBaseText, labelDepth) 
        : calculateYGraphLabelOffsets(tickBaseText, labelDepth);

    return cloneThenModifyLabel(tickElement, horizontalOffset, verticalOffset, labelText);
}

function calculateYGraphLabelOffsets(baseElement, labelDepth) {
    let baseElementTransform = baseElement.attributes.transform.value;

    let horizontalOffset = baseElementTransform.substring(baseElementTransform.lastIndexOf("(") + 1, baseElementTransform.lastIndexOf(","));
    let verticalDepthMultiplied = STANDARD_TICK_LENGTH * labelDepth;
    let verticalOffset = verticalDepthMultiplied + LABEL_TICK_PADDING;

    return [horizontalOffset, verticalOffset];
}

function calculateXGraphLabelOffsets(baseElement, labelDepth) {
    let baseElementTransform = baseElement.attributes.transform.value;

    let verticalOffset = baseElementTransform.substring(baseElementTransform.lastIndexOf(",") + 1, baseElementTransform.lastIndexOf(")"));
    let horizontalDepthMultiplied = HORIZONTAL_STANDARD_TICK_LENGTH * labelDepth;
    let horizontalOffset = horizontalDepthMultiplied + HORIZONTAL_LABEL_TICK_PADDING;

    return [horizontalOffset, verticalOffset];
}

function cloneThenModifyLabel(tickElement, horizontalOffset, verticalOffset, labelText) {
    let clone = tickElement.childNodes[1].cloneNode(true);
    clone.setAttribute("transform", `translate(${horizontalOffset}, ${verticalOffset})`);
    clone.textContent = labelText;
    return {tick: tickElement, label: clone};
}
