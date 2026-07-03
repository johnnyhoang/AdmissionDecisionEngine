import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from '../database/entities/university.entity';
import { Campus } from '../database/entities/campus.entity';
import { Major } from '../database/entities/major.entity';
import { Program } from '../database/entities/program.entity';
import { AdmissionMethod } from '../database/entities/admission-method.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';

@Injectable()
export class UniversityService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,
    @InjectRepository(Campus)
    private readonly campusRepository: Repository<Campus>,
    @InjectRepository(Major)
    private readonly majorRepository: Repository<Major>,
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    @InjectRepository(AdmissionMethod)
    private readonly methodRepository: Repository<AdmissionMethod>,
    @InjectRepository(AdmissionRule)
    private readonly ruleRepository: Repository<AdmissionRule>,
    @InjectRepository(AdmissionScore)
    private readonly scoreRepository: Repository<AdmissionScore>,
  ) {}

  async onApplicationBootstrap() {
    // Automatically seed mock data on startup if database is empty
    const universityCount = await this.universityRepository.count();
    if (universityCount === 0) {
      console.log('Seeding initial Vietnamese VNU-HCM university admission data...');
      await this.seedInitialData();
      console.log('Seeding completed successfully!');
    }
  }

  async findAll(filters: { search?: string; city?: string; isPublic?: boolean; page: number; limit: number }) {
    const query = this.universityRepository.createQueryBuilder('univ')
      .leftJoinAndSelect('univ.campuses', 'campus');

    if (filters.search) {
      query.andWhere('(univ.nameVi LIKE :search OR univ.code LIKE :search)', { search: `%${filters.search}%` });
    }
    if (filters.city) {
      query.andWhere('campus.city = :city', { city: filters.city });
    }
    if (filters.isPublic !== undefined) {
      query.andWhere('univ.isPublic = :isPublic', { isPublic: filters.isPublic });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    query.skip((page - 1) * limit).take(limit);

    const [items, total] = await query.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    return this.universityRepository.findOne({
      where: { id },
      relations: {
        campuses: true,
        programs: {
          major: true,
          admissionRules: {
            admissionMethod: true
          }
        }
      }
    });
  }

  async findMajors(search?: string, sector?: string) {
    const query = this.majorRepository.createQueryBuilder('major');
    if (search) {
      query.andWhere('(major.nameVi LIKE :search OR major.code LIKE :search)', { search: `%${search}%` });
    }
    if (sector) {
      query.andWhere('major.sector = :sector', { sector });
    }
    return query.getMany();
  }

  async getMajorAnalytics(majorCode: string) {
    // Aggregates average benchmark scores over time for a major
    const programs = await this.programRepository.find({
      where: { major: { code: majorCode } },
      relations: {
        university: true,
        admissionRules: {
          admissionScores: true,
          admissionMethod: true
        }
      }
    });

    const yearlyData: Record<number, { count: number; totalScore: number }> = {};

    for (const prog of programs) {
      for (const rule of prog.admissionRules) {
        if (rule.admissionMethod.code === 'THPT') { // Focus on THPT for standard benchmarking
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

    return Object.keys(yearlyData).map((yr) => {
      const year = parseInt(yr);
      const avg = yearlyData[year].totalScore / yearlyData[year].count;
      return {
        year,
        avgBenchmark: parseFloat(avg.toFixed(2)),
      };
    }).sort((a, b) => a.year - b.year);
  }

  async seedInitialData() {
    // 0. Clear existing data in correct dependency order to prevent unique key crashes
    await this.scoreRepository.createQueryBuilder().delete().execute();
    await this.ruleRepository.createQueryBuilder().delete().execute();
    await this.programRepository.createQueryBuilder().delete().execute();
    await this.campusRepository.createQueryBuilder().delete().execute();
    await this.universityRepository.createQueryBuilder().delete().execute();
    await this.majorRepository.createQueryBuilder().delete().execute();
    await this.methodRepository.createQueryBuilder().delete().execute();

    // 1. Seed Admission Methods
    const thptMethod = this.methodRepository.create({ code: 'THPT', name: 'Xét điểm thi tốt nghiệp THPT', description: 'Xét tuyển dựa trên kết quả kỳ thi tốt nghiệp trung học phổ thông quốc gia.' });
    const hocbaMethod = this.methodRepository.create({ code: 'HOCBA', name: 'Xét học bạ THPT', description: 'Xét tuyển dựa trên kết quả học tập ở bậc THPT (Học bạ).' });
    const dgnlMethod = this.methodRepository.create({ code: 'DGNL_HCM', name: 'Xét điểm ĐGNL ĐHQG-HCM', description: 'Xét tuyển dựa trên kết quả kỳ thi Đánh giá năng lực của Đại học Quốc gia TP.HCM.' });
    const combinedMethod = this.methodRepository.create({ code: 'COMBINED', name: 'Xét tuyển kết hợp (IELTS/SAT)', description: 'Xét tuyển kết hợp chứng chỉ quốc tế và học bạ/điểm THPT.' });
    
    await this.methodRepository.save([thptMethod, hocbaMethod, dgnlMethod, combinedMethod]);

    // 2. Seed Majors from VNU-HCM
    const majorsData = [
      { code: '7480101', nameVi: 'Khoa học máy tính', nameEn: 'Computer Science', sector: 'IT', description: 'Nghiên cứu về cơ sở lý thuyết của thông tin và tính toán.' },
      { code: '7480103', nameVi: 'Kỹ thuật phần mềm', nameEn: 'Software Engineering', sector: 'IT', description: 'Nghiên cứu về quy trình thiết kế, phát triển và bảo trì phần mềm.' },
      { code: '7480201', nameVi: 'Công nghệ thông tin', nameEn: 'Information Technology', sector: 'IT', description: 'Sử dụng hệ thống máy tính và viễn thông để lưu trữ, truyền dữ liệu.' },
      { code: '7480107', nameVi: 'Trí tuệ nhân tạo', nameEn: 'Artificial Intelligence', sector: 'IT', description: 'Nghiên cứu mô phỏng trí thông minh của con người cho máy móc.' },
      { code: '7340101', nameVi: 'Quản trị kinh doanh', nameEn: 'Business Administration', sector: 'Economics', description: 'Quản lý hoạt động kinh doanh và đưa ra quyết định chiến lược.' },
      { code: '7310101', nameVi: 'Kinh tế học', nameEn: 'Economics', sector: 'Economics', description: 'Nghiên cứu sự sản xuất, phân phối và tiêu dùng hàng hóa.' }
    ];

    const seededMajors: Record<string, Major> = {};
    for (const m of majorsData) {
      const major = this.majorRepository.create(m);
      seededMajors[m.code] = await this.majorRepository.save(major);
    }

    // 3. Seed Universities (VNU-HCM members)
    const universitiesData = [
      { code: 'QSC', nameVi: 'Trường Đại học Công nghệ Thông tin - ĐHQG-HCM', nameEn: 'University of Information Technology', website: 'https://www.uit.edu.vn', logoUrl: 'https://uit.edu.vn/logo.png', isPublic: true, globalRanking: 1200, localRanking: 15, averageTuition: 35000000 },
      { code: 'QST', nameVi: 'Trường Đại học Khoa học Tự nhiên - ĐHQG-HCM', nameEn: 'University of Science', website: 'https://hcmus.edu.vn', logoUrl: 'https://hcmus.edu.vn/logo.png', isPublic: true, globalRanking: 1000, localRanking: 8, averageTuition: 30000000 },
      { code: 'QSB', nameVi: 'Trường Đại học Bách khoa - ĐHQG-HCM', nameEn: 'Ho Chi Minh City University of Technology', website: 'https://hcmut.edu.vn', logoUrl: 'https://hcmut.edu.vn/logo.png', isPublic: true, globalRanking: 800, localRanking: 4, averageTuition: 30000000 }
    ];

    for (const u of universitiesData) {
      const university = await this.universityRepository.save(this.universityRepository.create(u));

      // Create a Campus
      const campus = await this.campusRepository.save(this.campusRepository.create({
        universityId: university.id,
        name: 'Cơ sở Thủ Đức',
        address: 'Khu đô thị ĐHQG-HCM, Linh Trung, Thủ Đức, TP.HCM',
        city: 'TP. Hồ Chí Minh'
      }));

      // Create Programs for each university
      if (u.code === 'QSC') {
        // UIT Programs: Khoa học máy tính & Kỹ thuật phần mềm
        const csProgram = await this.programRepository.save(this.programRepository.create({
          universityId: university.id,
          majorId: seededMajors['7480101'].id,
          campusId: campus.id,
          code: 'QSC-CS',
          name: 'Khoa học máy tính (Chương trình Chuẩn)',
          tuitionFee: 35000000,
          language: 'Vietnamese'
        }));

        const seProgram = await this.programRepository.save(this.programRepository.create({
          universityId: university.id,
          majorId: seededMajors['7480103'].id,
          campusId: campus.id,
          code: 'QSC-SE',
          name: 'Kỹ thuật phần mềm (Chương trình Chuẩn)',
          tuitionFee: 35000000,
          language: 'Vietnamese'
        }));

        // Rules for UIT CS
        // Rule 1: THPT A00, A01, D01. Formula: Math + Physics + English or Math + Physics + Chemistry
        const csThptRule = await this.ruleRepository.save(this.ruleRepository.create({
          programId: csProgram.id,
          admissionMethodId: thptMethod.id,
          formulaExpression: 'Math + Physics + English + PriorityBonus',
          subjectWeights: JSON.stringify({ Math: 1.0, Physics: 1.0, English: 1.0 }),
          minScoreThreshold: 22.0,
          quota: 100,
          priorityRules: JSON.stringify({ KV1: 0.75, KV2: 0.25 })
        }));

        await this.scoreRepository.save([
          this.scoreRepository.create({ admissionRuleId: csThptRule.id, year: 2024, benchmarkScore: 26.50, totalAdmitted: 98 }),
          this.scoreRepository.create({ admissionRuleId: csThptRule.id, year: 2025, benchmarkScore: 26.90, totalAdmitted: 105 })
        ]);

        // Rule 2: DGNL HCM
        const csDgnlRule = await this.ruleRepository.save(this.ruleRepository.create({
          programId: csProgram.id,
          admissionMethodId: dgnlMethod.id,
          formulaExpression: 'DGNL + PriorityBonus',
          minScoreThreshold: 600,
          quota: 80,
          priorityRules: JSON.stringify({ KV1: 20, KV2: 10 })
        }));

        await this.scoreRepository.save([
          this.scoreRepository.create({ admissionRuleId: csDgnlRule.id, year: 2024, benchmarkScore: 840, totalAdmitted: 75 }),
          this.scoreRepository.create({ admissionRuleId: csDgnlRule.id, year: 2025, benchmarkScore: 870, totalAdmitted: 82 })
        ]);

        // Rules for UIT SE (Kỹ thuật phần mềm)
        const seThptRule = await this.ruleRepository.save(this.ruleRepository.create({
          programId: seProgram.id,
          admissionMethodId: thptMethod.id,
          formulaExpression: 'Math * 2 + Physics + English + PriorityBonus', // Math x2 formula
          subjectWeights: JSON.stringify({ Math: 2.0, Physics: 1.0, English: 1.0 }),
          minScoreThreshold: 23.0,
          quota: 150
        }));

        await this.scoreRepository.save([
          this.scoreRepository.create({ admissionRuleId: seThptRule.id, year: 2024, benchmarkScore: 35.5, totalAdmitted: 145 }),
          this.scoreRepository.create({ admissionRuleId: seThptRule.id, year: 2025, benchmarkScore: 35.8, totalAdmitted: 152 })
        ]);

      } else if (u.code === 'QST') {
        // HCMUS: Khoa học máy tính & Công nghệ thông tin
        const csProgram = await this.programRepository.save(this.programRepository.create({
          universityId: university.id,
          majorId: seededMajors['7480101'].id,
          campusId: campus.id,
          code: 'QST-CS',
          name: 'Khoa học máy tính (Chương trình Tiên tiến)',
          tuitionFee: 47000000,
          language: 'English'
        }));

        const csThptRule = await this.ruleRepository.save(this.ruleRepository.create({
          programId: csProgram.id,
          admissionMethodId: thptMethod.id,
          formulaExpression: 'Math + Physics + Chemistry + PriorityBonus',
          minScoreThreshold: 22.0,
          quota: 80
        }));

        await this.scoreRepository.save([
          this.scoreRepository.create({ admissionRuleId: csThptRule.id, year: 2024, benchmarkScore: 27.20, totalAdmitted: 78 }),
          this.scoreRepository.create({ admissionRuleId: csThptRule.id, year: 2025, benchmarkScore: 28.00, totalAdmitted: 80 })
        ]);
        
        // DGNL HCM
        const csDgnlRule = await this.ruleRepository.save(this.ruleRepository.create({
          programId: csProgram.id,
          admissionMethodId: dgnlMethod.id,
          formulaExpression: 'DGNL + PriorityBonus',
          minScoreThreshold: 600,
          quota: 60
        }));

        await this.scoreRepository.save([
          this.scoreRepository.create({ admissionRuleId: csDgnlRule.id, year: 2024, benchmarkScore: 920, totalAdmitted: 55 }),
          this.scoreRepository.create({ admissionRuleId: csDgnlRule.id, year: 2025, benchmarkScore: 950, totalAdmitted: 62 })
        ]);
      }
    }
  }
}
