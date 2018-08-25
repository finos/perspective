module.exports = function(config) {
  config.set({
    frameworks: ["jasmine", "karma-typescript"],
    files: ["src/**/*.ts", "src/**/*.tsx"],
    preprocessors: {
      "**/*.ts": "karma-typescript",
      "**/*.tsx": "karma-typescript"
    },
    reporters: ["progress", "karma-typescript"],
    browsers: ["Chrome"],
    karmaTypescriptConfig: {
      bundlerOptions: {
        exclude: ["vertx"],
        transforms: [
            require("karma-typescript-es6-transform")()
        ]
      }
    },
    compilerOptions: {
      lib: ["dom", "es2015", "es2016", "es2017"]
    }
  });
};
