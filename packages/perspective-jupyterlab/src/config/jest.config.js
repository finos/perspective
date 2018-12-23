module.exports = {
    verbose: true,
    transform: {"^.+\\.(ts|tsx)$": "ts-jest", ".+\\.(css|styl|less|sass|scss)$": "jest-transform-css"},
    cache: false,
    testMatch: ["<rootDir>/test/ts/*.test.ts"],
    testPathIgnorePatterns: ["<rootDir>/dist", "<rootDir>/test/js"],
    transformIgnorePatterns: ["node_modules"],
    moduleNameMapper: {
        "\\.(css|less)$": "<rootDir>/test/js/styleMock.js",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|wasm|wasm.worker.js)$": "<rootDir>/test/js/fileMock.js"
    },
    preset: "ts-jest"
};
