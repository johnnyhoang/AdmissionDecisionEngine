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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const university_entity_1 = require("../database/entities/university.entity");
const campus_entity_1 = require("../database/entities/campus.entity");
const major_entity_1 = require("../database/entities/major.entity");
const program_entity_1 = require("../database/entities/program.entity");
const admission_method_entity_1 = require("../database/entities/admission-method.entity");
const admission_rule_entity_1 = require("../database/entities/admission-rule.entity");
const admission_score_entity_1 = require("../database/entities/admission-score.entity");
const evaluation_history_entity_1 = require("../database/entities/evaluation-history.entity");
const data_import_entity_1 = require("../database/entities/data-import.entity");
let UniversityService = class UniversityService {
    universityRepository;
    campusRepository;
    majorRepository;
    programRepository;
    methodRepository;
    ruleRepository;
    scoreRepository;
    historyRepository;
    dataImportRepository;
    constructor(universityRepository, campusRepository, majorRepository, programRepository, methodRepository, ruleRepository, scoreRepository, historyRepository, dataImportRepository) {
        this.universityRepository = universityRepository;
        this.campusRepository = campusRepository;
        this.majorRepository = majorRepository;
        this.programRepository = programRepository;
        this.methodRepository = methodRepository;
        this.ruleRepository = ruleRepository;
        this.scoreRepository = scoreRepository;
        this.historyRepository = historyRepository;
        this.dataImportRepository = dataImportRepository;
    }
    async onApplicationBootstrap() {
        const methodCount = await this.methodRepository.count();
        if (methodCount === 0) {
            console.log('No admission methods found. Seeding base admission methods...');
            await this.seedAdmissionMethodsIfMissing();
            console.log('Base admission methods seeded successfully!');
        }
        else {
            console.log(`Database ready. Found ${methodCount} admission methods, ${await this.universityRepository.count()} universities.`);
        }
    }
    async seedAdmissionMethodsIfMissing() {
        const methods = [
            {
                code: 'THPT',
                name: 'Xét điểm thi tốt nghiệp THPT',
                description: 'Xét tuyển dựa trên kết quả kỳ thi tốt nghiệp trung học phổ thông quốc gia.',
            },
            {
                code: 'HOCBA',
                name: 'Xét học bạ THPT',
                description: 'Xét tuyển dựa trên kết quả học tập ở bậc THPT (Học bạ).',
            },
            {
                code: 'DGNL_HCM',
                name: 'Xét điểm ĐGNL ĐHQG-HCM',
                description: 'Xét tuyển dựa trên kết quả kỳ thi Đánh giá năng lực của Đại học Quốc gia TP.HCM.',
            },
            {
                code: 'DGNL_HN',
                name: 'Xét điểm ĐGNL ĐHQG-HN',
                description: 'Xét tuyển dựa trên kết quả kỳ thi Đánh giá năng lực của Đại học Quốc gia Hà Nội (HSA).',
            },
            {
                code: 'COMBINED',
                name: 'Xét tuyển kết hợp (IELTS/SAT)',
                description: 'Xét tuyển kết hợp chứng chỉ quốc tế và học bạ/điểm THPT.',
            },
            {
                code: 'DGTD',
                name: 'Xét điểm đánh giá tư duy (TSA)',
                description: 'Xét tuyển dựa trên bài thi Đánh giá tư duy của ĐHBKHN.',
            },
            {
                code: 'STRAIGHT',
                name: 'Tuyển thẳng',
                description: 'Xét tuyển thẳng theo quy định của Bộ GD&ĐT.',
            },
        ];
        for (const m of methods) {
            const exists = await this.methodRepository.findOne({
                where: { code: m.code },
            });
            if (!exists) {
                await this.methodRepository.save(this.methodRepository.create(m));
            }
        }
    }
    async findAll(filters) {
        const query = this.universityRepository
            .createQueryBuilder('univ')
            .leftJoinAndSelect('univ.campuses', 'campus');
        if (filters.search) {
            query.andWhere('(univ.nameVi LIKE :search OR univ.code LIKE :search)', {
                search: `%${filters.search}%`,
            });
        }
        if (filters.city) {
            query.andWhere('campus.city = :city', { city: filters.city });
        }
        if (filters.isPublic !== undefined) {
            query.andWhere('univ.isPublic = :isPublic', {
                isPublic: filters.isPublic,
            });
        }
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        query.skip((page - 1) * limit).take(limit);
        const [items, total] = await query.getManyAndCount();
        return { items, total, page, limit };
    }
    async findOne(id) {
        return this.universityRepository.findOne({
            where: { id },
            relations: {
                campuses: true,
                programs: {
                    major: true,
                    admissionRules: {
                        admissionMethod: true,
                    },
                },
            },
        });
    }
    async findMajors(search, sector) {
        const query = this.majorRepository.createQueryBuilder('major');
        if (search) {
            query.andWhere('(major.nameVi LIKE :search OR major.code LIKE :search)', {
                search: `%${search}%`,
            });
        }
        if (sector) {
            query.andWhere('major.sector = :sector', { sector });
        }
        return query.getMany();
    }
    async getMajorAnalytics(majorCode) {
        const programs = await this.programRepository.find({
            where: { major: { code: majorCode } },
            relations: {
                university: true,
                admissionRules: {
                    admissionScores: true,
                    admissionMethod: true,
                },
            },
        });
        const yearlyData = {};
        for (const prog of programs) {
            for (const rule of prog.admissionRules) {
                if (rule.admissionMethod.code === 'THPT') {
                    for (const score of rule.admissionScores) {
                        const yr = score.year;
                        if (!yearlyData[yr]) {
                            yearlyData[yr] = { count: 0, totalScore: 0 };
                        }
                        yearlyData[yr].count++;
                        yearlyData[yr].totalScore += Number(score.benchmarkScore);
                    }
                }
            }
        }
        return Object.keys(yearlyData)
            .map((yr) => {
            const year = parseInt(yr);
            const avg = yearlyData[year].totalScore / yearlyData[year].count;
            return {
                year,
                avgBenchmark: parseFloat(avg.toFixed(2)),
            };
        })
            .sort((a, b) => a.year - b.year);
    }
    async seedInitialData() {
        await this.scoreRepository.createQueryBuilder().delete().execute();
        await this.ruleRepository.createQueryBuilder().delete().execute();
        await this.programRepository.createQueryBuilder().delete().execute();
        await this.campusRepository.createQueryBuilder().delete().execute();
        await this.universityRepository.createQueryBuilder().delete().execute();
        await this.majorRepository.createQueryBuilder().delete().execute();
        await this.methodRepository.createQueryBuilder().delete().execute();
        const thptMethod = this.methodRepository.create({
            code: 'THPT',
            name: 'Xét điểm thi tốt nghiệp THPT',
            description: 'Xét tuyển dựa trên kết quả kỳ thi tốt nghiệp trung học phổ thông quốc gia.',
        });
        const hocbaMethod = this.methodRepository.create({
            code: 'HOCBA',
            name: 'Xét học bạ THPT',
            description: 'Xét tuyển dựa trên kết quả học tập ở bậc THPT (Học bạ).',
        });
        const dgnlMethod = this.methodRepository.create({
            code: 'DGNL_HCM',
            name: 'Xét điểm ĐGNL ĐHQG-HCM',
            description: 'Xét tuyển dựa trên kết quả kỳ thi Đánh giá năng lực của Đại học Quốc gia TP.HCM.',
        });
        const combinedMethod = this.methodRepository.create({
            code: 'COMBINED',
            name: 'Xét tuyển kết hợp (IELTS/SAT)',
            description: 'Xét tuyển kết hợp chứng chỉ quốc tế và học bạ/điểm THPT.',
        });
        await this.methodRepository.save([
            thptMethod,
            hocbaMethod,
            dgnlMethod,
            combinedMethod,
        ]);
        const majorsData = [
            {
                code: '7480101',
                nameVi: 'Khoa học máy tính',
                nameEn: 'Computer Science',
                sector: 'IT',
                description: 'Nghiên cứu về cơ sở lý thuyết của thông tin và tính toán.',
            },
            {
                code: '7480103',
                nameVi: 'Kỹ thuật phần mềm',
                nameEn: 'Software Engineering',
                sector: 'IT',
                description: 'Nghiên cứu về quy trình thiết kế, phát triển và bảo trì phần mềm.',
            },
            {
                code: '7480201',
                nameVi: 'Công nghệ thông tin',
                nameEn: 'Information Technology',
                sector: 'IT',
                description: 'Sử dụng hệ thống máy tính và viễn thông để lưu trữ, truyền dữ liệu.',
            },
            {
                code: '7480107',
                nameVi: 'Trí tuệ nhân tạo',
                nameEn: 'Artificial Intelligence',
                sector: 'IT',
                description: 'Nghiên cứu mô phỏng trí thông minh của con người cho máy móc.',
            },
            {
                code: '7340101',
                nameVi: 'Quản trị kinh doanh',
                nameEn: 'Business Administration',
                sector: 'Economics',
                description: 'Quản lý hoạt động kinh doanh và đưa ra quyết định chiến lược.',
            },
            {
                code: '7310101',
                nameVi: 'Kinh tế học',
                nameEn: 'Economics',
                sector: 'Economics',
                description: 'Nghiên cứu sự sản xuất, phân phối và tiêu dùng hàng hóa.',
            },
        ];
        const seededMajors = {};
        for (const m of majorsData) {
            const major = this.majorRepository.create(m);
            seededMajors[m.code] = await this.majorRepository.save(major);
        }
        const universitiesData = [
            {
                code: 'QSC',
                nameVi: 'Trường Đại học Công nghệ Thông tin - ĐHQG-HCM',
                nameEn: 'University of Information Technology',
                website: 'https://www.uit.edu.vn',
                logoUrl: 'https://uit.edu.vn/logo.png',
                isPublic: true,
                globalRanking: 1200,
                localRanking: 15,
                averageTuition: 35000000,
            },
            {
                code: 'QST',
                nameVi: 'Trường Đại học Khoa học Tự nhiên - ĐHQG-HCM',
                nameEn: 'University of Science',
                website: 'https://hcmus.edu.vn',
                logoUrl: 'https://hcmus.edu.vn/logo.png',
                isPublic: true,
                globalRanking: 1000,
                localRanking: 8,
                averageTuition: 30000000,
            },
            {
                code: 'QSB',
                nameVi: 'Trường Đại học Bách khoa - ĐHQG-HCM',
                nameEn: 'Ho Chi Minh City University of Technology',
                website: 'https://hcmut.edu.vn',
                logoUrl: 'https://hcmut.edu.vn/logo.png',
                isPublic: true,
                globalRanking: 800,
                localRanking: 4,
                averageTuition: 30000000,
            },
        ];
        for (const u of universitiesData) {
            const university = await this.universityRepository.save(this.universityRepository.create(u));
            const campus = await this.campusRepository.save(this.campusRepository.create({
                universityId: university.id,
                name: 'Cơ sở Thủ Đức',
                address: 'Khu đô thị ĐHQG-HCM, Linh Trung, Thủ Đức, TP.HCM',
                city: 'TP. Hồ Chí Minh',
            }));
            if (u.code === 'QSC') {
                const csProgram = await this.programRepository.save(this.programRepository.create({
                    universityId: university.id,
                    majorId: seededMajors['7480101'].id,
                    campusId: campus.id,
                    code: 'QSC-CS',
                    name: 'Khoa học máy tính (Chương trình Chuẩn)',
                    tuitionFee: 35000000,
                    language: 'Vietnamese',
                }));
                const seProgram = await this.programRepository.save(this.programRepository.create({
                    universityId: university.id,
                    majorId: seededMajors['7480103'].id,
                    campusId: campus.id,
                    code: 'QSC-SE',
                    name: 'Kỹ thuật phần mềm (Chương trình Chuẩn)',
                    tuitionFee: 35000000,
                    language: 'Vietnamese',
                }));
                const csThptRule = await this.ruleRepository.save(this.ruleRepository.create({
                    programId: csProgram.id,
                    admissionMethodId: thptMethod.id,
                    formulaExpression: 'Math + Physics + English + PriorityBonus',
                    subjectWeights: JSON.stringify({
                        Math: 1.0,
                        Physics: 1.0,
                        English: 1.0,
                    }),
                    minScoreThreshold: 22.0,
                    quota: 100,
                    priorityRules: JSON.stringify({ KV1: 0.75, KV2: 0.25 }),
                }));
                await this.scoreRepository.save([
                    this.scoreRepository.create({
                        admissionRuleId: csThptRule.id,
                        year: 2024,
                        benchmarkScore: 26.5,
                        totalAdmitted: 98,
                    }),
                    this.scoreRepository.create({
                        admissionRuleId: csThptRule.id,
                        year: 2025,
                        benchmarkScore: 26.9,
                        totalAdmitted: 105,
                    }),
                ]);
                const csDgnlRule = await this.ruleRepository.save(this.ruleRepository.create({
                    programId: csProgram.id,
                    admissionMethodId: dgnlMethod.id,
                    formulaExpression: 'DGNL + PriorityBonus',
                    minScoreThreshold: 600,
                    quota: 80,
                    priorityRules: JSON.stringify({ KV1: 20, KV2: 10 }),
                }));
                await this.scoreRepository.save([
                    this.scoreRepository.create({
                        admissionRuleId: csDgnlRule.id,
                        year: 2024,
                        benchmarkScore: 840,
                        totalAdmitted: 75,
                    }),
                    this.scoreRepository.create({
                        admissionRuleId: csDgnlRule.id,
                        year: 2025,
                        benchmarkScore: 870,
                        totalAdmitted: 82,
                    }),
                ]);
                const seThptRule = await this.ruleRepository.save(this.ruleRepository.create({
                    programId: seProgram.id,
                    admissionMethodId: thptMethod.id,
                    formulaExpression: 'Math * 2 + Physics + English + PriorityBonus',
                    subjectWeights: JSON.stringify({
                        Math: 2.0,
                        Physics: 1.0,
                        English: 1.0,
                    }),
                    minScoreThreshold: 23.0,
                    quota: 150,
                }));
                await this.scoreRepository.save([
                    this.scoreRepository.create({
                        admissionRuleId: seThptRule.id,
                        year: 2024,
                        benchmarkScore: 35.5,
                        totalAdmitted: 145,
                    }),
                    this.scoreRepository.create({
                        admissionRuleId: seThptRule.id,
                        year: 2025,
                        benchmarkScore: 35.8,
                        totalAdmitted: 152,
                    }),
                ]);
            }
            else if (u.code === 'QST') {
                const csProgram = await this.programRepository.save(this.programRepository.create({
                    universityId: university.id,
                    majorId: seededMajors['7480101'].id,
                    campusId: campus.id,
                    code: 'QST-CS',
                    name: 'Khoa học máy tính (Chương trình Tiên tiến)',
                    tuitionFee: 47000000,
                    language: 'English',
                }));
                const csThptRule = await this.ruleRepository.save(this.ruleRepository.create({
                    programId: csProgram.id,
                    admissionMethodId: thptMethod.id,
                    formulaExpression: 'Math + Physics + Chemistry + PriorityBonus',
                    minScoreThreshold: 22.0,
                    quota: 80,
                }));
                await this.scoreRepository.save([
                    this.scoreRepository.create({
                        admissionRuleId: csThptRule.id,
                        year: 2024,
                        benchmarkScore: 27.2,
                        totalAdmitted: 78,
                    }),
                    this.scoreRepository.create({
                        admissionRuleId: csThptRule.id,
                        year: 2025,
                        benchmarkScore: 28.0,
                        totalAdmitted: 80,
                    }),
                ]);
                const csDgnlRule = await this.ruleRepository.save(this.ruleRepository.create({
                    programId: csProgram.id,
                    admissionMethodId: dgnlMethod.id,
                    formulaExpression: 'DGNL + PriorityBonus',
                    minScoreThreshold: 600,
                    quota: 60,
                }));
                await this.scoreRepository.save([
                    this.scoreRepository.create({
                        admissionRuleId: csDgnlRule.id,
                        year: 2024,
                        benchmarkScore: 920,
                        totalAdmitted: 55,
                    }),
                    this.scoreRepository.create({
                        admissionRuleId: csDgnlRule.id,
                        year: 2025,
                        benchmarkScore: 950,
                        totalAdmitted: 62,
                    }),
                ]);
            }
        }
    }
    async getStats() {
        const [universities, campuses, majors, programs, methods, rules, scores, histories, imports,] = await Promise.all([
            this.universityRepository.count(),
            this.campusRepository.count(),
            this.majorRepository.count(),
            this.programRepository.count(),
            this.methodRepository.count(),
            this.ruleRepository.count(),
            this.scoreRepository.count(),
            this.historyRepository.count(),
            this.dataImportRepository.count(),
        ]);
        return {
            universities,
            campuses,
            majors,
            programs,
            methods,
            rules,
            scores,
            histories,
            imports,
        };
    }
    async getEvaluationHistory() {
        return this.historyRepository.find({
            order: {
                createdAt: 'DESC',
            },
            take: 100,
        });
    }
};
exports.UniversityService = UniversityService;
exports.UniversityService = UniversityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(university_entity_1.University)),
    __param(1, (0, typeorm_1.InjectRepository)(campus_entity_1.Campus)),
    __param(2, (0, typeorm_1.InjectRepository)(major_entity_1.Major)),
    __param(3, (0, typeorm_1.InjectRepository)(program_entity_1.Program)),
    __param(4, (0, typeorm_1.InjectRepository)(admission_method_entity_1.AdmissionMethod)),
    __param(5, (0, typeorm_1.InjectRepository)(admission_rule_entity_1.AdmissionRule)),
    __param(6, (0, typeorm_1.InjectRepository)(admission_score_entity_1.AdmissionScore)),
    __param(7, (0, typeorm_1.InjectRepository)(evaluation_history_entity_1.EvaluationHistory)),
    __param(8, (0, typeorm_1.InjectRepository)(data_import_entity_1.DataImport)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UniversityService);
//# sourceMappingURL=university.service.js.map