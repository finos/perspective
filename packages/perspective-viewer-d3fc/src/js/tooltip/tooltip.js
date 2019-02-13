import {select} from "d3";
import {getChartElement} from "../plugin/root";
import tooltipTemplate from "../../html/tooltip.html";

export function tooltip(selection, settings) {
    const container = select(getChartElement(selection.node()).getContainer());
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
    let tooltipDiv = container.select("div.tooltip");
    if (tooltipDiv.size() === 0) {
        tooltipDiv = container
            .append("div")
            .attr("class", "tooltip")
            .style("z-index", 3)
            .style("opacity", 0)
            .html(tooltipTemplate);
    }
    return tooltipDiv;
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
            .each(function(d, i) {
                select(this)
                    .text(`${settings.crossValues[i].name}: `)
                    .append("b")
                    .text(d);
            });
    }

    // Add split data
    if (settings.splitValues.length) {
        tooltipDiv
            .select("#split-values")
            .selectAll("li")
            .data(splits.slice(0, -1))
            .join("li")
            .each(function(d, i) {
                select(this)
                    .text(`${settings.splitValues[i].name}: `)
                    .append("b")
                    .text(d);
            });
    }

    // Add data value
    tooltipDiv
        .select("#data-value")
        .text(`${splits[splits.length - 1]}: `)
        .append("b")
        .text(data.mainValue - data.baseValue);
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
