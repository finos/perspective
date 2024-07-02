import perspective, { JsTable } from "@finos/perspective";

import {
    Type,
    command,
    option,
    positional,
    restPositionals,
    run,
    string,
} from "cmd-ts";
import fs from "node:fs";

const app = command({
    name: "merge_arrows",
    args: {
        arrows: restPositionals({
            type: string,
            description: "The arrows to merge",
            displayName: "arrows",
        }),
        output: option({
            type: string,
            long: "output",
            description: "The combined arrow file",
            short: "o",
            defaultValue: () => "results.arrow",
        }),
    },
    handler: () => {},
});
type FirstArgType<T> = T extends (arg1: infer U, ...args: any[]) => any
    ? U
    : never;
type AppOutput = FirstArgType<typeof app["handler"]>;

async function main({ arrows, output }: AppOutput) {
    let table: JsTable | undefined;
    for (const arrow of arrows) {
        const file = fs.readFileSync(arrow);
        if (table === undefined) {
            table = await perspective.table(file.buffer);
        } else {
            await table.update(file.buffer);
        }
    }
    const view = await table?.view();

    if (view) {
        fs.writeFileSync(output, new Uint8Array(await view.to_arrow()));
    }
}
app.handler = main;

run(app, process.argv.slice(2));
