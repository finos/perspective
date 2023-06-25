/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { default as sh, getarg, python_version } from "./sh_perspective.mjs";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

let PYTHON = python_version();
const COVERAGE = getarg("--coverage");
const VERBOSE = getarg("--debug");
const IS_DOCKER = process.env.PSP_DOCKER;
const PYTEST_FLAGS = sh`--junitxml=python_junit.xml --cov-report=xml --cov-branch --cov=perspective --disable-pytest-warnings`;

let python_path;
if (IS_DOCKER) {
    python_path = "python/perspective";
} else {
    // When running locally, tests need to run in UTC and not the machine's
    // local timezone.
    process.env.TZ = "UTC";
    python_path = sh.path`${__dirname}/../../python/perspective`;
}

/**
 * Run `pytest` for client mode PerspectiveWidget, which need to be on a
 * separate runtime from the other Python tests.
 */
const pytest_client_mode = (IS_DOCKER) => {
    if (IS_DOCKER) {
        let cmd = sh`cd python/perspective`;
        let verbose = VERBOSE ? sh`-vv --full-trace` : sh``;
        cmd.sh`${sh(PYTHON)} -m pytest \
            ${verbose} --noconftest perspective/tests/client_mode`;

        const env = { TZ: "UTC" };
        return sh.docker`${cmd}`.env(env);
    } else {
        return sh`cd python/perspective && ${sh(PYTHON)} -m pytest \
            ${VERBOSE ? sh`-vv --full-trace` : sh``} --noconftest
            perspective/tests/client_mode ${PYTEST_FLAGS}`.log();
    }
};

/**
 * Run pytest for single-threaded tests
 */
const pytest_single_threaded = (IS_DOCKER) => {
    if (IS_DOCKER) {
        return sh.docker`cd \
            python/perspective && TZ=UTC ${sh(PYTHON)} -m pytest \
            ${VERBOSE ? sh`-vv --full-trace` : sh``} --noconftest \
            perspective/tests/single_threaded`;
    } else {
        return sh`cd ${python_path}`.sh`${sh(PYTHON)} -m pytest \
            ${VERBOSE ? sh`-vv --full-trace` : sh``} --noconftest
            --disable-pytest-warnings
            perspective/tests/single_threaded`.log();
    }
};

/**
 * Run `pytest` for the `perspective-python` library.
 */
const pytest = (IS_DOCKER) => {
    if (IS_DOCKER) {
        return sh.docker`cd \
            python/perspective && TZ=UTC ${sh(PYTHON)} -m pytest \
            ${VERBOSE ? sh`-vv --full-trace` : sh``} perspective \
            --ignore=perspective/tests/client_mode \
            --ignore=perspective/tests/single_threaded \
            ${PYTEST_FLAGS}`;
    } else {
        return sh`cd ${python_path} && ${sh(PYTHON)} -m pytest \
            ${VERBOSE ? sh`-vv --full-trace` : sh``} perspective \
            --ignore=perspective/tests/client_mode \
            --ignore=perspective/tests/single_threaded \
            ${PYTEST_FLAGS}`.env({ TZ: "UTC" });
    }
};

// Check that the `PYTHON` command is valid, else default to `python`.
try {
    sh`${sh(PYTHON)} --version`.runSync();
} catch (e) {
    console.warn(`\`${PYTHON}\` not found - using \`python\` instead.`);
    PYTHON = "python";
}

pytest_client_mode(IS_DOCKER).runSync();
pytest_single_threaded(IS_DOCKER).runSync();
pytest(IS_DOCKER).runSync();
