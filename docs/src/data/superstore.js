import perspective from "@finos/perspective";
import SUPERSTORE_URL from "superstore-arrow/superstore.arrow";

export const SUPERSTORE_TABLE = (async function () {
    const worker = perspective.shared_worker();
    const req = await fetch(SUPERSTORE_URL);
    const arrow = await req.arrayBuffer();
    return await worker.table(arrow.slice());
})();
