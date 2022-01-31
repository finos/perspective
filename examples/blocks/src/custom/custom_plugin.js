const states = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    "District of Columbia": "DC",
    Delaware: "DE",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
};

function hue(value, min, max) {
    const norm =
        "0" +
        Math.abs(
            Math.round(
                255 * (Math.min(Math.max(value, min), max) / (max - min))
            )
        ).toString(16);
    return norm.slice(norm.length - 2, norm.length);
}

function getBase64Image(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL("image/png");
}

function make_led_cell(td, metadata) {
    if (metadata.value < 0) {
        const fg = hue(Math.min(metadata.value, -50), -100, 0);
        td.style.color = `#${fg}${fg}${fg}`;
        td.style.background = `radial-gradient(#${hue(
            Math.min(metadata.value, -20),
            -100,
            0
        )}3136, #243136`;
        td.style.border = `1px solid #${hue(
            Math.min(metadata.value / 3, -20),
            -100,
            0
        )}3136`;
    } else if (metadata.value > 0) {
        const fg = hue(Math.max(metadata.value, 50), 0, 100);
        td.style.color = `#${fg}${fg}${fg}`;
        td.style.background = `radial-gradient(#24${hue(
            Math.max(20, metadata.value),
            0,
            100
        )}36, #243136`;
        td.style.border = `1px solid #24${hue(
            Math.max(metadata.value / 3, 20),
            0,
            100
        )}36`;
    } else {
        td.style.color = "#000";
        td.style.background = "";
        td.style.border = ``;
    }
}

function make_flag(td, metadata, cache, clean_name) {
    td.style.background = "";
    td.style.border = ``;
    if (cache[clean_name] && cache[clean_name].length > 0) {
        const name = metadata.value;
        td.textContent = "";
        td.appendChild(cache[name].pop());
    } else {
        const name = metadata.value;
        const span = document.createElement("span");
        const img = document.createElement("img");
        img.onload = () => {
            img.onload = undefined;
            const data = getBase64Image(img);
            img.src = data;
        };
        img.setAttribute("crossorigin", "anonymous");
        img.setAttribute(
            "src",
            `http://perspective.finos.org/img/flags/${states[
                clean_name
            ].toLowerCase()}.png`
        );

        td.textContent = "";
        span.appendChild(img);
        td.appendChild(span);
        CACHE[name] = CACHE[name] || [];
        CACHE[name].push(img);
    }
}

function make_clear(td) {
    td.style.border = ``;
    td.style.background = "";
    td.style.color = "";
}

const CACHE = {};
function clone_img_cache() {
    return Object.keys(CACHE).reduce((obj, key) => {
        obj[key] = CACHE[key].slice();
        return obj;
    }, {});
}

class CustomDatagridPlugin extends customElements.get(
    "perspective-viewer-datagrid"
) {
    get name() {
        return "Custom Datagrid";
    }

    async styleListener() {
        const viewer = this.parentElement;
        const datagrid = this.datagrid;
        if (this._dirty) {
            await this.refresh_cache();
        }

        const cache = clone_img_cache();
        for (const td of datagrid.querySelectorAll("td")) {
            const metadata = datagrid.getMeta(td);

            let type;
            if (metadata.x >= 0) {
                const column_path = this._column_paths[metadata.x];
                const column_path_parts = column_path.split("|");
                type =
                    this._schema[
                        column_path_parts[column_path_parts.length - 1]
                    ];
            } else {
                const column_path = this._group_by[metadata.row_header_x - 1];
                type = this._table_schema[column_path];
            }
            const clean_name =
                metadata.value && metadata.value.trim && metadata.value.trim();
            td.classList.toggle(
                "orbitron",
                type === "integer" || type === "float"
            );
            if (type === "float") {
                make_led_cell(td, metadata);
            } else if (clean_name in states) {
                make_flag(td, metadata, cache, clean_name);
            } else {
                make_clear(td);
            }
        }
    }

    async refresh_cache() {
        const view = this._view;
        this._column_paths = await view.column_paths();
        this._group_by = await view.get_config()["group_by"];
        this._schema = await view.schema();
        this._dirty = false;
    }

    async activate(view) {
        await super.activate(view);
        this._view = view;
        this._dirty = true;
        if (!this._custom_initialized) {
            const viewer = this.parentElement;
            const datagrid = this.datagrid;
            this._max = -Infinity;
            await this.refresh_cache(view);
            const table = await viewer.getTable(true);
            this._table_schema = await table.schema();
            viewer.addEventListener("perspective-config-update", async () => {
                this._max = -Infinity;
                this._dirty = true;
            });

            this._custom_initialized = true;
            datagrid.addStyleListener(this.styleListener.bind(this));
        }
    }
}

customElements.define(
    "perspective-viewer-custom-datagrid",
    CustomDatagridPlugin
);

customElements
    .get("perspective-viewer")
    .registerPlugin("perspective-viewer-custom-datagrid");
