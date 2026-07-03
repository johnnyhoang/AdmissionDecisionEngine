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
exports.Grade10District = void 0;
const typeorm_1 = require("typeorm");
const school_entity_1 = require("./school.entity");
let Grade10District = class Grade10District {
    id;
    name;
    code;
    schools;
    createdAt;
    updatedAt;
};
exports.Grade10District = Grade10District;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Grade10District.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Grade10District.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Grade10District.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => school_entity_1.Grade10School, (school) => school.district),
    __metadata("design:type", Array)
], Grade10District.prototype, "schools", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Grade10District.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Grade10District.prototype, "updatedAt", void 0);
exports.Grade10District = Grade10District = __decorate([
    (0, typeorm_1.Entity)('G10HCM_DISTRICT')
], Grade10District);
//# sourceMappingURL=district.entity.js.map