import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { University } from '../database/entities/university.entity';
import { Major } from '../database/entities/major.entity';
import { Program } from '../database/entities/program.entity';
import { AdmissionMethod } from '../database/entities/admission-method.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';
import { Grade10School } from '../grade10-hcm/entities/school.entity';
import { Grade10District } from '../grade10-hcm/entities/district.entity';
import { Grade10Cutoff } from '../grade10-hcm/entities/cutoff.entity';
import { SearchCutoffsDto, ImportCutoffsDto } from './ai-assistant.controller';

@Injectable()
export class AiAssistantService {
  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,
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

    @InjectRepository(Grade10School)
    private readonly grade10SchoolRepo: Repository<Grade10School>,
    @InjectRepository(Grade10District)
    private readonly grade10DistrictRepo: Repository<Grade10District>,
    @InjectRepository(Grade10Cutoff)
    private readonly grade10CutoffRepo: Repository<Grade10Cutoff>
  ) {}

  /**
   * Processes a natural language query in Vietnamese and returns data fetched directly from the database.
   */
  async chat(message: string): Promise<{ reply: string; data?: any }> {
    const queryLower = message.toLowerCase();

    // 1. Search for tuition fees (Học phí)
    if (queryLower.includes('học phí') || queryLower.includes('tuition')) {
      const match = queryLower.match(/dưới\s+(\d+)\s+(triệu|tr)/) || queryLower.match(/under\s+(\d+)\s+million/);
      let maxTuition = 100000000; // default large limit
      
      if (match) {
        maxTuition = parseInt(match[1]) * 1000000;
      }

      const universities = await this.universityRepository.find({
        relations: { campuses: true }
      });
      
      const filtered = universities.filter(u => Number(u.averageTuition) <= maxTuition);
      
      if (filtered.length === 0) {
        return {
          reply: `Tôi không tìm thấy trường nào có học phí dưới ${(maxTuition/1000000).toFixed(0)} triệu đồng trong hệ thống ĐHQG-HCM.`
        };
      }

      const listStr = filtered.map(u => `- **${u.nameVi}** (${u.code}): Học phí bình quân ~${(Number(u.averageTuition)/1000000).toFixed(0)} triệu VNĐ/năm.`).join('\n');
      return {
        reply: `Dưới đây là danh sách các trường có học phí phù hợp với yêu cầu của bạn:\n\n${listStr}`,
        data: filtered
      };
    }

    // 2. Search for benchmark scores (Điểm chuẩn)
    if (queryLower.includes('điểm chuẩn') || queryLower.includes('điểm tuyển sinh')) {
      const scores = await this.scoreRepository.find({
        relations: {
          admissionRule: {
            program: {
              university: true,
              major: true
            },
            admissionMethod: true
          }
        },
        order: { year: 'DESC' }
      });

      let searchMajor = '';
      if (queryLower.includes('khoa học máy tính') || queryLower.includes('khmt')) searchMajor = 'Khoa học máy tính';
      else if (queryLower.includes('kỹ thuật phần mềm') || queryLower.includes('ktpm')) searchMajor = 'Kỹ thuật phần mềm';
      else if (queryLower.includes('công nghệ thông tin') || queryLower.includes('cntt')) searchMajor = 'Công nghệ thông tin';

      if (searchMajor) {
        const filteredScores = scores.filter(s => s.admissionRule?.program?.major?.nameVi.toLowerCase().includes(searchMajor.toLowerCase()));
        
        if (filteredScores.length === 0) {
          return {
            reply: `Không tìm thấy điểm chuẩn cho ngành ${searchMajor} trong lịch sử.`
          };
        }

        const scoresStr = filteredScores.slice(0, 8).map(s => 
          `- Năm **${s.year}** | **${s.admissionRule.program.university.code}** | Ngành: *${s.admissionRule.program.name}* | Phương thức: *${s.admissionRule.admissionMethod.name}* | Điểm chuẩn: **${s.benchmarkScore}**`
        ).join('\n');

        return {
          reply: `Dưới đây là điểm chuẩn lịch sử của ngành **${searchMajor}** được ghi nhận trong cơ sở dữ liệu:\n\n${scoresStr}`,
          data: filteredScores
        };
      }

      return {
        reply: `Để tra cứu điểm chuẩn, bạn vui lòng chỉ định cụ thể ngành học (ví dụ: "điểm chuẩn khoa học máy tính", "điểm chuẩn công nghệ thông tin").`
      };
    }

    // 3. Search for university specific information
    if (queryLower.includes('trường') || queryLower.includes('đại học')) {
      const universities = await this.universityRepository.find({
        relations: { campuses: true }
      });

      let foundUniv: University | undefined;
      for (const u of universities) {
        if (queryLower.includes(u.code.toLowerCase()) || queryLower.includes(u.nameVi.toLowerCase())) {
          foundUniv = u;
          break;
        }
      }

      if (foundUniv) {
        return {
          reply: `**${foundUniv.nameVi}** (${foundUniv.code}):\n- **Địa chỉ:** ${foundUniv.campuses[0]?.address || 'Khu đô thị ĐHQG-HCM'}.\n- **Học phí trung bình:** ~${(Number(foundUniv.averageTuition)/1000000).toFixed(0)} triệu VNĐ/năm.\n- **Website:** [${foundUniv.website}](${foundUniv.website}).\n- **Xếp hạng nội địa:** Top #${foundUniv.localRanking || 'N/A'}.\n\nTrường đang tuyển sinh các ngành kỹ thuật mũi nhọn như Khoa học máy tính, Kỹ thuật phần mềm với các phương thức xét THPT và ĐGNL.`
        };
      }
    }

    return {
      reply: `Xin chào! Tôi là Trợ lý Tuyển sinh AI RAG. Tôi có thể truy vấn trực tiếp cơ sở dữ liệu để giải đáp cho bạn:\n\n1. **Tra cứu học phí:** Bạn có thể hỏi "Học phí trường nào dưới 40 triệu?"\n2. **Tra cứu điểm chuẩn:** Bạn có thể hỏi "Điểm chuẩn ngành khoa học máy tính?"\n3. **Tra cứu thông tin trường:** Bạn có thể hỏi "Thông tin trường QSC?"\n\nHãy nhập câu hỏi của bạn để tôi tìm kiếm thông tin chính xác nhất từ hệ thống!`
    };
  }

  // ==========================================
  // GEMINI GOOGLE SEARCH & IMPORT ENGINE
  // ==========================================

  private validatePassword(password?: string) {
    if (password !== 'hahaha') {
      throw new ForbiddenException('Mật khẩu xác nhận không chính xác!');
    }
  }

  private getGeminiApiKey(): string {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('Chưa cấu hình GEMINI_API_KEY trong file .env');
    }
    return apiKey;
  }

  async searchCutoffs(dto: SearchCutoffsDto) {
    this.validatePassword(dto.password);
    const apiKey = this.getGeminiApiKey();

    // 1. Construct prompt
    let prompt = '';
    if (dto.type === 'GRADE10') {
      prompt = `Tìm kiếm chính xác điểm chuẩn tuyển sinh lớp 10 THPT công lập của trường "${dto.schoolQuery}" tại TP.HCM trong 10 năm qua (từ 2016 đến 2025). Tìm điểm chuẩn của cả 3 Nguyện vọng (NV1, NV2, NV3).`;
    } else {
      prompt = `Tìm kiếm chính xác điểm chuẩn tuyển sinh đại học theo phương thức thi tốt nghiệp THPT của trường "${dto.schoolQuery}" cho ngành "${dto.majorQuery}" trong 10 năm qua (từ 2016 đến 2025).`;
    }

    // 2. Perform Gemini Google Search Grounding request
    const responseText = await this.callGeminiSearch(apiKey, prompt);

    // 3. Format text into strict JSON structure
    const structuredJson = await this.parseJsonWithGemini(apiKey, responseText, dto.type);

    // 4. Match with database records
    return this.compareWithDatabase(dto, structuredJson);
  }

  private async callGeminiSearch(apiKey: string, prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        tools: [{ googleSearch: {} }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new BadRequestException(`Gemini API error: ${errText}`);
    }

    const resJson = await response.json();
    const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new BadRequestException('Không nhận được phản hồi tìm kiếm từ Gemini.');
    }
    return text;
  }

  private async parseJsonWithGemini(apiKey: string, text: string, type: 'GRADE10' | 'UNIVERSITY'): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const prompt = `Dưới đây là kết quả tìm kiếm điểm chuẩn. Hãy trích xuất và định dạng kết quả này thành cấu trúc JSON nghiêm ngặt theo schema mô tả.\n\nVăn bản:\n${text}`;
    
    const schema = type === 'GRADE10' ? {
      type: 'OBJECT',
      properties: {
        schoolName: { type: 'STRING' },
        schoolCode: { type: 'STRING' },
        cutoffs: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              year: { type: 'INTEGER' },
              cutoffNV1: { type: 'NUMBER' },
              cutoffNV2: { type: 'NUMBER' },
              cutoffNV3: { type: 'NUMBER' }
            },
            required: ['year', 'cutoffNV1']
          }
        }
      },
      required: ['schoolName', 'cutoffs']
    } : {
      type: 'OBJECT',
      properties: {
        schoolName: { type: 'STRING' },
        schoolCode: { type: 'STRING' },
        majorName: { type: 'STRING' },
        majorCode: { type: 'STRING' },
        cutoffs: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              year: { type: 'INTEGER' },
              cutoffNV1: { type: 'NUMBER' }
            },
            required: ['year', 'cutoffNV1']
          }
        }
      },
      required: ['schoolName', 'majorName', 'cutoffs']
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      })
    });

    if (!response.ok) {
      throw new BadRequestException('Lỗi trích xuất cấu trúc dữ liệu JSON từ AI.');
    }

    const resJson = await response.json();
    const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(rawText);
  }

  private async compareWithDatabase(dto: SearchCutoffsDto, aiData: any) {
    if (dto.type === 'GRADE10') {
      // Find matching school in G10HCM_SCHOOL
      let school = await this.grade10SchoolRepo.findOne({
        where: [
          { code: aiData.schoolCode || '___' },
          { name: Like(`%${dto.schoolQuery}%`) }
        ]
      });

      if (!school) {
        // Fallback: create mock school name for UI preview if not found
        school = this.grade10SchoolRepo.create({
          code: aiData.schoolCode || dto.schoolQuery.toUpperCase().replace(/\s+/g, '_'),
          name: dto.schoolQuery,
        });
      }

      const existingCutoffs = await this.grade10CutoffRepo.find({
        where: { schoolId: school.id }
      });

      const results = aiData.cutoffs.map((item: any) => {
        const dbRecord = existingCutoffs.find(c => c.year === item.year);
        return {
          year: item.year,
          cutoffNV1: item.cutoffNV1,
          cutoffNV2: item.cutoffNV2 || null,
          cutoffNV3: item.cutoffNV3 || null,
          exists: !!dbRecord,
          existingScore: dbRecord ? {
            cutoffNV1: Number(dbRecord.cutoffNV1),
            cutoffNV2: dbRecord.cutoffNV2 ? Number(dbRecord.cutoffNV2) : null,
            cutoffNV3: dbRecord.cutoffNV3 ? Number(dbRecord.cutoffNV3) : null
          } : null
        };
      });

      return {
        schoolName: school.name,
        schoolCode: school.code,
        type: 'GRADE10',
        results
      };
    } else {
      // UNIVERSITY MATCHING
      let uni = await this.universityRepository.findOne({
        where: [
          { code: aiData.schoolCode || '___' },
          { nameVi: Like(`%${dto.schoolQuery}%`) }
        ]
      });

      if (!uni) {
        uni = this.universityRepository.create({
          code: aiData.schoolCode || dto.schoolQuery.toUpperCase().substring(0, 5),
          nameVi: dto.schoolQuery
        });
      }

      // Find Program matching major
      let program = await this.programRepository.findOne({
        where: {
          universityId: uni.id,
          majorCode: Like(`%${aiData.majorCode || ''}%`)
        }
      });

      if (!program) {
        // Match by major name
        const majors = await this.majorRepository.find();
        const matchedMajor = majors.find(m => m.nameVi.toLowerCase().includes((dto.majorQuery || '').toLowerCase()));
        if (matchedMajor) {
          program = await this.programRepository.findOne({
            where: { universityId: uni.id, majorCode: matchedMajor.code }
          });
        }
      }

      const existingScores = program ? await this.scoreRepository.find({
        where: { admissionRule: { program: { id: program.id } } }
      }) : [];

      const results = aiData.cutoffs.map((item: any) => {
        const dbRecord = existingScores.find(s => s.year === item.year);
        return {
          year: item.year,
          cutoffNV1: item.cutoffNV1,
          exists: !!dbRecord,
          existingScore: dbRecord ? {
            cutoffNV1: Number(dbRecord.benchmarkScore)
          } : null
        };
      });

      return {
        schoolName: uni.nameVi,
        schoolCode: uni.code,
        majorName: aiData.majorName || dto.majorQuery,
        majorCode: program ? program.majorCode : (aiData.majorCode || 'N/A'),
        type: 'UNIVERSITY',
        results
      };
    }
  }

  async importCutoffs(dto: ImportCutoffsDto) {
    this.validatePassword(dto.password);
    let importedCount = 0;

    if (dto.type === 'GRADE10') {
      let school = await this.grade10SchoolRepo.findOne({ where: { code: dto.schoolCode } });
      if (!school) {
        // Create school if not exists
        school = this.grade10SchoolRepo.create({
          code: dto.schoolCode,
          name: dto.schoolCode.replace(/_/g, ' '),
        });
        school = await this.grade10SchoolRepo.save(school);
      }

      for (const item of dto.overrides) {
        let cutoff = await this.grade10CutoffRepo.findOne({
          where: { schoolId: school.id, year: item.year, programType: 'REGULAR' }
        });
        if (!cutoff) {
          cutoff = this.grade10CutoffRepo.create({
            schoolId: school.id,
            year: item.year,
            cutoffNV1: item.cutoffNV1,
            cutoffNV2: item.cutoffNV2,
            cutoffNV3: item.cutoffNV3,
            programType: 'REGULAR'
          });
        } else {
          cutoff.cutoffNV1 = item.cutoffNV1;
          cutoff.cutoffNV2 = item.cutoffNV2;
          cutoff.cutoffNV3 = item.cutoffNV3;
        }
        await this.grade10CutoffRepo.save(cutoff);
        importedCount++;
      }
    } else {
      // UNIVERSITY IMPORT
      let uni = await this.universityRepository.findOne({ where: { code: dto.schoolCode } });
      if (!uni) {
        uni = this.universityRepository.create({
          code: dto.schoolCode,
          nameVi: dto.schoolCode
        });
        uni = await this.universityRepository.save(uni);
      }

      // Check method THPT
      let method = await this.methodRepository.findOne({ where: { code: 'THPT' } });
      if (!method) {
        method = this.methodRepository.create({ code: 'THPT', name: 'Điểm thi THPT Quốc gia' });
        method = await this.methodRepository.save(method);
      }

      // Check Program
      let program = await this.programRepository.findOne({
        where: { universityId: uni.id, majorCode: dto.majorCode }
      });
      if (!program) {
        program = this.programRepository.create({
          universityId: uni.id,
          majorCode: dto.majorCode || 'N/A',
          code: `${uni.code}-${dto.majorCode || 'N/A'}-DAI_TRA`,
          name: dto.majorCode || 'N/A',
          trainingType: 'DAI_TRA'
        });
        program = await this.programRepository.save(program);
      }

      // Check Rule
      let rule = await this.ruleRepository.findOne({
        where: { program: { id: program.id }, admissionMethod: { id: method.id } }
      });
      if (!rule) {
        rule = this.ruleRepository.create({
          programId: program.id,
          admissionMethodId: method.id,
          formulaExpression: 'Math + Physics + Chemistry'
        });
        rule = await this.ruleRepository.save(rule);
      }

      for (const item of dto.overrides) {
        let score = await this.scoreRepository.findOne({
          where: { admissionRule: { id: rule.id }, year: item.year }
        });
        if (!score) {
          score = this.scoreRepository.create({
            admissionRule: rule,
            year: item.year,
            benchmarkScore: item.cutoffNV1
          });
        } else {
          score.benchmarkScore = item.cutoffNV1;
        }
        await this.scoreRepository.save(score);
        importedCount++;
      }
    }

    return {
      success: true,
      importedCount
    };
  }
}
