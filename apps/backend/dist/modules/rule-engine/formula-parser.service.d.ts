export declare class FormulaParserService {
    evaluate(expression: string, context: Record<string, number>): number;
    private evaluateMathOnlyExpression;
    private tokenize;
    private shuntingYard;
    private evaluateRPN;
}
