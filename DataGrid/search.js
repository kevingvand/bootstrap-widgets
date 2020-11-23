
window.tokenSymbols = {
    operators: {
        and: "&",
        or: "|",
    },
    structural: {
        groupOpen: "(",
        groupClose: ")"
    },
    types: {
        and: "AND",
        or: "OR",
        groupOpen: "OPEN",
        groupClose: "CLOSE",
        text: "TEXT"
    },
    precedences: {
        and: 20,
        or: 15,
    }
}

window.tokenSymbols.types[tokenSymbols.operators.and] = tokenSymbols.types.and;
window.tokenSymbols.types[tokenSymbols.operators.or] = tokenSymbols.types.or;
window.tokenSymbols.types[tokenSymbols.structural.groupOpen] = tokenSymbols.types.groupOpen;
window.tokenSymbols.types[tokenSymbols.structural.groupClose] = tokenSymbols.types.groupClose;
window.tokenSymbols.precedences[tokenSymbols.operators.and] = tokenSymbols.precedences.and;
window.tokenSymbols.precedences[tokenSymbols.operators.or] = tokenSymbols.precedences.or;

window.tokenize = function (query) {

    var tokens = [];
    var currentToken = "";

    for (var index = 0; index < query.length; index++) {
        var previousChar = query.charAt(index - 1);
        var currentChar = query.charAt(index);
        var nextChar = query.charAt(index + 1);

        switch (currentChar) {
            case tokenSymbols.operators.and:
            case tokenSymbols.operators.or:
                if (nextChar === currentChar) {
                    if (currentToken.trim()) {
                        tokens.push({ type: tokenSymbols.types.text, text: currentToken.trim() });
                        currentToken = "";
                    }
                    index++;

                    tokens.push({ type: tokenSymbols.types[currentChar], precedence: tokenSymbols.precedences[currentChar] });
                } else currentToken += currentChar;
                break;
            case tokenSymbols.structural.groupOpen:
            case tokenSymbols.structural.groupClose:
                if (currentToken.trim()) {
                    tokens.push({ type: tokenSymbols.types.text, text: currentToken.trim() });
                    currentToken = "";
                }

                tokens.push({ type: tokenSymbols.types[currentChar] });
                break;
            default:
                currentToken += currentChar;

                if (!nextChar)
                    tokens.push({ type: tokenSymbols.types.text, text: currentToken.trim() });

                break;
        }
    }

    return tokens;
}

window.sortTokensPostfix = function (tokens) {

    var output = [];
    var stack = [];

    tokens.forEach((token, index) => {
        if (token.type === tokenSymbols.types.groupOpen)
            stack.push(token)
        else if (token.type === tokenSymbols.types.groupClose) {

            while (stack.length && (stack.length - 1 >= 0) && stack[stack.length - 1].type !== tokenSymbols.types.groupOpen)
                output.push(stack.pop());

            if ((stack.length - 1 >= 0) && stack[stack.length - 1].type === tokenSymbols.types.groupOpen)
                stack.pop();

        }
        else if (token.type !== tokenSymbols.types.text) {

            while (stack.length && (stack.length - 1 >= 0) && stack[stack.length - 1].type !== tokenSymbols.types.text && token.precedence <= stack[stack.length - 1].precedence)
                output.push(stack.pop());

            stack.push(token);

        }
        else output.push(token);

    });

    while (stack.length)
        output.push(stack.pop());

    return output;
}

window.queryText = function (source, query, ignoreCase = true) {

    if(!query) return true;

    var tokens = tokenize(query);
    var postfix = sortTokensPostfix(tokens);

    var results = [];
    var sources = [source];

    if (Array.isArray(source))
        sources = source;

    sources.forEach(source => {
        var stack = [];
        postfix.forEach(token => {
            if (token.type === tokenSymbols.types.text) {

                var target = token.text;
                if (ignoreCase) {
                    source = source.toLowerCase();
                    target = target.toLowerCase();
                }

                stack.push(source.includes(target));

            } else {
                var firstOperand = stack.pop();
                var secondOperand = stack.pop();

                if (typeof firstOperand !== 'undefined' && typeof secondOperand !== 'undefined') {
                    switch (token.type) {
                        case tokenSymbols.types.and:
                            stack.push(firstOperand && secondOperand);
                            break;
                        case tokenSymbols.types.or:
                            stack.push(firstOperand || secondOperand);
                    }
                } else stack.push(false);
            }
        });

        results.push(stack.pop());
    });

    return results.length === 1 ? results.pop() : results;
}