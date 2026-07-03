import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { University } from '../database/entities/university.entity';
import { Campus } from '../database/entities/campus.entity';
import { Major } from '../database/entities/major.entity';
import { Program } from '../database/entities/program.entity';
import { AdmissionMethod } from '../database/entities/admission-method.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';
import { DataImport } from '../database/entities/data-import.entity';

// ===== IMPORT PAYLOAD TYPES =====

export interface UniversityImportDto {
  code: string;           // Mã trường (VD: QSB, QST, MHO)
  nameVi: string;         // Tên tiếng Việt
  nameEn?: string;        // Tên tiếng Anh
  website?: string;       // Website chính thức
  description?: string;   // Mô tả
  isPublic?: boolean;     // Công lập hay tư thục
  localRanking?: number;  // Xếp hạng nội địa
  logoUrl?: string;
  campuses?: CampusImportDto[];
  programs?: ProgramImportDto[];
}

export interface CampusImportDto {
  name: string;
  address?: string;
  city: string;
}

export interface ProgramImportDto {
  majorCode: string;          // Mã ngành 7 số của Bộ GD&ĐT (VD: 7480101)
  name: string;               // Tên ngành/chương trình
  trainingType?: string;      // DAI_TRA | CHAT_LUONG_CAO | TIEN_TIEN | ...
  language?: string;          // Tiếng Việt | Tiếng Anh
  tuitionFee?: number;        // Học phí (VNĐ/năm)
  tuitionFeeMax?: number;     // Học phí tối đa
  durationYears?: number;     // Số năm đào tạo
  totalQuota?: number;        // Tổng chỉ tiêu
  dataYear?: number;          // Năm dữ liệu
  dataSource?: string;        // Nguồn dữ liệu
  admissionRules?: AdmissionRuleImportDto[];
}

export interface AdmissionRuleImportDto {
  methodCode: string;              // THPT | HOCBA | DGNL_HCM | COMBINED
  subjectCombination?: string;     // A00 | A01 | B00 | D01 | ...
  combinationDescription?: string; // Toán, Vật Lý, Hóa Học
  formulaExpression?: string;      // Math*2 + Physics + Chemistry
  subjectWeights?: Record<string, number>; // {Math: 2, Physics: 1}
  minScoreThreshold?: number;      // Điểm sàn
  quota?: number;                  // Chỉ tiêu
  applyYear?: number;              // Năm áp dụng
  benchmarkScores?: BenchmarkScoreImportDto[];
}

export interface BenchmarkScoreImportDto {
  year: number;           // Năm thi (2024, 2025)
  benchmarkScore: number; // Điểm chuẩn
  totalAdmitted?: number; // Số trúng tuyển
}

export interface ImportPayload {
  sourceName: string;     // Tên nguồn
  sourceUrl?: string;     // URL nguồn
  dataYear: number;       // Năm dữ liệu
  universities: UniversityImportDto[];
}

export interface ImportResult {
  importId: string;
  universitiesAdded: number;
  universitiesUpdated: number;
  programsAdded: number;
  programsUpdated: number;
  scoresAdded: number;
  duplicatesSkipped: number;
  warnings: string[];
  errors: string[];
}

// ===== SUBJECT COMBINATION MASTER DATA =====
const SUBJECT_COMBINATION_MAP: Record<string, string> = {
  A00: 'Toán, Vật Lý, Hóa Học',
  A01: 'Toán, Vật Lý, Tiếng Anh',
  A02: 'Toán, Vật Lý, Sinh Học',
  A03: 'Toán, Vật Lý, Lịch Sử',
  A04: 'Toán, Vật Lý, Địa Lý',
  A05: 'Toán, Hóa Học, Lịch Sử',
  A06: 'Toán, Hóa Học, Địa Lý',
  A07: 'Toán, Lịch Sử, Địa Lý',
  A08: 'Toán, Lịch Sử, Giáo dục công dân',
  A09: 'Toán, Địa Lý, Giáo dục công dân',
  A10: 'Toán, Vật Lý, Giáo dục quốc phòng',
  B00: 'Toán, Hóa Học, Sinh Học',
  B01: 'Toán, Sinh Học, Lịch Sử',
  B02: 'Toán, Sinh Học, Địa Lý',
  B03: 'Toán, Sinh Học, Ngữ Văn',
  B04: 'Toán, Sinh Học, Giáo dục công dân',
  B08: 'Toán, Sinh Học, Tiếng Anh',
  C00: 'Ngữ Văn, Lịch Sử, Địa Lý',
  C01: 'Ngữ Văn, Toán, Vật Lý',
  C02: 'Ngữ Văn, Toán, Hóa Học',
  C03: 'Ngữ Văn, Toán, Lịch Sử',
  C04: 'Ngữ Văn, Toán, Địa Lý',
  C05: 'Ngữ Văn, Vật Lý, Hóa Học',
  C06: 'Ngữ Văn, Toán, Sinh Học',
  C07: 'Ngữ Văn, Toán, Giáo dục công dân',
  C08: 'Ngữ Văn, Hóa Học, Sinh Học',
  C14: 'Ngữ Văn, Toán, Tiếng Anh',
  C15: 'Ngữ Văn, Toán, Khoa học xã hội',
  C19: 'Ngữ Văn, Lịch Sử, Giáo dục công dân',
  C20: 'Ngữ Văn, Địa Lý, Giáo dục công dân',
  D01: 'Ngữ Văn, Toán, Tiếng Anh',
  D07: 'Toán, Hóa Học, Tiếng Anh',
  D08: 'Toán, Sinh Học, Tiếng Anh',
  D09: 'Toán, Lịch Sử, Tiếng Anh',
  D10: 'Toán, Địa Lý, Tiếng Anh',
  D11: 'Toán, Tiếng Anh, Ngữ Văn',
  D14: 'Ngữ Văn, Lịch Sử, Tiếng Anh',
  D15: 'Ngữ Văn, Địa Lý, Tiếng Anh',
  D66: 'Ngữ Văn, Giáo dục công dân, Tiếng Anh',
  D90: 'Toán, Khoa học tự nhiên, Tiếng Anh',
  DGNL: 'Điểm thi Đánh giá Năng lực (ĐHQG)',
  HOCBA: 'Xét học bạ THPT',
  SAT: 'Điểm thi SAT quốc tế',
  IELTS: 'Chứng chỉ IELTS',
};

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    @InjectRepository(University)
    private readonly universityRepo: Repository<University>,
    @InjectRepository(Campus)
    private readonly campusRepo: Repository<Campus>,
    @InjectRepository(Major)
    private readonly majorRepo: Repository<Major>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    @InjectRepository(AdmissionMethod)
    private readonly methodRepo: Repository<AdmissionMethod>,
    @InjectRepository(AdmissionRule)
    private readonly ruleRepo: Repository<AdmissionRule>,
    @InjectRepository(AdmissionScore)
    private readonly scoreRepo: Repository<AdmissionScore>,
    @InjectRepository(DataImport)
    private readonly importRepo: Repository<DataImport>,
  ) {}

  /**
   * Main import method - processes a full import payload
   * Handles deduplication at every level
   */
  async importData(payload: ImportPayload): Promise<ImportResult> {
    const result: ImportResult = {
      importId: '',
      universitiesAdded: 0,
      universitiesUpdated: 0,
      programsAdded: 0,
      programsUpdated: 0,
      scoresAdded: 0,
      duplicatesSkipped: 0,
      warnings: [],
      errors: [],
    };

    // Ensure admission methods exist
    await this.ensureAdmissionMethods();

    for (const uniDto of payload.universities) {
      try {
        const uni = await this.upsertUniversity(uniDto, result);

        // Upsert campuses
        const campusMap: Record<string, string> = {};
        if (uniDto.campuses?.length) {
          for (const campDto of uniDto.campuses) {
            const campus = await this.upsertCampus(campDto, uni.id);
            campusMap[campDto.city] = campus.id;
          }
        }

        // Get default campus ID
        const defaultCampusId = Object.values(campusMap)[0] || null;

        // Upsert programs
        if (uniDto.programs?.length) {
          for (const progDto of uniDto.programs) {
            try {
              const program = await this.upsertProgram(progDto, uni.id, defaultCampusId ?? undefined, payload.dataYear, payload.sourceUrl ?? '', result);

              // Upsert admission rules and benchmark scores
              if (progDto.admissionRules?.length) {
                for (const ruleDto of progDto.admissionRules) {
                  try {
                    await this.upsertAdmissionRule(ruleDto, program.id, payload.dataYear, result);
                  } catch (e) {
                    result.errors.push(`Rule error for ${progDto.name}: ${e.message}`);
                  }
                }
              }
            } catch (e) {
              result.errors.push(`Program error ${progDto.name}: ${e.message}`);
            }
          }
        }
      } catch (e) {
        result.errors.push(`University error ${uniDto.code}: ${e.message}`);
      }
    }

    // Save import log
    try {
      const importLog = this.importRepo.create({
        sourceName: payload.sourceName,
        sourceUrl: payload.sourceUrl ?? undefined,
        dataYear: payload.dataYear,
        universitiesCount: result.universitiesAdded + result.universitiesUpdated,
        programsCount: result.programsAdded + result.programsUpdated,
        scoresCount: result.scoresAdded,
        duplicatesSkipped: result.duplicatesSkipped,
        status: result.errors.length === 0 ? 'SUCCESS' : (result.programsAdded > 0 ? 'PARTIAL' : 'FAILED'),
        notes: result.errors.length > 0 ? result.errors.slice(0, 5).join('\n') : undefined,
      });
      const saved = await this.importRepo.save(importLog) as any;
      result.importId = saved.id;
    } catch (e) {
      this.logger.error('Failed to save import log', e);
    }

    return result;
  }

  private async upsertUniversity(dto: UniversityImportDto, result: ImportResult): Promise<University> {
    let uni = await this.universityRepo.findOne({ where: { code: dto.code } });
    if (uni) {
      // Update existing
      uni.nameVi = dto.nameVi || uni.nameVi;
      uni.nameEn = dto.nameEn || uni.nameEn;
      uni.website = dto.website || uni.website;
      uni.description = dto.description || uni.description;
      uni.isPublic = dto.isPublic !== undefined ? dto.isPublic : uni.isPublic;
      uni.localRanking = dto.localRanking || uni.localRanking;
      uni.logoUrl = dto.logoUrl || uni.logoUrl;
      await this.universityRepo.save(uni);
      result.universitiesUpdated++;
    } else {
      uni = this.universityRepo.create({
        code: dto.code,
        nameVi: dto.nameVi,
        nameEn: dto.nameEn,
        website: dto.website,
        description: dto.description,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
        localRanking: dto.localRanking,
        logoUrl: dto.logoUrl,
        averageTuition: 0,
      });
      await this.universityRepo.save(uni);
      result.universitiesAdded++;
    }
    return uni;
  }

  private async upsertCampus(dto: CampusImportDto, universityId: string): Promise<Campus> {
    let campus = await this.campusRepo.findOne({ where: { universityId, city: dto.city } });
    if (!campus) {
      campus = this.campusRepo.create({
        universityId,
        name: dto.name,
        address: dto.address,
        city: dto.city,
      });
      await this.campusRepo.save(campus);
    } else {
      campus.address = dto.address || campus.address;
      campus.name = dto.name || campus.name;
      await this.campusRepo.save(campus);
    }
    return campus;
  }

  private async upsertProgram(
    dto: ProgramImportDto,
    universityId: string,
    defaultCampusId: string | undefined,
    dataYear: number,
    dataSource: string,
    result: ImportResult
  ): Promise<Program> {
    const trainingType = dto.trainingType || 'DAI_TRA';
    const year = dto.dataYear || dataYear;

    // Ensure major exists in master table
    const major = await this.ensureMajor(dto.majorCode, dto.name);

    // Dedup key: universityId + majorCode + trainingType + dataYear
    let program = await this.programRepo.findOne({
      where: { universityId, majorCode: dto.majorCode, trainingType, dataYear: year }
    });

    if (program) {
      // Update existing program
      program.name = dto.name || program.name;
      program.tuitionFee = dto.tuitionFee ?? program.tuitionFee;
      program.tuitionFeeMax = dto.tuitionFeeMax ?? program.tuitionFeeMax;
      program.totalQuota = dto.totalQuota ?? program.totalQuota;
      program.language = dto.language || program.language;
      program.durationYears = dto.durationYears ?? program.durationYears;
      program.dataSource = dto.dataSource || dataSource || program.dataSource;
      program.majorId = major?.id || program.majorId;
      program.campusId = defaultCampusId || program.campusId;
      await this.programRepo.save(program);
      result.programsUpdated++;
      result.duplicatesSkipped++;
    } else {
      program = this.programRepo.create({
        universityId,
        majorId: major?.id ?? undefined,
        campusId: defaultCampusId ?? undefined,
        majorCode: dto.majorCode,
        name: dto.name,
        trainingType,
        language: dto.language || 'Tiếng Việt',
        tuitionFee: dto.tuitionFee || 0,
        tuitionFeeMax: dto.tuitionFeeMax ?? undefined,
        durationYears: dto.durationYears || 4.0,
        totalQuota: dto.totalQuota || 0,
        dataYear: year,
        dataSource: dto.dataSource || dataSource,
      });
      await this.programRepo.save(program);
      result.programsAdded++;
    }

    // Update university's averageTuition
    if (dto.tuitionFee) {
      await this.updateUniversityAvgTuition(universityId);
    }

    return program;
  }

  private async upsertAdmissionRule(
    dto: AdmissionRuleImportDto,
    programId: string,
    dataYear: number,
    result: ImportResult
  ): Promise<void> {
    const method = await this.methodRepo.findOne({ where: { code: dto.methodCode } });
    if (!method) {
      result.warnings.push(`Unknown admission method: ${dto.methodCode}`);
      return;
    }

    const applyYear = dto.applyYear || dataYear;
    const combDesc = dto.combinationDescription || 
                     (dto.subjectCombination ? SUBJECT_COMBINATION_MAP[dto.subjectCombination] : null) || 
                     null;

    // Dedup key: programId + admissionMethodId + subjectCombination + applyYear
    let rule = await this.ruleRepo.findOne({
      where: {
        programId,
        admissionMethodId: method.id,
        subjectCombination: dto.subjectCombination ?? undefined,
        applyYear,
      }
    });

    if (!rule) {
      rule = this.ruleRepo.create({
        programId,
        admissionMethodId: method.id,
        subjectCombination: dto.subjectCombination ?? undefined,
        combinationDescription: combDesc ?? undefined,
        formulaExpression: dto.formulaExpression || this.getDefaultFormula(dto.methodCode, dto.subjectCombination ?? ''),
        subjectWeights: dto.subjectWeights ? JSON.stringify(dto.subjectWeights) : undefined,
        minScoreThreshold: dto.minScoreThreshold || 0,
        quota: dto.quota || 0,
        applyYear,
      });
      await this.ruleRepo.save(rule);
    } else {
      rule.quota = dto.quota ?? rule.quota;
      rule.minScoreThreshold = dto.minScoreThreshold ?? rule.minScoreThreshold;
      rule.formulaExpression = dto.formulaExpression || rule.formulaExpression;
      await this.ruleRepo.save(rule);
    }

    // Upsert benchmark scores
    if (dto.benchmarkScores?.length) {
      for (const scoreDto of dto.benchmarkScores) {
        let score = await this.scoreRepo.findOne({
          where: { admissionRuleId: rule.id, year: scoreDto.year }
        });
        if (!score) {
          score = this.scoreRepo.create({
            admissionRuleId: rule.id,
            year: scoreDto.year,
            benchmarkScore: scoreDto.benchmarkScore,
            totalAdmitted: scoreDto.totalAdmitted || 0,
          });
          await this.scoreRepo.save(score);
          result.scoresAdded++;
        } else {
          // Update if better source
          score.benchmarkScore = scoreDto.benchmarkScore;
          score.totalAdmitted = scoreDto.totalAdmitted || score.totalAdmitted;
          await this.scoreRepo.save(score);
        }
      }
    }
  }

  private async ensureMajor(majorCode: string, programName: string): Promise<Major | null> {
    if (!majorCode) return null;
    let major = await this.majorRepo.findOne({ where: { code: majorCode } });
    if (!major) {
      major = this.majorRepo.create({
        code: majorCode,
        nameVi: this.inferMajorName(majorCode, programName),
        sector: this.inferSector(majorCode),
      });
      await this.majorRepo.save(major);
    }
    return major;
  }

  private async ensureAdmissionMethods(): Promise<void> {
    const methods = [
      { code: 'THPT', name: 'Xét điểm thi tốt nghiệp THPT', description: 'Xét tuyển dựa trên kết quả kỳ thi tốt nghiệp THPT quốc gia' },
      { code: 'HOCBA', name: 'Xét học bạ THPT', description: 'Xét tuyển dựa trên kết quả học tập ở bậc THPT' },
      { code: 'DGNL_HCM', name: 'Xét điểm ĐGNL ĐHQG-HCM', description: 'Xét tuyển dựa trên kỳ thi Đánh giá năng lực ĐHQG TP.HCM' },
      { code: 'DGNL_HN', name: 'Xét điểm ĐGNL ĐHQG Hà Nội', description: 'Xét tuyển dựa trên kỳ thi Đánh giá năng lực ĐHQG Hà Nội' },
      { code: 'COMBINED', name: 'Xét tuyển kết hợp (IELTS/SAT)', description: 'Xét tuyển kết hợp chứng chỉ quốc tế' },
      { code: 'XDTN', name: 'Xét điểm thi năng khiếu', description: 'Xét tuyển dựa trên điểm thi năng khiếu/nghệ thuật' },
      { code: 'TUYEN_THANG', name: 'Tuyển thẳng', description: 'Tuyển thẳng thí sinh đạt giải/xuất sắc' },
    ];

    for (const m of methods) {
      const exists = await this.methodRepo.findOne({ where: { code: m.code } });
      if (!exists) {
        await this.methodRepo.save(this.methodRepo.create(m));
      }
    }
  }

  private getDefaultFormula(methodCode: string, subjectCombination: string): string {
    if (methodCode === 'DGNL_HCM' || methodCode === 'DGNL_HN') return 'DGNL + PriorityBonus';
    if (methodCode === 'HOCBA') return 'Grade10 + Grade11 + Grade12';
    if (methodCode === 'COMBINED') return 'Certificate + PriorityBonus';

    // THPT - parse subject combination
    const comboMap: Record<string, string> = {
      A00: 'Math + Physics + Chemistry + PriorityBonus',
      A01: 'Math + Physics + English + PriorityBonus',
      B00: 'Math + Chemistry + Biology + PriorityBonus',
      D01: 'Literature + Math + English + PriorityBonus',
      D07: 'Math + Chemistry + English + PriorityBonus',
    };
    return comboMap[subjectCombination] || 'Math + Physics + Chemistry + PriorityBonus';
  }

  private inferMajorName(code: string, programName: string): string {
    // Clean program name to get major name (remove CLC, tiên tiến, etc.)
    return programName
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/chất lượng cao/gi, '')
      .replace(/tiên tiến/gi, '')
      .replace(/kỹ sư tài năng/gi, '')
      .replace(/định hướng nghiên cứu/gi, '')
      .trim();
  }

  private inferSector(majorCode: string): string {
    const code = parseInt(majorCode.substring(0, 2));
    const sectorMap: Record<number, string> = {
      74: 'Công nghệ thông tin',
      52: 'Kinh tế',
      58: 'Luật',
      72: 'Y - Dược',
      76: 'Máy tính & CNTT',
      78: 'Kỹ thuật',
      60: 'Khoa học xã hội',
      22: 'Nghệ thuật',
      71: 'Khoa học sức khỏe',
    };
    return sectorMap[code] || 'Khác';
  }

  private async updateUniversityAvgTuition(universityId: string): Promise<void> {
    const programs = await this.programRepo.find({ where: { universityId, isActive: true } });
    if (programs.length === 0) return;
    const totalFee = programs.reduce((sum, p) => sum + (Number(p.tuitionFee) || 0), 0);
    const avgFee = totalFee / programs.length;
    await this.universityRepo.update(universityId, { averageTuition: avgFee });
  }

  async getImportHistory(): Promise<DataImport[]> {
    return this.importRepo.find({ order: { createdAt: 'DESC' }, take: 50 });
  }

  private resolveDataDir(): string {
    const fs = require('fs');
    const path = require('path');
    
    // Attempt 1: Process.cwd() is project root
    let dir = path.join(process.cwd(), 'data', 'imports');
    if (fs.existsSync(dir)) return dir;

    // Attempt 2: Process.cwd() is apps/backend
    dir = path.join(process.cwd(), '..', '..', 'data', 'imports');
    if (fs.existsSync(dir)) return dir;

    // Attempt 3: Relative to __dirname
    dir = path.join(__dirname, '..', '..', '..', '..', 'data', 'imports');
    if (fs.existsSync(dir)) return dir;

    return path.join(process.cwd(), 'data', 'imports'); // Fallback
  }

  async getPresets() {
    const fs = require('fs');
    const path = require('path');
    const dataDir = this.resolveDataDir();
    if (!fs.existsSync(dataDir)) {
      return [];
    }
    const files = fs.readdirSync(dataDir).filter((f: string) => f.endsWith('.json'));
    const presets = [];
    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Count universities, programs, scores
        const uniCount = content.universities?.length || 0;
        let progCount = 0;
        let scoreCount = 0;
        content.universities?.forEach((u: any) => {
          progCount += u.programs?.length || 0;
          u.programs?.forEach((p: any) => {
            p.admissionRules?.forEach((r: any) => {
              scoreCount += r.benchmarkScores?.length || 0;
            });
          });
        });

        presets.push({
          filename: file,
          sourceName: content.sourceName,
          sourceUrl: content.sourceUrl,
          dataYear: content.dataYear,
          universitiesCount: uniCount,
          programsCount: progCount,
          scoresCount: scoreCount,
        });
      } catch (e) {
        // Skip invalid JSON
      }
    }
    return presets;
  }

  async runPreset(filename: string): Promise<ImportResult> {
    const fs = require('fs');
    const path = require('path');
    const dataDir = this.resolveDataDir();
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filename}`);
    }
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return this.importData(payload);
  }
}
