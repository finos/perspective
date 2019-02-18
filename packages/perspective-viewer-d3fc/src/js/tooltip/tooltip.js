import {select} from "d3";
import {getChartElement} from "../plugin/root";
import {getOrCreateElement} from "../utils/utils";
import tooltipTemplate from "../../html/tooltip.html";

export function tooltip(selection, settings) {
    const node = selection.node();
    if (!node) return;

    const container = select(getChartElement(node).getContainer());
    const tooltipDiv = getTooltipDiv(container);
    selection
        //        .filter(d => d.baseValue !== d.mainValue)
        .on("mouseover", function(data) {
            generateHtml(tooltipDiv, data, settings);
            showTooltip(container.node(), this, tooltipDiv);
            select(this).style("opacity", "0.7");
        })
        .on("mouseout", function() {
            hideTooltip(tooltipDiv);
            select(this).style("opacity", "1");
        });
}

function getTooltipDiv(container) {
    return getOrCreateElement(container, "div.tooltip", () =>
        container
            .append("div")
            .attr("class", "tooltip")
            .style("z-index", 3)
            .style("opacity", 0)
            .html(tooltipTemplate)
    );
}

function generateHtml(tooltipDiv, data, settings) {
    // Add group data
    if (settings.crossValues.length) {
        const groups = data.crossValue.split ? data.crossValue.split("|") : [data.crossValue];
        tooltipDiv
            .select("#cross-values")
            .selectAll("li")
            .data(groups)
            .join("li")
            .each(eachValue(settings.crossValues));
    }

    const splitValues = getSplitValues(settings, data);
    // Add data value
    tooltipDiv
        .select("#split-values")
        .selectAll("li")
        .data(splitValues.values)
        .join("li")
        .each(eachValue(splitValues.labels));

    const dataValues = getDataValues(settings, data);
    // Add data value
    tooltipDiv
        .select("#data-values")
        .selectAll("li")
        .data(dataValues.values)
        .join("li")
        .each(eachValue(dataValues.labels));
}

function getSplitValues(settings, data) {
    const splits = data.key ? data.key.split("|") : [];

    return {
        values: data.mainValues ? splits : splits.slice(0, -1),
        labels: settings.splitValues
    };
}

function getDataValues(settings, data) {
    if (data.mainValues) {
        return {
            values: data.mainValues,
            labels: settings.mainValues
        };
    } else {
        const splits = data.key.split("|");
        return {
            values: [data.mainValue - data.baseValue],
            labels: [{name: splits[splits.length - 1]}]
        };
    }
}

function eachValue(list) {
    return function(d, i) {
        select(this)
            .text(`${list[i].name}: `)
            .append("b")
            .text(formatNumber(d));
    };
}

function formatNumber(value) {
    return value.toLocaleString(undefined, {style: "decimal"});
}

function showTooltip(containerNode, barNode, tooltipDiv) {
    const containerRect = containerNode.getBoundingClientRect();
    const barRect = barNode.getBoundingClientRect();
    const left = barRect.left + barRect.width / 2 - containerRect.left;
    const top = barRect.top - containerRect.top;
    tooltipDiv
        .style("left", `${left}px`)
        .style("top", `${top}px`)
        .transition()
        .duration(200)
        .style("opacity", 0.9);
}

function hideTooltip(tooltipDiv) {
    tooltipDiv
        .transition()
        .duration(500)
        .style("opacity", 0);
}
