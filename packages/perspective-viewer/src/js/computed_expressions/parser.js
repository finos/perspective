/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {CstParser} from "chevrotain";
import {
    vocabulary,
    Comma,
    ColumnName,
    As,
    LeftParen,
    RightParen,
    Sqrt,
    Pow2,
    Abs,
    Add,
    Subtract,
    Multiply,
    Divide,
    PercentOf,
    Equals,
    NotEquals,
    GreaterThan,
    LessThan,
    Length,
    Is,
    Lowercase,
    Uppercase,
    ConcatComma,
    ConcatSpace,
    Bin1000th,
    Bin1000,
    Bin100th,
    Bin100,
    Bin10th,
    Bin10,
    HourOfDay,
    DayOfWeek,
    MonthOfYear,
    SecondBucket,
    MinuteBucket,
    HourBucket,
    DayBucket,
    WeekBucket,
    MonthBucket,
    YearBucket
} from "./lexer";
import {PerspectiveParserErrorMessage} from "./error";

export class ComputedExpressionColumnParser extends CstParser {
    constructor() {
        super(vocabulary, {
            errorMessageProvider: PerspectiveParserErrorMessage
        });

        this.RULE("SuperExpression", () => {
            this.SUBRULE(this.Expression);
        });

        this.RULE("Expression", () => {
            this.OR(
                [
                    {
                        ALT: () => {
                            this.SUBRULE(this.OperatorComputedColumn);
                        }
                    },
                    {
                        ALT: () => {
                            this.SUBRULE(this.FunctionComputedColumn);
                        }
                    }
                ],
                {
                    ERR_MSG: "Expected an expression of the form `x + y` or `func(x)`."
                }
            );
        });

        this.RULE("OperatorComputedColumn", () => {
            this.SUBRULE(this.ColumnName, {LABEL: "left"});
            this.AT_LEAST_ONE(() => {
                this.SUBRULE(this.Operator);
                this.SUBRULE2(this.ColumnName, {LABEL: "right"});
            });
            this.OPTION(() => {
                this.SUBRULE(this.As, {LABEL: "as"});
            });
        });

        this.RULE("FunctionComputedColumn", () => {
            this.SUBRULE(this.Function);
            this.CONSUME(LeftParen);
            this.AT_LEAST_ONE_SEP({
                SEP: Comma,
                DEF: () => {
                    this.SUBRULE(this.ColumnName);
                }
            });
            this.CONSUME(RightParen);
            this.OPTION(() => {
                this.SUBRULE(this.As, {LABEL: "as"});
            });
        });

        this.RULE("ColumnName", () => {
            this.OR([{ALT: () => this.SUBRULE(this.ParentheticalExpression)}, {ALT: () => this.CONSUME(ColumnName)}], {
                ERR_MSG: "Expected a column name (wrapped in double quotes) or a parenthesis-wrapped expression."
            });
        });

        this.RULE("TerminalColumnName", () => {
            this.CONSUME(ColumnName);
        });

        this.RULE("As", () => {
            this.CONSUME(As);
            this.SUBRULE(this.TerminalColumnName);
        });

        this.RULE("Function", () => {
            this.OR([
                {ALT: () => this.CONSUME(Sqrt)},
                {ALT: () => this.CONSUME(Pow2)},
                {ALT: () => this.CONSUME(Abs)},
                {ALT: () => this.CONSUME(Bin1000th)},
                {ALT: () => this.CONSUME(Bin1000)},
                {ALT: () => this.CONSUME(Bin100th)},
                {ALT: () => this.CONSUME(Bin100)},
                {ALT: () => this.CONSUME(Bin10th)},
                {ALT: () => this.CONSUME(Bin10)},
                {ALT: () => this.CONSUME(Length)},
                {ALT: () => this.CONSUME(Uppercase)},
                {ALT: () => this.CONSUME(Lowercase)},
                {ALT: () => this.CONSUME(ConcatComma)},
                {ALT: () => this.CONSUME(ConcatSpace)},
                {ALT: () => this.CONSUME(HourOfDay)},
                {ALT: () => this.CONSUME(DayOfWeek)},
                {ALT: () => this.CONSUME(MonthOfYear)},
                {ALT: () => this.CONSUME(SecondBucket)},
                {ALT: () => this.CONSUME(MinuteBucket)},
                {ALT: () => this.CONSUME(HourBucket)},
                {ALT: () => this.CONSUME(DayBucket)},
                {ALT: () => this.CONSUME(WeekBucket)},
                {ALT: () => this.CONSUME(MonthBucket)},
                {ALT: () => this.CONSUME(YearBucket)}
            ]);
        });

        this.RULE("Operator", () => {
            this.OR([
                {ALT: () => this.CONSUME(Add)},
                {ALT: () => this.CONSUME(Subtract)},
                {ALT: () => this.CONSUME(Multiply)},
                {ALT: () => this.CONSUME(Divide)},
                {ALT: () => this.CONSUME(PercentOf)},
                {ALT: () => this.CONSUME(Equals)},
                {ALT: () => this.CONSUME(NotEquals)},
                {ALT: () => this.CONSUME(GreaterThan)},
                {ALT: () => this.CONSUME(LessThan)},
                {ALT: () => this.CONSUME(Is)}
            ]);
        });

        /**
         * The rule for parenthetical expressions, which consume parentheses
         * and resolve to this.Expression.
         */
        this.RULE("ParentheticalExpression", () => {
            this.CONSUME(LeftParen);
            this.SUBRULE(this.Expression);
            this.CONSUME(RightParen);
        });

        this.performSelfAnalysis();
    }
}
