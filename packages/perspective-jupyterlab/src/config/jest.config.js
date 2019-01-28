/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

module.exports = {
    verbose: true,
    transform: {"^.+\\.(ts|tsx)$": "ts-jest", ".+\\.(css|styl|less|sass|scss)$": "jest-transform-css"},
    cache: false,
    testMatch: ["<rootDir>/test/ts/*.test.ts"],
    testPathIgnorePatterns: ["<rootDir>/build", "<rootDir>/test/js"],
    transformIgnorePatterns: ["node_modules"],
    moduleNameMapper: {
        "\\.(css|less)$": "<rootDir>/test/js/styleMock.js",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|wasm|wasm.worker.js)$": "<rootDir>/test/js/fileMock.js"
    },
    preset: "ts-jest"
};
