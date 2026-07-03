"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormulaParserService = void 0;
const common_1 = require("@nestjs/common");
let FormulaParserService = class FormulaParserService {
    evaluate(expression, context) {
        let sanitized = expression.replace(/\s+/g, '');
        const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);
        for (const key of sortedKeys) {
            const val = context[key] ?? 0;
            const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedKey}\\b`, 'g');
            sanitized = sanitized.replace(regex, val.toString());
        }
        if (/[^0-9.+\-*\/()]/g.test(sanitized)) {
            throw new common_1.BadRequestException(`Invalid formula expression or missing variables. Sanitized expression: ${sanitized}`);
        }
        try {
            return this.evaluateMathOnlyExpression(sanitized);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Failed to parse math expression: ${sanitized}. Error: ${err.message}`);
        }
    }
    evaluateMathOnlyExpression(expr) {
        const tokens = this.tokenize(expr);
        const rpn = this.shuntingYard(tokens);
        return this.evaluateRPN(rpn);
    }
    tokenize(expr) {
        const tokens = [];
        let i = 0;
        while (i < expr.length) {
            const char = expr[i];
            if ('+-*/()'.includes(char)) {
                tokens.push(char);
                i++;
            }
            else if (/[0-9.]/.test(char)) {
                let numStr = '';
                while (i < expr.length && /[0-9.]/.test(expr[i])) {
                    numStr += expr[i];
                    i++;
                }
                tokens.push(numStr);
            }
            else {
                throw new Error(`Unexpected character: ${char}`);
            }
        }
        return tokens;
    }
    shuntingYard(tokens) {
        const outputQueue = [];
        const operatorStack = [];
        const precedence = {
            '+': 1,
            '-': 1,
            '*': 2,
            '/': 2,
        };
        for (const token of tokens) {
            if (!isNaN(Number(token))) {
                outputQueue.push(token);
            }
            else if (token in precedence) {
                while (operatorStack.length > 0 &&
                    operatorStack[operatorStack.length - 1] in precedence &&
                    precedence[operatorStack[operatorStack.length - 1]] >=
                        precedence[token]) {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.push(token);
            }
            else if (token === '(') {
                operatorStack.push(token);
            }
            else if (token === ')') {
                while (operatorStack.length > 0 &&
                    operatorStack[operatorStack.length - 1] !== '(') {
                    outputQueue.push(operatorStack.pop());
                }
                if (operatorStack.length === 0) {
                    throw new Error('Mismatched parentheses');
                }
                operatorStack.pop();
            }
        }
        while (operatorStack.length > 0) {
            const op = operatorStack.pop();
            if (op === '(' || op === ')') {
                throw new Error('Mismatched parentheses');
            }
            outputQueue.push(op);
        }
        return outputQueue;
    }
    evaluateRPN(rpn) {
        const stack = [];
        for (const token of rpn) {
            if (!isNaN(Number(token))) {
                stack.push(Number(token));
            }
            else {
                const b = stack.pop();
                const a = stack.pop();
                if (a === undefined || b === undefined) {
                    throw new Error('Invalid RPN expression');
                }
                switch (token) {
                    case '+':
                        stack.push(a + b);
                        break;
                    case '-':
                        stack.push(a - b);
                        break;
                    case '*':
                        stack.push(a * b);
                        break;
                    case '/':
                        if (b === 0)
                            throw new Error('Division by zero');
                        stack.push(a / b);
                        break;
                    default:
                        throw new Error(`Unknown operator: ${token}`);
                }
            }
        }
        if (stack.length !== 1) {
            throw new Error('Invalid expression evaluation result');
        }
        return stack[0];
    }
};
exports.FormulaParserService = FormulaParserService;
exports.FormulaParserService = FormulaParserService = __decorate([
    (0, common_1.Injectable)()
], FormulaParserService);
//# sourceMappingURL=formula-parser.service.js.map