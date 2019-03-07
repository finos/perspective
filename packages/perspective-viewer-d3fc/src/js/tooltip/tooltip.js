import {select} from "d3";
import {getChartElement} from "../plugin/root";
import {getOrCreateElement} from "../utils/utils";
import tooltipTemplate from "../../html/tooltip.html";
import {generateHtmlDefault} from "./generateHTML";

export const tooltip = () => {
    let generateHtml = generateHtmlDefault;

    const _tooltip = (selection, settings) => {
        const node = selection.node();

        if (!node || !node.isConnected) return;

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
    };

    _tooltip.generateHtml = (...args) => {
        if (!args.length) {
            return generateHtml;
        }
        generateHtml = args[0];
        return _tooltip;
    };

    return _tooltip;
};

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

    shiftIfOverflowingChartArea(tooltipDiv, containerRect, left, top);
}

function shiftIfOverflowingChartArea(tooltipDiv, containerRect, left, top) {
    const tooltipDivRect = tooltipDiv.node().getBoundingClientRect();

    if (containerRect.right < tooltipDivRect.right) {
        const leftAdjust = tooltipDivRect.right - containerRect.right;
        tooltipDiv.style("left", `${left - leftAdjust}px`);
    }

    if (containerRect.bottom < tooltipDivRect.bottom) {
        const topAdjust = tooltipDivRect.bottom - containerRect.bottom;
        tooltipDiv.style("top", `${top - topAdjust}px`);
    }
}

function hideTooltip(tooltipDiv) {
    tooltipDiv
        .transition()
        .duration(500)
        .style("opacity", 0);
}
