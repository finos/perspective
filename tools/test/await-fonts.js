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

/// Block until every `--preload-fonts` face the page's `<perspective-viewer>`
/// declares has loaded, so no measurement a test takes can race a font —
/// `__TEST_PERSPECTIVE_READY__` must not be set before this resolves. The
/// viewer's own `FontLoader` gate is fail-open by design (a slow font yields
/// a fallback-metric render rather than a blank component), so determinism
/// is the HARNESS's responsibility. A font the page declares but never
/// REGISTERS (no `@font-face` stylesheet — several `demo.css` pages do this)
/// can never load, and a face whose fetch FAILS rejects `load()` — both
/// degrade to a warning after `timeout`, which is still deterministic: that
/// page renders fallback metrics on every run.
export async function awaitPreloadFonts(timeout = 10_000) {
    const viewer = document.querySelector("perspective-viewer");
    if (!viewer) {
        return;
    }

    const decl = getComputedStyle(viewer)
        .getPropertyValue("--preload-fonts")
        .trim()
        .replace(/^"|"$/g, "");

    const specs = decl
        .split(";")
        .map((font) => font.split(":"))
        .filter(([family, weights]) => family && weights)
        .flatMap(([family, weights]) =>
            weights
                .split(",")
                .map((weight) => `${weight.trim()} 12px "${family.trim()}"`),
        );

    const deadline = Date.now() + timeout;
    for (const spec of specs) {
        for (;;) {
            try {
                if ((await document.fonts.load(spec, "ABCDΔ")).length > 0) {
                    break;
                }
            } catch (e) {
                console.warn(`Preload font "${spec}" failed to load`, e);
                break;
            }

            if (Date.now() > deadline) {
                console.warn(`Preload font "${spec}" never registered`);
                break;
            }

            await new Promise((x) => setTimeout(x, 10));
        }
    }
}
