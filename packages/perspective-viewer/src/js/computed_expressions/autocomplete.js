import {ComputedExpressionColumnLexer} from "./lexer";
import {parser_instance} from "./visitor";

/**
 * Try to extract a function name from the expression by backtracking until
 * we hit the last open parenthesis.
 *
 * Because all functions need to be parenthesis-wrapped unless at the beginning
 * of the expression, simply checking for parenthesis is enough to get a partial
 * from common expressions:
 *
 * - "Sales" + (s => ["sqrt"]
 * - "(a" => ["abs"]
 *
 * @param {String} expression
 */
export function extract_partial_function(expression) {
    const paren_index = expression.lastIndexOf("(");

    if (paren_index === -1) {
        // check whether we have a column name or not
        const quote_index = expression.indexOf('"');
        if (quote_index === -1) {
            // entire expression should be tested against function patterns
            return expression;
        }
    } else {
        // i.e. '"Sales" + (sqr'
        return expression.substring(paren_index).replace("(", "");
    }
}

/**
 * Given the text of a partial expression, use Chevrotain's
 * `computeContentAssist` to generate syntactically-correct suggestions for
 * the next token.
 *
 * @param {String} expression
 * @returns {Array}
 */
export function get_autocomplete_suggestions(expression) {
    const lexer_result = ComputedExpressionColumnLexer.tokenize(expression);

    if (lexer_result.errors.length > 0) {
        // Check if the last token is partial AND not a column name (not in
        // quotes). If true, the suggest function names that match.
        const partial_function = extract_partial_function(expression);

        if (partial_function && partial_function.indexOf('"') === -1) {
            // Remove open parenthesis and column name rule
            const all_functions = parser_instance
                .computeContentAssist("SuperExpression", [])
                .slice(2)
                .map(x => x.nextTokenType.PATTERN.source);
            return all_functions.filter(str => str.startsWith(partial_function));
        } else {
            // Don't parse, error-ridden
            return [];
        }
    }

    // Remove whitespace tokens
    const cleaned_tokens = [];

    for (const token of lexer_result.tokens) {
        if (token.tokenType.name !== "whitespace") {
            cleaned_tokens.push(token);
        }
    }

    lexer_result.tokens = cleaned_tokens;

    const suggestions = parser_instance.computeContentAssist("SuperExpression", lexer_result.tokens);
    const cleaned_suggestions = suggestions
        .filter(x => typeof x.nextTokenType.PATTERN.source !== "undefined")
        .map(suggestion => {
            const str = suggestion.nextTokenType.PATTERN.source;
            if (str.indexOf("\\") == 0) {
                return str.substring(1);
            } else {
                return str;
            }
        });
    return cleaned_suggestions;
}
