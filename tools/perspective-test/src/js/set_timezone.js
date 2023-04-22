// KEEP ME, used in perspective

const JSDOMEnvironment = require("jest-environment-jsdom");

module.exports = class TimezoneAwareJSDOMEnvironment extends JSDOMEnvironment {
    constructor(config, context) {
        if (context.testPath.endsWith("timezone.spec.js")) {
            process.env.TZ = "America/New_York";
        } else {
            process.env.TZ = "UTC";
        }

        super(config);
    }
};
