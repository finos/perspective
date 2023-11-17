// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

class UploadDialog extends HTMLElement {
    constructor() {
        super();
        this.addEventListener("click", (event) => {
            if (event.target === this && !this.classList.contains("loading")) {
                this.parentElement.removeChild(this);
            }
        });
    }

    /// TODO this doesn't account for the quantity field
    async load_tappedout_id(name) {
        const req = await fetch("https://tappedout.net/api/deck/widget/", {
            method: "post",
            body: `board=&side=&c=type&deck=${name}&cols=6`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const { board } = await req.json();
        const parser = new DOMParser();
        const dom = parser.parseFromString(board, "text/html");
        let filter = [];
        for (const link of dom.querySelectorAll(".card-link")) {
            // const qty = parseInt(link.parentElement.parentElement.childNodes[0].nodeValue);
            filter.push(link.textContent);
        }

        this.dispatchEvent(
            new CustomEvent("upload-event", { detail: { name, filter } })
        );
    }

    connectedCallback() {
        if (this.innerHTML.trim().length !== 0) {
            return;
        }

        this.innerHTML = `
            <div id="drop-area">
                <form class="my-form">
                    <p>Import via deck name from</p>
                    <a target="_blank" href="https://tappedout.net/mtg-decks/">
                        <code style="font-size:16px">https://tappedout.net/mtg-decks/</code>
                    </a>
                    <input list="decks" type="text" id="textElem" placeholder="Deck List Name"></input>
                    <button>Run</button>
                    <datalist id="decks">
                        <option value="seasons-in-the-abyss-67">
                        <option value="mind-flayarrrss-upgrade">
                        <option value="wort-the-worthmother-budget-max-58">
                    </datalist>
                </form>
            </div>`;

        this.querySelector(".my-form").addEventListener("submit", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const input = this.querySelector("#textElem");
            const name = input.value.toString().trim();
            window.history.replaceState(null, null, `?${name}`);
            this.load_tappedout_id(name);
        });
    }
}

window.customElements.define("upload-dialog", UploadDialog);
