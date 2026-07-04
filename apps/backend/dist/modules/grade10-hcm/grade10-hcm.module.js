"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grade10HcmModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const school_entity_1 = require("./entities/school.entity");
const district_entity_1 = require("./entities/district.entity");
const quota_entity_1 = require("./entities/quota.entity");
const cutoff_entity_1 = require("./entities/cutoff.entity");
const history_entity_1 = require("./entities/history.entity");
const import_log_entity_1 = require("./entities/import-log.entity");
const activity_log_entity_1 = require("./entities/activity-log.entity");
const grade10_school_service_1 = require("./services/grade10-school.service");
const grade10_calc_service_1 = require("./services/grade10-calc.service");
const grade10_import_service_1 = require("./services/grade10-import.service");
const grade10_school_controller_1 = require("./controllers/grade10-school.controller");
const grade10_calc_controller_1 = require("./controllers/grade10-calc.controller");
const grade10_admin_controller_1 = require("./controllers/grade10-admin.controller");
const grade10_activity_log_controller_1 = require("./controllers/grade10-activity-log.controller");
let Grade10HcmModule = class Grade10HcmModule {
};
exports.Grade10HcmModule = Grade10HcmModule;
exports.Grade10HcmModule = Grade10HcmModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                school_entity_1.Grade10School,
                district_entity_1.Grade10District,
                quota_entity_1.Grade10Quota,
                cutoff_entity_1.Grade10Cutoff,
                history_entity_1.Grade10History,
                import_log_entity_1.Grade10ImportLog,
                activity_log_entity_1.Grade10ActivityLog,
            ]),
        ],
        controllers: [
            grade10_school_controller_1.Grade10SchoolController,
            grade10_calc_controller_1.Grade10CalcController,
            grade10_admin_controller_1.Grade10AdminController,
            grade10_activity_log_controller_1.Grade10ActivityLogController,
        ],
        providers: [grade10_school_service_1.Grade10SchoolService, grade10_calc_service_1.Grade10CalcService, grade10_import_service_1.Grade10ImportService],
        exports: [
            grade10_school_service_1.Grade10SchoolService,
            grade10_calc_service_1.Grade10CalcService,
            grade10_import_service_1.Grade10ImportService,
            typeorm_1.TypeOrmModule,
        ],
    })
], Grade10HcmModule);
//# sourceMappingURL=grade10-hcm.module.js.map