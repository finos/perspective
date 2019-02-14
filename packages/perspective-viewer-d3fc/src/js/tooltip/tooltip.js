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
        .filter(d => d.baseValue !== d.mainValue)
        .on("mouseover", function(data) {
            generateHtml(tooltipDiv, data, settings);
            showTooltip(container.node(), this, tooltipDiv);
        })
        .on("mouseout", function() {
            hideTooltip(tooltipDiv);
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
    const splits = data.key.split("|");

    // Add group data
    if (settings.crossValues.length) {
        const groups = data.crossValue.split(",");
        tooltipDiv
            .select("#cross-values")
            .selectAll("li")
            .data(groups)
            .join("li")
            .each(eachValue(settings.crossValues));
    }

    // Add split data
    if (settings.splitValues.length) {
        tooltipDiv
            .select("#split-values")
            .selectAll("li")
            .data(splits.slice(0, -1))
            .join("li")
            .each(eachValue(settings.splitValues));
    }

    // Add data value
    tooltipDiv
        .select("#data-value")
        .text(`${splits[splits.length - 1]}: `)
        .append("b")
        .text(data.mainValue - data.baseValue);

    function eachValue(list) {
        return function(d, i) {
            select(this)
                .text(`${list[i].name}: `)
                .append("b")
                .text(d);
        };
    }
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
