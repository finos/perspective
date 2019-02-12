export function tooltip(selection, settings) {
    selection
        .filter(d => d.baseValue !== d.mainValue)
        .on("mouseover", function(data) {
            console.log(data);
            console.log(settings);
            const html = generateHtml(data, settings);
            console.log(html);
        })
        .on("mouseout", () => console.log("leave"));
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
