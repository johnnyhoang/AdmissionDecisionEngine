"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionMethod = void 0;
const typeorm_1 = require("typeorm");
const admission_rule_entity_1 = require("./admission-rule.entity");
let AdmissionMethod = class AdmissionMethod {
    id;
    code;
    name;
    description;
    admissionRules;
    createdAt;
    updatedAt;
};
exports.AdmissionMethod = AdmissionMethod;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AdmissionMethod.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], AdmissionMethod.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AdmissionMethod.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdmissionMethod.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => admission_rule_entity_1.AdmissionRule, (rule) => rule.admissionMethod),
    __metadata("design:type", Array)
], AdmissionMethod.prototype, "admissionRules", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AdmissionMethod.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], AdmissionMethod.prototype, "updatedAt", void 0);
exports.AdmissionMethod = AdmissionMethod = __decorate([
    (0, typeorm_1.Entity)('ade_admission_methods')
], AdmissionMethod);
//# sourceMappingURL=admission-method.entity.js.map