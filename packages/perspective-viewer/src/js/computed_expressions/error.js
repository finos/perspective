/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const token_name_to_display_name = {
    columnName: "column name",
    leftParen: "(",
    rightParen: ")",
    add: "+",
    subtract: "-",
    multiply: "*",
    divide: "/",
    percent_of: "%"
};

const actual_token_to_string = token => {
    let actual;
    if (Array.isArray(token)) {
        actual = token
            .filter(x => x.tokenType.name !== "EOF")
            .map(x => {
                if (x.payload) {
                    return x.payload;
                } else {
                    return x.image;
                }
            });
    } else {
        actual = token.payload ? token.payload : token.image;
    }

    if (!actual || actual.length === 0) {
        actual = "EOF";
    }

    return actual;
};

/**
 * A custom error message provider for the Lexer.
 */
export const PerspectiveLexerErrorMessage = {
    /**
     * Builds an error message to be displayed when the Lexer finds an
     * unexpected character that cannot be matched.
     *
     * @param {*} fullText
     * @param {*} startOffset
     * @param {*} length
     * @param {*} line
     * @param {*} column
     */
    buildUnexpectedCharactersMessage: (fullText, startOffset, length, line, column) => {
        return `Ln ${line}, Col ${column}: Unexpected input \`${fullText}\` at character ${startOffset}`;
    }
};

export const PerspectiveParserErrorMessage = {
    /**
     * Build an error message for when the parser is missing a mandatory token
     * in a repetition, i.e. `pow2` is a function name, but it requires a `(`
     * or column name to be syntactically correct.
     */
    buildEarlyExitMessage: options => {
        let actual = actual_token_to_string(options.actual);

        // A 2-dimensional array of expected paths
        const expected_path_names = options.expectedIterationPaths.map(expected => {
            let path = [];
            expected.map(x => {
                const name = " - " + token_name_to_display_name[x.name] ? token_name_to_display_name[x.name] : x.name;
                path.push(name);
            });
            return path.join(", ");
        });
        return `Unexpected token: \`${actual}\`\n\nExpected one of the following tokens: \n ${expected_path_names.join("\n")}`;
    },

    /**
     * Build an error message for when a token is mismatched, i.e. an opening
     * parenthesis without a matching closing parenthesis.
     */
    buildMismatchTokenMessage: options => {
        let actual = actual_token_to_string(options.actual);

        let expected = options.expected.name;

        if (token_name_to_display_name[expected]) {
            expected = token_name_to_display_name[expected];
        }

        let message = `Expecting token \`${expected}\`, but found \`${actual}\`.`;

        if (expected === ")" || expected === "rightParen") {
            message += "\n\nMake sure all left parentheses are matched\nwith right parentheses.";
        }

        return message;
    },

    /**
     * Build an error message for when a token does not fit into the grammar,
     * i.e. if the expression does not begin with a column name, `(`, or
     * any of the functional operators.
     */
    buildNoViableAltMessage: options => {
        let actual = actual_token_to_string(options.actual);
        let message = `Unexpected token: \`${actual}\`.`;

        if (options.ruleName === "Expression") {
            message += `\n\nExpected a column name, \`(\`,\nor functional operator such as:\n- \`sqrt\`\n- \`uppercase\`\n- \`day_of_week\``;
        } else if (options.ruleName === "ColumnName") {
            message += `\n\nExpected a column name or \`(\``;
        } else if (options.ruleName === "TerminalColumnName") {
            message += `\n\nExpected a column name after 'AS'`;
        }

        return message;
    }
};
