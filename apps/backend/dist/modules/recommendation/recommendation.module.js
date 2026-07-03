"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const rule_engine_module_1 = require("../rule-engine/rule-engine.module");
const recommendation_service_1 = require("./recommendation.service");
const recommendation_controller_1 = require("./recommendation.controller");
const program_entity_1 = require("../database/entities/program.entity");
const admission_rule_entity_1 = require("../database/entities/admission-rule.entity");
const university_entity_1 = require("../database/entities/university.entity");
const evaluation_history_entity_1 = require("../database/entities/evaluation-history.entity");
let RecommendationModule = class RecommendationModule {
};
exports.RecommendationModule = RecommendationModule;
exports.RecommendationModule = RecommendationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                program_entity_1.Program,
                admission_rule_entity_1.AdmissionRule,
                university_entity_1.University,
                evaluation_history_entity_1.EvaluationHistory,
            ]),
            rule_engine_module_1.RuleEngineModule,
        ],
        controllers: [recommendation_controller_1.RecommendationController],
        providers: [recommendation_service_1.RecommendationService],
        exports: [recommendation_service_1.RecommendationService],
    })
], RecommendationModule);
//# sourceMappingURL=recommendation.module.js.map