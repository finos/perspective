/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {CstParser} from "chevrotain";
import {PerspectiveParserErrorMessage} from "./error";

export class ComputedExpressionColumnParser extends CstParser {
    constructor(vocabulary) {
        super(vocabulary, {
            errorMessageProvider: PerspectiveParserErrorMessage
        });

        this.RULE("SuperExpression", () => {
            this.SUBRULE(this.Expression);
        });

        this.RULE("Expression", () => {
            // Preserve operator precedence amongst mathematical operations
            this.SUBRULE(this.AdditionOperatorComputedColumn);
        });

        this.RULE("AdditionOperatorComputedColumn", () => {
            this.SUBRULE(this.ColumnName, {LABEL: "left"});
            this.MANY(() => {
                this.SUBRULE(this.Operator);
                this.SUBRULE2(this.MultiplicationOperatorComputedColumn, {LABEL: "right"});
            });
            this.OPTION(() => {
                this.SUBRULE(this.As, {LABEL: "as"});
            });
        });

        this.RULE("MultiplicationOperatorComputedColumn", () => {
            this.SUBRULE(this.ColumnName, {LABEL: "left"});
            this.MANY(() => {
                this.SUBRULE(this.Operator);
                this.SUBRULE2(this.ColumnName, {LABEL: "right"});
            });
            this.OPTION(() => {
                this.SUBRULE(this.As, {LABEL: "as"});
            });
        });

        // this.RULE("OperatorComputedColumn", () => {
        //     this.SUBRULE(this.ColumnName, {LABEL: "left"});
        //     this.AT_LEAST_ONE(() => {
        //         this.SUBRULE(this.Operator);
        //         this.SUBRULE2(this.ColumnName, {LABEL: "right"});
        //     });
        //     this.OPTION(() => {
        //         this.SUBRULE(this.As, {LABEL: "as"});
        //     });
        // });

        this.RULE("FunctionComputedColumn", () => {
            this.SUBRULE(this.Function);
            this.CONSUME(vocabulary["leftParen"]);
            this.AT_LEAST_ONE_SEP({
                SEP: vocabulary["comma"],
                DEF: () => {
                    this.SUBRULE(this.ColumnName);
                }
            });
            this.CONSUME(vocabulary["rightParen"]);
            this.OPTION(() => {
                this.SUBRULE(this.As, {LABEL: "as"});
            });
        });

        this.RULE("ColumnName", () => {
            this.OR([{ALT: () => this.SUBRULE(this.ParentheticalExpression)}, {ALT: () => this.SUBRULE(this.FunctionComputedColumn)}, {ALT: () => this.CONSUME(vocabulary["columnName"])}], {
                ERR_MSG: "Expected a column name (wrapped in double quotes) or a parenthesis-wrapped expression."
            });
        });

        this.RULE("TerminalColumnName", () => {
            this.CONSUME(vocabulary["columnName"]);
        });

        this.RULE("As", () => {
            this.CONSUME(vocabulary["as"]);
            this.SUBRULE(this.TerminalColumnName);
        });

        this.RULE("Function", () => {
            this.OR([
                {ALT: () => this.CONSUME(vocabulary["sqrt"])},
                {ALT: () => this.CONSUME(vocabulary["pow2"])},
                {ALT: () => this.CONSUME(vocabulary["abs"])},
                {ALT: () => this.CONSUME(vocabulary["invert"])},
                {ALT: () => this.CONSUME(vocabulary["log"])},
                {ALT: () => this.CONSUME(vocabulary["exp"])},
                {ALT: () => this.CONSUME(vocabulary["bin1000th"])},
                {ALT: () => this.CONSUME(vocabulary["bin1000"])},
                {ALT: () => this.CONSUME(vocabulary["bin100th"])},
                {ALT: () => this.CONSUME(vocabulary["bin100"])},
                {ALT: () => this.CONSUME(vocabulary["bin10th"])},
                {ALT: () => this.CONSUME(vocabulary["bin10"])},
                {ALT: () => this.CONSUME(vocabulary["length"])},
                {ALT: () => this.CONSUME(vocabulary["uppercase"])},
                {ALT: () => this.CONSUME(vocabulary["lowercase"])},
                {ALT: () => this.CONSUME(vocabulary["concat_comma"])},
                {ALT: () => this.CONSUME(vocabulary["concat_space"])},
                {ALT: () => this.CONSUME(vocabulary["hour_of_day"])},
                {ALT: () => this.CONSUME(vocabulary["day_of_week"])},
                {ALT: () => this.CONSUME(vocabulary["month_of_year"])},
                {ALT: () => this.CONSUME(vocabulary["second_bucket"])},
                {ALT: () => this.CONSUME(vocabulary["minute_bucket"])},
                {ALT: () => this.CONSUME(vocabulary["hour_bucket"])},
                {ALT: () => this.CONSUME(vocabulary["day_bucket"])},
                {ALT: () => this.CONSUME(vocabulary["week_bucket"])},
                {ALT: () => this.CONSUME(vocabulary["month_bucket"])},
                {ALT: () => this.CONSUME(vocabulary["year_bucket"])}
            ]);
        });

        this.RULE("Operator", () => {
            this.OR([
                {ALT: () => this.CONSUME(vocabulary["add"])},
                {ALT: () => this.CONSUME(vocabulary["subtract"])},
                {ALT: () => this.CONSUME(vocabulary["multiply"])},
                {ALT: () => this.CONSUME(vocabulary["divide"])},
                {ALT: () => this.CONSUME(vocabulary["pow"])},
                {ALT: () => this.CONSUME(vocabulary["percent_of"])},
                {ALT: () => this.CONSUME(vocabulary["equals"])},
                {ALT: () => this.CONSUME(vocabulary["not_equals"])},
                {ALT: () => this.CONSUME(vocabulary["greater_than"])},
                {ALT: () => this.CONSUME(vocabulary["less_than"])},
                {ALT: () => this.CONSUME(vocabulary["is"])}
            ]);
        });

        /**
         * The rule for parenthetical expressions, which consume parentheses
         * and resolve to this.Expression.
         */
        this.RULE("ParentheticalExpression", () => {
            this.CONSUME(vocabulary["leftParen"]);
            this.SUBRULE(this.Expression);
            this.CONSUME(vocabulary["rightParen"]);
        });

        this.performSelfAnalysis();
    }
}
