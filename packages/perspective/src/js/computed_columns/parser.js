/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {CstParser} from "chevrotain";
import {vocabulary, ColumnName, As, LeftParen, RightParen, Sqrt, Pow2, Abs, Add, Subtract, Multiply, Divide, Lowercase, Uppercase, ConcatComma, ConcatSpace} from "./lexer";

export class ComputedColumnParser extends CstParser {
    constructor() {
        super(vocabulary);

        this.RULE("SuperExpression", () => {
            this.SUBRULE(this.Expression);
        });

        this.RULE("Expression", () => {
            this.SUBRULE(this.FunctionComputedColumn);
        });

        this.RULE("FunctionComputedColumn", () => {
            this.MANY(() => {
                this.SUBRULE(this.Function);
                this.CONSUME(LeftParen);
                this.SUBRULE(this.ColumnName);
                this.CONSUME(RightParen);
            });
            this.SUBRULE(this.ComputedColumn);
            this.OPTION(() => {
                this.SUBRULE(this.As, {LABEL: "as"});
            });
        });

        this.RULE("ComputedColumn", () => {
            this.SUBRULE(this.ColumnName, {LABEL: "left"});
            this.MANY(() => {
                this.SUBRULE(this.Operator);
                this.SUBRULE2(this.ColumnName, {LABEL: "right"});
            });
            this.OPTION(() => {
                this.SUBRULE(this.As, {LABEL: "as"});
            });
        });

        this.RULE("ColumnName", () => {
            this.OR([{ALT: () => this.SUBRULE(this.ParentheticalExpression)}, {ALT: () => this.CONSUME(ColumnName)}]);
        });

        this.RULE("As", () => {
            this.CONSUME(As);
            this.SUBRULE(this.ColumnName);
        });

        this.RULE("Function", () => {
            this.OR([
                {ALT: () => this.CONSUME(Sqrt)},
                {ALT: () => this.CONSUME(Pow2)},
                {ALT: () => this.CONSUME(Abs)},
                {ALT: () => this.CONSUME(Uppercase)},
                {ALT: () => this.CONSUME(Lowercase)},
                {ALT: () => this.CONSUME(ConcatComma)},
                {ALT: () => this.CONSUME(ConcatSpace)}
            ]);
        });

        this.RULE("Operator", () => {
            this.OR([{ALT: () => this.CONSUME(Add)}, {ALT: () => this.CONSUME(Subtract)}, {ALT: () => this.CONSUME(Multiply)}, {ALT: () => this.CONSUME(Divide)}]);
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
