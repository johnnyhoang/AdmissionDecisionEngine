"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const rule_engine_module_1 = require("./modules/rule-engine/rule-engine.module");
const recommendation_module_1 = require("./modules/recommendation/recommendation.module");
const university_module_1 = require("./modules/university/university.module");
const ai_assistant_module_1 = require("./modules/ai-assistant/ai-assistant.module");
const import_module_1 = require("./modules/import/import.module");
const grade10_hcm_module_1 = require("./modules/grade10-hcm/grade10-hcm.module");
const auth_module_1 = require("./modules/auth/auth.module");
const user_entity_1 = require("./modules/database/entities/user.entity");
const user_permission_entity_1 = require("./modules/database/entities/user-permission.entity");
const admission_method_entity_1 = require("./modules/database/entities/admission-method.entity");
const admission_rule_entity_1 = require("./modules/database/entities/admission-rule.entity");
const admission_score_entity_1 = require("./modules/database/entities/admission-score.entity");
const campus_entity_1 = require("./modules/database/entities/campus.entity");
const candidate_profile_entity_1 = require("./modules/database/entities/candidate-profile.entity");
const data_import_entity_1 = require("./modules/database/entities/data-import.entity");
const evaluation_history_entity_1 = require("./modules/database/entities/evaluation-history.entity");
const major_entity_1 = require("./modules/database/entities/major.entity");
const program_entity_1 = require("./modules/database/entities/program.entity");
const subject_combination_entity_1 = require("./modules/database/entities/subject-combination.entity");
const university_entity_1 = require("./modules/database/entities/university.entity");
const school_entity_1 = require("./modules/grade10-hcm/entities/school.entity");
const district_entity_1 = require("./modules/grade10-hcm/entities/district.entity");
const quota_entity_1 = require("./modules/grade10-hcm/entities/quota.entity");
const cutoff_entity_1 = require("./modules/grade10-hcm/entities/cutoff.entity");
const history_entity_1 = require("./modules/grade10-hcm/entities/history.entity");
const import_log_entity_1 = require("./modules/grade10-hcm/entities/import-log.entity");
const activity_log_entity_1 = require("./modules/grade10-hcm/entities/activity-log.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const url = config.get('DATABASE_URL');
                    return {
                        type: 'postgres',
                        url: url || undefined,
                        host: url
                            ? undefined
                            : config.get('DB_HOST', 'aws-1-ap-southeast-1.pooler.supabase.com'),
                        port: url ? undefined : config.get('DB_PORT', 5432),
                        username: url
                            ? undefined
                            : config.get('DB_USERNAME', 'postgres.czngbleeeiljsrpbaksg'),
                        password: url ? undefined : config.get('DB_PASSWORD', ''),
                        database: url
                            ? undefined
                            : config.get('DB_DATABASE', 'postgres'),
                        entities: [
                            user_entity_1.User,
                            user_permission_entity_1.UserPermission,
                            admission_method_entity_1.AdmissionMethod,
                            admission_rule_entity_1.AdmissionRule,
                            admission_score_entity_1.AdmissionScore,
                            campus_entity_1.Campus,
                            candidate_profile_entity_1.CandidateProfile,
                            data_import_entity_1.DataImport,
                            evaluation_history_entity_1.EvaluationHistory,
                            major_entity_1.Major,
                            program_entity_1.Program,
                            subject_combination_entity_1.SubjectCombination,
                            university_entity_1.University,
                            school_entity_1.Grade10School,
                            district_entity_1.Grade10District,
                            quota_entity_1.Grade10Quota,
                            cutoff_entity_1.Grade10Cutoff,
                            history_entity_1.Grade10History,
                            import_log_entity_1.Grade10ImportLog,
                            activity_log_entity_1.Grade10ActivityLog,
                        ],
                        synchronize: true,
                        ssl: {
                            rejectUnauthorized: false,
                        },
                    };
                },
            }),
            rule_engine_module_1.RuleEngineModule,
            university_module_1.UniversityModule,
            recommendation_module_1.RecommendationModule,
            ai_assistant_module_1.AiAssistantModule,
            import_module_1.ImportModule,
            grade10_hcm_module_1.Grade10HcmModule,
            auth_module_1.AuthModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map