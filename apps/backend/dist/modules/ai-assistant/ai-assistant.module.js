"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAssistantModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const ai_assistant_service_1 = require("./ai-assistant.service");
const ai_assistant_controller_1 = require("./ai-assistant.controller");
const university_entity_1 = require("../database/entities/university.entity");
const major_entity_1 = require("../database/entities/major.entity");
const program_entity_1 = require("../database/entities/program.entity");
const admission_method_entity_1 = require("../database/entities/admission-method.entity");
const admission_rule_entity_1 = require("../database/entities/admission-rule.entity");
const admission_score_entity_1 = require("../database/entities/admission-score.entity");
const school_entity_1 = require("../grade10-hcm/entities/school.entity");
const district_entity_1 = require("../grade10-hcm/entities/district.entity");
const cutoff_entity_1 = require("../grade10-hcm/entities/cutoff.entity");
const quota_entity_1 = require("../grade10-hcm/entities/quota.entity");
let AiAssistantModule = class AiAssistantModule {
};
exports.AiAssistantModule = AiAssistantModule;
exports.AiAssistantModule = AiAssistantModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([
                university_entity_1.University,
                major_entity_1.Major,
                program_entity_1.Program,
                admission_method_entity_1.AdmissionMethod,
                admission_rule_entity_1.AdmissionRule,
                admission_score_entity_1.AdmissionScore,
                school_entity_1.Grade10School,
                district_entity_1.Grade10District,
                cutoff_entity_1.Grade10Cutoff,
                quota_entity_1.Grade10Quota,
            ]),
        ],
        controllers: [ai_assistant_controller_1.AiAssistantController],
        providers: [ai_assistant_service_1.AiAssistantService],
        exports: [ai_assistant_service_1.AiAssistantService],
    })
], AiAssistantModule);
//# sourceMappingURL=ai-assistant.module.js.map