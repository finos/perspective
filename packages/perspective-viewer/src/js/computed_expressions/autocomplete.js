import {clean_tokens, FunctionTokenType, OperatorTokenType} from "./lexer";
import {parser_instance} from "./visitor";
import {tokenMatcher} from "chevrotain";

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
 * Given a list of suggestions, transform each suggestion into an object with
 * `label` and `value`.
 *
 * @param {*} suggestions
 */
function _apply_metadata(suggestions) {
    const suggestions_with_metadata = [];

    for (const suggestion of suggestions) {
        if (!suggestion.nextTokenType || !suggestion.nextTokenType.PATTERN.source) {
            continue;
        }

        const label = suggestion.nextTokenType.LABEL;
        let value = suggestion.nextTokenType.PATTERN.source.replace(/\\/g, "");

        if (tokenMatcher(suggestion.nextTokenType, FunctionTokenType)) {
            value = `${value}(`;
        } else if (tokenMatcher(suggestion.nextTokenType, OperatorTokenType)) {
            value = `${value} `;
        }

        suggestions_with_metadata.push({
            label,
            value
        });
    }

    return suggestions_with_metadata;
}

/**
 * Given a lexer result and the raw expression that was lexed,
 * suggest syntactically possible tokens.
 *
 * @param {ILexingResult} lexer_result
 * @param {String} expression
 * @returns {Array}
 */
export function get_autocomplete_suggestions(expression, lexer_result) {
    if (!lexer_result) {
        return _apply_metadata(parser_instance.computeContentAssist("SuperExpression", []));
    }
    if (lexer_result.errors.length > 0) {
        // Check if the last token is partial AND not a column name (not in
        // quotes). If true, the suggest function names that match.
        const partial_function = extract_partial_function(expression);

        if (partial_function && partial_function.indexOf('"') === -1) {
            // Remove open parenthesis and column name rule
            const suggestions = _apply_metadata(parser_instance.computeContentAssist("SuperExpression", []).slice(2));
            return suggestions.filter(s => s.value.startsWith(partial_function));
        } else {
            // Don't parse, error-ridden
            return [];
        }
    }

    // Remove whitespace tokens
    lexer_result.tokens = clean_tokens(lexer_result.tokens);

    const suggestions = parser_instance.computeContentAssist("SuperExpression", lexer_result.tokens);
    return _apply_metadata(suggestions);
}
