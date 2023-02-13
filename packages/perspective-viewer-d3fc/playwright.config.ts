/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { defineConfig } from "@playwright/test";
const { base_config } = require("@finos/perspective-test");

export default defineConfig({
    ...base_config,
    testDir: "./test/js/integration",
    use: {
        ...base_config.use,
        baseURL: "http://localhost:6598/",
    },
    webServer: {
        command: "npm run testserver 6598",
        port: 6598,
    },
});
