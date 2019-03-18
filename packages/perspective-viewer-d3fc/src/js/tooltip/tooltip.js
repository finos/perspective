import {select} from "d3";
import {getChartElement} from "../plugin/root";
import {getOrCreateElement} from "../utils/utils";
import tooltipTemplate from "../../html/tooltip.html";
import {generateHtml} from "./generateHTML";

export const tooltip = () => {
    let alwaysShow = false;
    let tooltipDiv = null;
    let settings = null;

    const _tooltip = selection => {
        const node = selection.node();

        if (!node || !node.isConnected) {
            hideTooltip(tooltipDiv);
            return;
        }

        const container = select(getChartElement(node).getContainer());
        tooltipDiv = getTooltipDiv(container);

        const showTip = (data, i, nodes) => {
            generateHtml(tooltipDiv, data, settings);
            showTooltip(container.node(), nodes[i], tooltipDiv);
            select(nodes[i]).style("opacity", "0.7");
        };
        const hideTip = (data, i, nodes) => {
            hideTooltip(tooltipDiv);
            if (nodes) select(nodes[i]).style("opacity", "1");
        };

        if (alwaysShow) {
            selection.each(showTip);
        } else {
            selection.on("mouseover", showTip).on("mouseout", hideTip);
        }
    };

    _tooltip.alwaysShow = (...args) => {
        if (!args.length) {
            return alwaysShow;
        }
        alwaysShow = args[0];
        return _tooltip;
    };

    _tooltip.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
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
    if (tooltipDiv) {
        tooltipDiv
            .transition()
            .duration(500)
            .style("opacity", 0);
    }
}
