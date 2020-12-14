function get(url) {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "json";
        xhr.onload = () => resolve(xhr.response);
        xhr.send(null);
    });
}

async function get_feed(feedname, callback) {
    const url = `https://gbfs.citibikenyc.com/gbfs/en/${feedname}.json`;
    const {
        data: {stations},
        ttl
    } = await get(url);
    if (typeof callback === "function") {
        callback(stations);
        setTimeout(() => get_feed(feedname, callback), ttl * 1000);
    } else {
        return stations;
    }
}

const worker = perspective.worker();

async function get_schema(feed) {
    const table = await worker.table(feed);
    const schema = await table.schema();
    table.delete();
    return schema;
}

async function merge_schemas(feeds) {
    const schemas = await Promise.all(feeds.map(get_schema));
    return Object.assign({}, ...schemas);
}

async function main() {
    const feednames = ["station_status", "station_information"];
    const feeds = await Promise.all(feednames.map(get_feed));
    const schema = await merge_schemas(feeds);

    const table = await worker.table(schema, {index: "station_id"});
    for (let feed of feeds) {
        table.update(feed);
    }

    get_feed("station_status", table.update);

    const viewers = document.getElementsByTagName("perspective-viewer");
    for (viewer of viewers) {
        viewer.load(table);
    }

    document.getElementById("view1")._toggle_config();
}

main();
