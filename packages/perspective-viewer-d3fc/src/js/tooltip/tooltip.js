export function tooltip(container, selection, settings) {
    selection
        .filter(d => d.baseValue !== d.mainValue)
        .on("mouseover", function(data) {
            const tooltipDiv = getTooltipDiv(container);
            const html = generateHtml(data, settings);
            showTooltip(container.node(), this, tooltipDiv, html);
        })
        .on("mouseout", () => {
            const tooltipDiv = getTooltipDiv(container);
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
            .style("opacity", 0);
    }
    return tooltipDiv;
}

function generateHtml(data, settings) {
    const splits = data.key.split("|");
    let html = [];

    // Add group data
    if (settings.crossValues.length) {
        const groups = data.crossValue.split(",");
        html = html.concat(settings.crossValues.map((group, i) => `${group.name}: <b>${groups[i]}</b>`));
    }

    // Add split data
    if (settings.splitValues.length) {
        html = html.concat(settings.splitValues.map((split, i) => `${split.name}: <b>${splits[i]}</b>`));
    }

    // Add value
    html.push(`${splits[splits.length - 1]}: <b>${data.mainValue - data.baseValue}</b>`);

    return html.join("</br>");
}

function showTooltip(containerNode, barNode, tooltipDiv, html) {
    const containerRect = containerNode.getBoundingClientRect();
    const barRect = barNode.getBoundingClientRect();
    const left = barRect.left + barRect.width / 2 - containerRect.left;
    const top = barRect.top - containerRect.top;
    tooltipDiv
        .style("left", `${left}px`)
        .style("top", `${top}px`)
        .html(html)
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
