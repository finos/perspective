const { getSplitValues } = require("../../../../src/js/tooltip/selectionData");

describe("tooltip selectionData should", () => {
    let settings = null;

    beforeEach(() => {
        settings = {
            crossValues: [],
            splitValues: [],
            mainValues: [{ name: "main-1", type: "integer" }],
            realValues: ["main-1"],
        };
    });

    describe("getSplitValues", () => {
        test("handle empty splitValues array", () => {
            expect(getSplitValues(null, settings)).toEqual([]);
        });

        test("handle data that contains `|` in key property", () => {
            settings.splitValues.push({ name: "split-1", type: "integer" });
            const data = {
                key: "1|2",
            };

            expect(getSplitValues(data, settings)).toEqual([
                { name: "split-1", value: 1 },
            ]);
        });

        test("handle data that does not contain `|` in key property", () => {
            settings.splitValues.push({ name: "split-1", type: "integer" });
            const data = {
                key: "1",
            };

            expect(getSplitValues(data, settings)).toEqual([
                { name: "split-1", value: 1 },
            ]);
        });

        test("handle data that contains a `|` in mainValue property", () => {
            settings.splitValues.push({ name: "split-1", type: "integer" });
            const data = {
                mainValue: "1|2",
            };

            expect(getSplitValues(data, settings)).toEqual([
                { name: "split-1", value: 1 },
            ]);
        });

        test("handle data that does not contain a `|` in mainValue property", () => {
            settings.splitValues.push({ name: "split-1", type: "integer" });
            const data = {
                mainValue: "1",
            };

            expect(getSplitValues(data, settings)).toEqual([
                { name: "split-1", value: 1 },
            ]);
        });

        test("handle data with no key or mainValue property", () => {
            settings.splitValues.push({ name: "split-1", type: "integer" });
            const data = {
                mainValue: "1",
            };

            expect(getSplitValues(data, settings)).toEqual([
                { name: "split-1", value: 1 },
            ]);
        });
    });
});
