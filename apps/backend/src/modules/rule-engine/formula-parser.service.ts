import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FormulaParserService {
  /**
   * Safely evaluates a formula expression using context variables.
   * @param expression Formula string, e.g., "(Math * 2 + Physics + Chemistry) * 3/4 + PriorityBonus"
   * @param context Key-value pairs of variable values, e.g., { Math: 9.0, Physics: 8.5, Chemistry: 8.0, PriorityBonus: 0.5 }
   */
  evaluate(expression: string, context: Record<string, number>): number {
    // 1. Sanitize expression
    let sanitized = expression.replace(/\s+/g, '');

    // 2. Substitute context variables (descending length order to prevent substring substitution issues)
    const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const val = context[key] ?? 0;
      // Replace variable names (using boundary check regex where applicable, or global string replacement)
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKey}\\b`, 'g');
      sanitized = sanitized.replace(regex, val.toString());
    }

    // 3. Ensure no malicious characters remain. Only allow numbers, math operators, and decimals.
    if (/[^0-9.+\-*\/()]/g.test(sanitized)) {
      throw new BadRequestException(
        `Invalid formula expression or missing variables. Sanitized expression: ${sanitized}`,
      );
    }

    try {
      return this.evaluateMathOnlyExpression(sanitized);
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to parse math expression: ${sanitized}. Error: ${err.message}`,
      );
    }
  }

  /**
   * Evaluates a mathematical string containing only numbers, operators, and parentheses.
   * Employs the Shunting-Yard algorithm to transform infix notation to RPN and evaluate.
   */
  private evaluateMathOnlyExpression(expr: string): number {
    const tokens = this.tokenize(expr);
    const rpn = this.shuntingYard(tokens);
    return this.evaluateRPN(rpn);
  }

  private tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    while (i < expr.length) {
      const char = expr[i];
      if ('+-*/()'.includes(char)) {
        tokens.push(char);
        i++;
      } else if (/[0-9.]/.test(char)) {
        let numStr = '';
        while (i < expr.length && /[0-9.]/.test(expr[i])) {
          numStr += expr[i];
          i++;
        }
        tokens.push(numStr);
      } else {
        throw new Error(`Unexpected character: ${char}`);
      }
    }
    return tokens;
  }

  private shuntingYard(tokens: string[]): string[] {
    const outputQueue: string[] = [];
    const operatorStack: string[] = [];
    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
    };

    for (const token of tokens) {
      if (!isNaN(Number(token))) {
        outputQueue.push(token);
      } else if (token in precedence) {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] in precedence &&
          precedence[operatorStack[operatorStack.length - 1]] >=
            precedence[token]
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
        operatorStack.push(token);
      } else if (token === '(') {
        operatorStack.push(token);
      } else if (token === ')') {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== '('
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
        if (operatorStack.length === 0) {
          throw new Error('Mismatched parentheses');
        }
        operatorStack.pop(); // pop '('
      }
    }

    while (operatorStack.length > 0) {
      const op = operatorStack.pop()!;
      if (op === '(' || op === ')') {
        throw new Error('Mismatched parentheses');
      }
      outputQueue.push(op);
    }

    return outputQueue;
  }

  private evaluateRPN(rpn: string[]): number {
    const stack: number[] = [];
    for (const token of rpn) {
      if (!isNaN(Number(token))) {
        stack.push(Number(token));
      } else {
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
            if (b === 0) throw new Error('Division by zero');
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
}
