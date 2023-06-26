import { worker } from "@finos/perspective";
import fs from "fs";
import { getarg } from "./script_utils.js";

const IS_GAUSSIAN = getarg("--gaussian");

const SAMPLE_COUNT = getarg("--count") || 200_000;

const OUTPUT_FILE = getarg("--output") || "examples/blocks/src/gpu/test.arrow";

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
    let u = 1 - Math.random(); // Converting [0,1) to (0,1]
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

async function main() {
    let genData = [];

    console.log(`samples: ${SAMPLE_COUNT}`);
    console.log("distribution: ", IS_GAUSSIAN ? "gaussian" : "normal");

    if (IS_GAUSSIAN) {
        // gaussian
        for (let i = 0; i < SAMPLE_COUNT; i++) {
            genData.push({
                col1: gaussianRandom(0.5, 0.1),
                col2: 10 * gaussianRandom(0.5, 0.15),
            });
        }
    } else {
      // normal / uniform / linear
      for (let i = 0; i < SAMPLE_COUNT; i++) {
          genData.push({
              col1: Math.random(),
              col2: Math.round(100 * Math.random()),
          });
      }

    }

    const w = worker();
    const table = await w.table(genData);

    // save the table as an arrow file
    const view = await table.view();
    const arrow = await view.to_arrow();

    fs.writeFileSync(OUTPUT_FILE, Buffer.from(arrow));
}

main().then(() => {
    console.log("complete");
});
