"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversityModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const university_service_1 = require("./university.service");
const university_controller_1 = require("./university.controller");
const university_entity_1 = require("../database/entities/university.entity");
const campus_entity_1 = require("../database/entities/campus.entity");
const major_entity_1 = require("../database/entities/major.entity");
const program_entity_1 = require("../database/entities/program.entity");
const admission_method_entity_1 = require("../database/entities/admission-method.entity");
const admission_rule_entity_1 = require("../database/entities/admission-rule.entity");
const admission_score_entity_1 = require("../database/entities/admission-score.entity");
const evaluation_history_entity_1 = require("../database/entities/evaluation-history.entity");
const data_import_entity_1 = require("../database/entities/data-import.entity");
let UniversityModule = class UniversityModule {
};
exports.UniversityModule = UniversityModule;
exports.UniversityModule = UniversityModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                university_entity_1.University,
                campus_entity_1.Campus,
                major_entity_1.Major,
                program_entity_1.Program,
                admission_method_entity_1.AdmissionMethod,
                admission_rule_entity_1.AdmissionRule,
                admission_score_entity_1.AdmissionScore,
                evaluation_history_entity_1.EvaluationHistory,
                data_import_entity_1.DataImport,
            ]),
        ],
        controllers: [university_controller_1.UniversityController],
        providers: [university_service_1.UniversityService],
        exports: [university_service_1.UniversityService, typeorm_1.TypeOrmModule],
    })
], UniversityModule);
//# sourceMappingURL=university.module.js.map