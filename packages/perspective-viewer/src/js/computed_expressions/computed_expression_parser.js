/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {Lexer, createToken, tokenMatcher} from "chevrotain";
import {PerspectiveLexerErrorMessage} from "./error";
import {clean_tokens, Comma, ColumnName, As, Whitespace, LeftParen, RightParen, OperatorTokenType, FunctionTokenType, UpperLowerCaseTokenType} from "./lexer";
import {ComputedExpressionColumnParser} from "./parser";
import {COMPUTED_FUNCTION_FORMATTERS} from "./formatter";

const token_types = {FunctionTokenType, OperatorTokenType};

/**
 * A more complex suggestion object for computed expressions, which may suggest
 * functions, operators, and column names, each with their own metadata.
 */
export class ComputedExpressionAutocompleteSuggestion {
    /**
     * Construct a new autocomplete suggestion.
     *
     * @param {String} label the text shown to the user
     * @param {String} value the text used to replace inside the input
     * @param {String} pattern the actual string that makes up the token
     * @param {String} signature a Typescript-style signature for the function
     * @param {String} help a help string displayed in the UI
     * @param {Array<String>} input_types input data types for the suggestion
     * function or operator.
     * @param {String} return_type the return type of the computed column
     * @param {Number} num_params the number of input columns required by the
     * function or operator.
     * @param {Boolean} is_column_name whether the item is a column name or not,
     * as additional styling will be applied to column names.
     */
    constructor({label, value, pattern, signature, help, input_types, return_type, num_params, is_column_name} = {}) {
        this.label = label;
        this.value = value;
        this.pattern = pattern;
        this.input_types = input_types;
        this.return_type = return_type;
        this.num_params = num_params;
        this.signature = signature;
        this.help = help;
        this.is_column_name = is_column_name || false;
    }
}

class PerspectiveComputedExpressionParser {
    constructor() {
        this.is_initialized = false;
        this._vocabulary = {};
        this._tokens = [Whitespace, Comma, As, ColumnName, LeftParen, RightParen];
        this._metadata;
        this._lexer;
        this._parser;
        this._visitor;
    }

    init(metadata) {
        if (this.is_initialized) {
            return;
        }

        // Add base tokens to the vocabulary
        for (const token of this._tokens) {
            this._vocabulary[token.name] = token;
        }

        // Computed function metadata from the Perspective table
        this._metadata = metadata;

        // Initialize lexer, parser, and visitor
        this._lexer = this._construct_lexer();
        this._parser = this._construct_parser();
        this._visitor = this._construct_visitor();

        this.is_initialized = true;
    }

    /**
     * Given an expression, transform it into a list of tokens.
     *
     * @param {String} expression
     */
    lex(expression) {
        this._check_initialized();
        const result = this._lexer.tokenize(expression);

        if (result.errors.length > 0) {
            let message = result.errors[0].message;
            throw new Error(message);
        }

        // Remove whitespace tokens
        result.tokens = clean_tokens(result.tokens);

        return result;
    }

    /**
     * Given a string expression of the form '"column" +, -, *, / "column",
     * parse it and return a computed column configuration object.
     *
     * @param {String} expression
     */
    parse(expression) {
        this._check_initialized();
        const lex_result = this.lex(expression);

        // calling `parser.input` resets state.
        this._parser.input = lex_result.tokens;

        const cst = this._parser.SuperExpression();

        if (this._parser.errors.length > 0) {
            let message = this._parser.errors[0].message;
            throw new Error(message);
        }

        return this._visitor.visit(cst);
    }

    /**
     * Given a lexer result and the raw expression that was lexed,
     * suggest syntactically possible tokens. If the last non-whitespace/comma
     * token is a column name, only show operators that take the correct type.
     *
     * @param {ILexingResult} lexer_result
     * @param {String} expression
     * @param {Array[String]} input_types an array of data types by which to
     * filter down the suggestions.
     * @returns {Array}
     */
    get_autocomplete_suggestions(expression, lexer_result, input_types) {
        this._check_initialized();
        let initial_suggestions = this._parser.computeContentAssist("SuperExpression", []);

        if (!lexer_result) {
            return this._apply_suggestion_metadata(initial_suggestions);
        }

        if (lexer_result.errors.length > 0) {
            // Check if the last string fragment is partial AND not a
            // column name (not in quotes). If true, the suggest function
            // names that match.
            const partial_function = this.extract_partial_function(expression);

            // If the last fragment is partial, check if the last parsed
            // token is a column name, as we should not be sending suggestions
            // for a partial function that immediately follows a column name,
            // i.e. `"Sales" a`.
            const last_token = this.get_last_token(lexer_result);
            const is_column_name = last_token && tokenMatcher(last_token, ColumnName);

            if (partial_function && partial_function.search(/["']$/) === -1 && !is_column_name) {
                // Remove open parenthesis
                const suggestions = this._apply_suggestion_metadata(initial_suggestions.slice(1), input_types);
                const exact_matches = [];
                const fuzzy_matches = [];

                for (const suggestion of suggestions) {
                    const lower_value = suggestion.value.toLowerCase().trim();
                    const lower_input = partial_function.toLowerCase().trim();

                    if (lower_value.startsWith(lower_input)) {
                        exact_matches.push(suggestion);
                    } else if (lower_value.includes(lower_input)) {
                        fuzzy_matches.push(suggestion);
                    }
                }
                return exact_matches.concat(fuzzy_matches);
            } else {
                // Expression has unrecoverable errors
                return [];
            }
        }

        // Remove whitespace tokens
        lexer_result.tokens = clean_tokens(lexer_result.tokens);
        let suggestions = this._apply_suggestion_metadata(this._parser.computeContentAssist("SuperExpression", lexer_result.tokens), input_types);

        return suggestions;
    }

    /**
     * Try to extract a partial function name, i.e. a string not within quotes
     * and not ending with a parenthesis.
     *
     * - "Sales" + (s => "s"
     * - "(ab" => "ab"
     *
     * @param {String} expression
     */
    extract_partial_function(expression) {
        this._check_initialized();
        const matches = expression.match(/([^(,\s]+$)/);

        if (matches && matches.length > 0) {
            const partial = matches[0];

            // Ignore if match is a partial column name, i.e. has quotes
            if (!/['"]/.test(partial)) {
                return matches[0];
            }
        }
    }

    /**
     * Return the last non-whitespace token from a lexer result, or undefined
     * if there are no non-whitespace tokens or no tokens at all.
     *
     * @param {ILexingResult} lexer_result
     */
    get_last_token(lexer_result) {
        const tokens = clean_tokens(lexer_result.tokens);
        const last_idx = tokens.length - 1;
        if (last_idx >= 0) {
            return tokens[last_idx];
        }
    }

    /**
     * Look backwards through a list of tokens, checking whether each token is
     * of a type in the `types` array, stopping after `limit` tokens.
     * Whitespace tokens are removed from the token list before the search.
     *
     * @param {Array{TokenType}} types An array of token types to look through.
     * @param {ILexingResult} lexer_result A result from the lexer, containing
     * valid tokens and errors.
     * @param {Number} limit the number of tokens to search through before
     * exiting or returning a valid result. If limit > tokens.length or is
     * undefined, search all tokens.
     */
    get_last_token_with_types(types, lexer_result, limit) {
        const tokens = clean_tokens(lexer_result.tokens);
        if (!limit || limit <= 0 || limit >= tokens.length) {
            limit = tokens.length;
        }
        for (let i = tokens.length - 1; i >= tokens.length - limit; i--) {
            for (const type of types) {
                if (tokenMatcher(tokens[i], type)) {
                    return tokens[i];
                }
            }
        }
    }

    /**
     * Look backwards through a list of tokens, checking whether each token is
     * of the specific `name`, stopping after `limit` tokens. Whitespace tokens
     * are removed from the token list before the search.
     *
     * @param {String} name A string name of a token to match.
     * @param {ILexingResult} lexer_result A result from the lexer, containing
     * valid tokens and errors.
     * @param {Number} limit the number of tokens to search through before
     * exiting or returning a valid result. If limit > tokens.length or is
     * undefined, search all tokens.
     */
    get_last_token_with_name(name, lexer_result, limit) {
        const tokens = clean_tokens(lexer_result.tokens);
        if (!limit || limit <= 0 || limit >= tokens.length) {
            limit = tokens.length;
        }
        for (let i = tokens.length - 1; i >= tokens.length - limit; i--) {
            if (tokens[i].tokenType.name === name) {
                return tokens[i];
            }
        }
    }

    /**
     * Given a metadata object containing information about computed
     * functions, construct tokens and a vocabulary object for the parser.
     */
    _construct_lexer() {
        const bin_functions = ["bin1000th", "bin1000", "bin100th", "bin100", "bin10th", "bin10"];

        for (const key in this._metadata) {
            const meta = this._metadata[key];

            if (bin_functions.includes(meta.name)) {
                continue;
            }

            const token = this._make_token(meta);
            this._tokens.push(token);
            this._vocabulary[token.name] = token;
        }

        // Create and add bin functions in a specific order for the parser
        for (const bin_function of bin_functions) {
            const meta = this._metadata[bin_function];
            const token = this._make_token(meta);
            this._tokens.push(token);
            this._vocabulary[token.name] = token;
        }

        // Add uppercase/lowercase token last so it does not conflict
        this._tokens.push(UpperLowerCaseTokenType);
        this._vocabulary[UpperLowerCaseTokenType.name] = UpperLowerCaseTokenType;

        return new Lexer(this._tokens, {
            errorMessageProvider: PerspectiveLexerErrorMessage
        });
    }

    /**
     * Convenience method to create a Chevrotain token.
     *
     * @param {Object} meta
     */
    _make_token(meta) {
        const regex = new RegExp(meta.pattern);

        const token = createToken({
            name: meta.name,
            label: meta.label,
            pattern: regex,
            categories: [token_types[meta.category]]
        });

        // float/int and date/datetime are interchangable
        if (meta.input_type === "float") {
            token.input_types = ["float", "integer"];
        } else if (meta.input_type === "datetime") {
            token.input_types = ["datetime", "date"];
        } else {
            token.input_types = [meta.input_type];
        }

        token.return_type = meta.return_type;
        token.num_params = meta.num_params;
        token.signature = meta.signature;
        token.help = meta.help;

        return token;
    }

    /**
     * Construct a singleton parser instance that will be reused.
     */
    _construct_parser() {
        return new ComputedExpressionColumnParser(this._vocabulary);
    }

    /**
     * Define and construct a singleton visitor instance.
     */
    _construct_visitor() {
        const base_visitor = this._parser.getBaseCstVisitorConstructor();

        // The visitor has to be defined inside this method, as it requires
        // base_visitor from the parser instance
        class ComputedExpressionColumnVisitor extends base_visitor {
            constructor() {
                super();
                this.validateVisitor();
            }

            /**
             * Given a parsed expression, visit each node and return an array
             * of computed column specifications representing the recursive
             * tree-walk of all computed columns and their dependencies.
             *
             * @param {*} ctx
             */
            SuperExpression(ctx) {
                let computed_columns = [];

                this.visit(ctx.Expression, computed_columns);

                // An expression may be syntactically valid but does not
                // generate new computed columns, i.e. the expression '"Sales"',
                // which is syntactically valid but does not have enough
                // information to generate a computed column. In the future
                // when each column is editable as an expression by default,
                // this will not be an issue.
                if (computed_columns.length === 0) {
                    throw new Error("Expression did not generate any computed columns");
                }

                return computed_columns;
            }

            Expression(ctx, computed_columns) {
                return this.visit(ctx.OperatorComputedColumn, computed_columns);
            }

            /**
             * Common logic for parsing through a computed column in operator
             * syntax, with `get_operator` returning an operator of the
             * correct type, which is important for associativity.
             *
             * @param {*} ctx
             * @param {*} computed_columns
             * @param {*} get_operator
             */
            _VisitOperatorComputedColumn(ctx, computed_columns, get_operator) {
                let left = this.visit(ctx.left, computed_columns);

                let final_column_name;

                if (ctx.right) {
                    let previous;

                    ctx.right.forEach((rhs, idx) => {
                        let operator = get_operator(ctx, idx);

                        if (!operator) {
                            return;
                        }

                        let right = this.visit(rhs, computed_columns);

                        // If there is a previous value, use it, otherwise use
                        // the leftmost value. This enables expressions such as
                        // a + b / c * d + e ... ad infinitum
                        const left_hand = previous ? previous : left;

                        // Use custom name if provided through `AS/as/As`
                        let as;

                        if (ctx.as && idx < ctx.as.length) {
                            as = this.visit(ctx.as[idx]);
                        }

                        const column_name = as ? as : COMPUTED_FUNCTION_FORMATTERS[operator](left_hand, right);

                        computed_columns.push({
                            column: column_name,
                            computed_function_name: operator,
                            inputs: [left_hand, right]
                        });

                        previous = column_name;
                    });

                    final_column_name = previous;
                } else {
                    // If there are no more right-hand tokens, return the
                    // column name so it can be used as the tree traversal
                    // goes upwards.
                    final_column_name = left;
                }

                return final_column_name;
            }

            /**
             * Visit a single computed column in operator notation and generate
             * its specification.
             *
             * @param {*} ctx
             */
            OperatorComputedColumn(ctx, computed_columns) {
                const get_operator = (ctx, idx) => this.visit(ctx.Operator[idx]);
                return this._VisitOperatorComputedColumn(ctx, computed_columns, get_operator);
            }

            AdditionOperatorComputedColumn(ctx, computed_columns) {
                const get_operator = (ctx, idx) => this.visit(ctx.AdditionOperator[idx]);
                return this._VisitOperatorComputedColumn(ctx, computed_columns, get_operator);
            }

            MultiplicationOperatorComputedColumn(ctx, computed_columns) {
                const get_operator = (ctx, idx) => this.visit(ctx.MultiplicationOperator[idx]);
                return this._VisitOperatorComputedColumn(ctx, computed_columns, get_operator);
            }

            ExponentOperatorComputedColumn(ctx, computed_columns) {
                const get_operator = (ctx, idx) => this.visit(ctx.ExponentOperator[idx]);
                return this._VisitOperatorComputedColumn(ctx, computed_columns, get_operator);
            }

            /**
             * Visit a single computed column in functional notation and
             * generate its specification.
             *
             * @param {*} ctx
             * @param {*} computed_columns
             */
            FunctionComputedColumn(ctx, computed_columns) {
                const fn = this.visit(ctx.Function);

                // Functions have 1...n parameters
                let input_columns = [];

                for (const param of ctx.param) {
                    input_columns.push(this.visit(param, computed_columns));
                }

                // Use custom name if provided through `AS/as/As`me =
                const as = this.visit(ctx.as);
                const column_name = as ? as : COMPUTED_FUNCTION_FORMATTERS[fn](...input_columns);

                const computed = {
                    column: column_name,
                    computed_function_name: fn,
                    inputs: input_columns
                };

                computed_columns.push(computed);

                // Return the column name so it can be used up the chain
                return column_name;
            }

            /**
             * Parse and return a column name to be included in the computed
             * config.
             * @param {*} ctx
             */
            ColumnName(ctx, computed_columns) {
                // `image` contains the raw string, `payload` contains the
                // string without quotes.
                if (ctx.ParentheticalExpression) {
                    return this.visit(ctx.ParentheticalExpression, computed_columns);
                } else if (ctx.FunctionComputedColumn) {
                    return this.visit(ctx.FunctionComputedColumn, computed_columns);
                } else {
                    return ctx.columnName[0].payload;
                }
            }

            /**
             * Parse and return a column name to be included in the computed
             * config, and explicitly not parsed as a parenthetical expression.
             *
             * @param {*} ctx
             */
            TerminalColumnName(ctx) {
                return ctx.columnName[0].payload;
            }

            AdditionOperator(ctx) {
                if (ctx.add) {
                    return ctx.add[0].image;
                } else if (ctx.subtract) {
                    return ctx.subtract[0].image;
                }
            }

            MultiplicationOperator(ctx) {
                if (ctx.multiply) {
                    return ctx.multiply[0].image;
                } else if (ctx.divide) {
                    return ctx.divide[0].image;
                }
            }

            ExponentOperator(ctx) {
                if (ctx.pow) {
                    return ctx.pow[0].image;
                }
            }

            /**
             * Parse a single mathematical operator (+, -, *, /, %).
             * @param {*} ctx
             */
            Operator(ctx) {
                if (ctx.percent_of) {
                    return ctx.percent_of[0].image;
                } else if (ctx.equals) {
                    return ctx.equals[0].image;
                } else if (ctx.not_equals) {
                    return ctx.not_equals[0].image;
                } else if (ctx.greater_than) {
                    return ctx.greater_than[0].image;
                } else if (ctx.less_than) {
                    return ctx.less_than[0].image;
                } else if (ctx.is) {
                    return ctx.is[0].image;
                } else {
                    return;
                }
            }

            /**
             * Identify and return a function name used for computation.
             *
             * @param {*} ctx
             */
            Function(ctx) {
                if (ctx.sqrt) {
                    return ctx.sqrt[0].image;
                } else if (ctx.pow2) {
                    return ctx.pow2[0].image;
                } else if (ctx.abs) {
                    return ctx.abs[0].image;
                } else if (ctx.invert) {
                    return ctx.invert[0].image;
                } else if (ctx.log) {
                    return ctx.log[0].image;
                } else if (ctx.exp) {
                    return ctx.exp[0].image;
                } else if (ctx.length) {
                    return ctx.length[0].image;
                } else if (ctx.uppercase) {
                    return ctx.uppercase[0].image;
                } else if (ctx.lowercase) {
                    return ctx.lowercase[0].image;
                } else if (ctx.concat_comma) {
                    return ctx.concat_comma[0].image;
                } else if (ctx.concat_space) {
                    return ctx.concat_space[0].image;
                } else if (ctx.bin10) {
                    return ctx.bin10[0].image;
                } else if (ctx.bin100) {
                    return ctx.bin100[0].image;
                } else if (ctx.bin1000) {
                    return ctx.bin1000[0].image;
                } else if (ctx.bin10th) {
                    return ctx.bin10th[0].image;
                } else if (ctx.bin100th) {
                    return ctx.bin100th[0].image;
                } else if (ctx.bin1000th) {
                    return ctx.bin1000th[0].image;
                } else if (ctx.hour_of_day) {
                    return ctx.hour_of_day[0].image;
                } else if (ctx.day_of_week) {
                    return ctx.day_of_week[0].image;
                } else if (ctx.month_of_year) {
                    return ctx.month_of_year[0].image;
                } else if (ctx.second_bucket) {
                    return ctx.second_bucket[0].image;
                } else if (ctx.minute_bucket) {
                    return ctx.minute_bucket[0].image;
                } else if (ctx.hour_bucket) {
                    return ctx.hour_bucket[0].image;
                } else if (ctx.day_bucket) {
                    return ctx.day_bucket[0].image;
                } else if (ctx.week_bucket) {
                    return ctx.week_bucket[0].image;
                } else if (ctx.month_bucket) {
                    return ctx.month_bucket[0].image;
                } else if (ctx.year_bucket) {
                    return ctx.year_bucket[0].image;
                } else {
                    return;
                }
            }

            /**
             * Give a custom name to the created computed column using "AS"
             * or "as".
             *
             * @param {*} ctx
             */
            As(ctx) {
                return ctx.TerminalColumnName[0].children.columnName[0].payload;
            }

            /**
             * Parse an expression inside parentheses through recursing back
             * up to `Expression`.
             *
             * @param {*} ctx
             * @param {*} computed_columns
             */
            ParentheticalExpression(ctx, computed_columns) {
                return this.visit(ctx.Expression, computed_columns);
            }
        }

        return new ComputedExpressionColumnVisitor();
    }

    /**
     * Given a list of suggestions, transform each suggestion into an object
     * with `label` and `value`.
     *
     * @param {Array} suggestions
     * @param {Array[String]} input_types an array of input types as strings.
     */
    _apply_suggestion_metadata(suggestions, input_types) {
        this._check_initialized();
        const suggestions_with_metadata = [];

        for (const s of suggestions) {
            const token = s.nextTokenType;

            if (!token || !token.PATTERN.source) {
                continue;
            }

            let label = token.LABEL;
            let pattern = token.PATTERN.source.replace(/\\/g, "");
            let value = pattern;

            if (tokenMatcher(token, FunctionTokenType)) {
                value = `${value}(`;
            } else if (tokenMatcher(token, OperatorTokenType)) {
                value = `${value} `;
            } else if (tokenMatcher(token, As)) {
                value = "AS ";
                label = "AS";
                token.signature = "x + y AS new column";
                token.help = "Creates a custom name for the computed column.";
            }

            const suggestion = new ComputedExpressionAutocompleteSuggestion({
                label,
                value,
                pattern,
                signature: token.signature,
                help: token.help,
                input_types: token.input_types,
                return_type: token.return_type,
                num_params: token.num_params
            });

            if (input_types && suggestion.input_types) {
                // Return suggestions that have the same input type AND
                // the return type is in the input types array - this prevents
                // expressions such as `uppercase(length(` from being
                // suggested, as `length` takes a string but returns an int.
                for (const type of input_types) {
                    if (suggestion.input_types.includes(type) && suggestion.input_types.includes(suggestion.return_type)) {
                        suggestions_with_metadata.push(suggestion);
                        break;
                    }
                }
            } else {
                suggestions_with_metadata.push(suggestion);
            }
        }

        return suggestions_with_metadata;
    }

    _check_initialized() {
        if (this.is_initialized === false) {
            throw new Error("PerspectiveComputedExpressionParser is not initialized!");
        }
    }
}

// Create a module-level singleton parser.
export const COMPUTED_EXPRESSION_PARSER = new PerspectiveComputedExpressionParser();
