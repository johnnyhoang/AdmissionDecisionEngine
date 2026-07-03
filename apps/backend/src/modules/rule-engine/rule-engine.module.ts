import { Module } from '@nestjs/common';
import { FormulaParserService } from './formula-parser.service';
import { RuleEngineService } from './rule-engine.service';

@Module({
  providers: [FormulaParserService, RuleEngineService],
  exports: [FormulaParserService, RuleEngineService],
})
export class RuleEngineModule {}
