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
exports.AiAssistantService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
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
let AiAssistantService = class AiAssistantService {
    configService;
    universityRepository;
    majorRepository;
    programRepository;
    methodRepository;
    ruleRepository;
    scoreRepository;
    grade10SchoolRepo;
    grade10DistrictRepo;
    grade10CutoffRepo;
    grade10QuotaRepo;
    constructor(configService, universityRepository, majorRepository, programRepository, methodRepository, ruleRepository, scoreRepository, grade10SchoolRepo, grade10DistrictRepo, grade10CutoffRepo, grade10QuotaRepo) {
        this.configService = configService;
        this.universityRepository = universityRepository;
        this.majorRepository = majorRepository;
        this.programRepository = programRepository;
        this.methodRepository = methodRepository;
        this.ruleRepository = ruleRepository;
        this.scoreRepository = scoreRepository;
        this.grade10SchoolRepo = grade10SchoolRepo;
        this.grade10DistrictRepo = grade10DistrictRepo;
        this.grade10CutoffRepo = grade10CutoffRepo;
        this.grade10QuotaRepo = grade10QuotaRepo;
    }
    async chat(message) {
        const queryLower = message.toLowerCase();
        if (queryLower.includes('học phí') || queryLower.includes('tuition')) {
            const match = queryLower.match(/dưới\s+(\d+)\s+(triệu|tr)/) ||
                queryLower.match(/under\s+(\d+)\s+million/);
            let maxTuition = 100000000;
            if (match) {
                maxTuition = parseInt(match[1]) * 1000000;
            }
            const universities = await this.universityRepository.find({
                relations: { campuses: true },
            });
            const filtered = universities.filter((u) => Number(u.averageTuition) <= maxTuition);
            if (filtered.length === 0) {
                return {
                    reply: `Tôi không tìm thấy trường nào có học phí dưới ${(maxTuition / 1000000).toFixed(0)} triệu đồng trong hệ thống ĐHQG-HCM.`,
                };
            }
            const listStr = filtered
                .map((u) => `- **${u.nameVi}** (${u.code}): Học phí bình quân ~${(Number(u.averageTuition) / 1000000).toFixed(0)} triệu VNĐ/năm.`)
                .join('\n');
            return {
                reply: `Dưới đây là danh sách các trường có học phí phù hợp với yêu cầu của bạn:\n\n${listStr}`,
                data: filtered,
            };
        }
        if (queryLower.includes('điểm chuẩn') ||
            queryLower.includes('điểm tuyển sinh')) {
            const scores = await this.scoreRepository.find({
                relations: {
                    admissionRule: {
                        program: {
                            university: true,
                            major: true,
                        },
                        admissionMethod: true,
                    },
                },
                order: { year: 'DESC' },
            });
            let searchMajor = '';
            if (queryLower.includes('khoa học máy tính') ||
                queryLower.includes('khmt'))
                searchMajor = 'Khoa học máy tính';
            else if (queryLower.includes('kỹ thuật phần mềm') ||
                queryLower.includes('ktpm'))
                searchMajor = 'Kỹ thuật phần mềm';
            else if (queryLower.includes('công nghệ thông tin') ||
                queryLower.includes('cntt'))
                searchMajor = 'Công nghệ thông tin';
            if (searchMajor) {
                const filteredScores = scores.filter((s) => s.admissionRule?.program?.major?.nameVi
                    .toLowerCase()
                    .includes(searchMajor.toLowerCase()));
                if (filteredScores.length === 0) {
                    return {
                        reply: `Không tìm thấy điểm chuẩn cho ngành ${searchMajor} trong lịch sử.`,
                    };
                }
                const scoresStr = filteredScores
                    .slice(0, 8)
                    .map((s) => `- Năm **${s.year}** | **${s.admissionRule.program.university.code}** | Ngành: *${s.admissionRule.program.name}* | Phương thức: *${s.admissionRule.admissionMethod.name}* | Điểm chuẩn: **${s.benchmarkScore}**`)
                    .join('\n');
                return {
                    reply: `Dưới đây là điểm chuẩn lịch sử của ngành **${searchMajor}** được ghi nhận trong cơ sở dữ liệu:\n\n${scoresStr}`,
                    data: filteredScores,
                };
            }
            return {
                reply: `Để tra cứu điểm chuẩn, bạn vui lòng chỉ định cụ thể ngành học (ví dụ: "điểm chuẩn khoa học máy tính", "điểm chuẩn công nghệ thông tin").`,
            };
        }
        if (queryLower.includes('trường') || queryLower.includes('đại học')) {
            const universities = await this.universityRepository.find({
                relations: { campuses: true },
            });
            let foundUniv;
            for (const u of universities) {
                if (queryLower.includes(u.code.toLowerCase()) ||
                    queryLower.includes(u.nameVi.toLowerCase())) {
                    foundUniv = u;
                    break;
                }
            }
            if (foundUniv) {
                return {
                    reply: `**${foundUniv.nameVi}** (${foundUniv.code}):\n- **Địa chỉ:** ${foundUniv.campuses[0]?.address || 'Khu đô thị ĐHQG-HCM'}.\n- **Học phí trung bình:** ~${(Number(foundUniv.averageTuition) / 1000000).toFixed(0)} triệu VNĐ/năm.\n- **Website:** [${foundUniv.website}](${foundUniv.website}).\n- **Xếp hạng nội địa:** Top #${foundUniv.localRanking || 'N/A'}.\n\nTrường đang tuyển sinh các ngành kỹ thuật mũi nhọn như Khoa học máy tính, Kỹ thuật phần mềm với các phương thức xét THPT và ĐGNL.`,
                };
            }
        }
        return {
            reply: `Xin chào! Tôi là Trợ lý Tuyển sinh AI RAG. Tôi có thể truy vấn trực tiếp cơ sở dữ liệu để giải đáp cho bạn:\n\n1. **Tra cứu học phí:** Bạn có thể hỏi "Học phí trường nào dưới 40 triệu?"\n2. **Tra cứu điểm chuẩn:** Bạn có thể hỏi "Điểm chuẩn ngành khoa học máy tính?"\n3. **Tra cứu thông tin trường:** Bạn có thể hỏi "Thông tin trường QSC?"\n\nHãy nhập câu hỏi của bạn để tôi tìm kiếm thông tin chính xác nhất từ hệ thống!`,
        };
    }
    async searchCutoffs(dto) {
        const errors = [];
        const geminiKey = this.configService.get('GEMINI_API_KEY');
        if (geminiKey) {
            try {
                console.log('[AI Search] Attempting Gemini API...');
                let prompt = '';
                if (dto.type === 'GRADE10') {
                    prompt = `Bạn là một chuyên gia tra cứu dữ liệu giáo dục Việt Nam.

Nhiệm vụ:
Hãy tìm kiếm dữ liệu tuyển sinh lớp 10 THPT công lập tại TP.HCM cho đúng 1 trường được chỉ định bên dưới và trả về kết quả.

Trường cần tra:
- Tên trường: ${dto.schoolQuery}
- Mã trường: ${dto.schoolCode || 'Tự động xác định'}
- Quận/Huyện: ${dto.districtName || 'Tự động xác định'}
- Mã quận/huyện: ${dto.districtCode || 'Tự động xác định'}

Nguồn dữ liệu ưu tiên:
- https://hcm.edu.vn
- https://ts10.hcm.edu.vn
- Website chính thức của trường
- Tuổi Trẻ, VnExpress, hoặc báo giáo dục uy tín khác
- Google query theo mẫu:
  - "điểm chuẩn lớp 10 ${dto.schoolQuery} TP.HCM 2025"
  - "điểm chuẩn lớp 10 ${dto.schoolQuery} TP.HCM 2024"
  - "${dto.schoolQuery} tuyển sinh lớp 10 2025 chỉ tiêu"
  - "${dto.schoolQuery} số học sinh đăng ký nguyện vọng 1"

Các năm cần tìm:
- 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025
- Lấy được nhiều năm nhất có thể (tối đa 10 năm từ 2016-2025), ưu tiên độ chính xác hơn độ phủ.

Giải thích các trường điểm và chỉ tiêu cần lấy:
- cutoffNV1: điểm chuẩn nguyện vọng 1, bắt buộc phải có nếu tìm được
- cutoffNV2: điểm chuẩn nguyện vọng 2, nếu có
- cutoffNV3: điểm chuẩn nguyện vọng 3, nếu có
- quota: chỉ tiêu tuyển sinh của năm đó
- registeredCount: số học sinh đăng ký nguyện vọng 1 của năm đó
- competitionRatio = registeredCount / quota (nếu có hoặc tự tính)
- address: Địa chỉ cụ thể, số nhà, tên đường, phường/xã, quận/huyện của trường
- website: Địa chỉ website chính thức của trường THPT
- description: Đoạn văn giới thiệu chi tiết về lịch sử thành lập, cơ sở vật chất, hoạt động phong trào và thành tích nổi bật của trường
- mapUrl: Đường dẫn vị trí trên Google Maps (hoặc toạ độ nếu không có link)`;
                }
                else {
                    prompt = `Tìm kiếm chính xác điểm chuẩn tuyển sinh đại học theo phương thức thi tốt nghiệp THPT của trường "${dto.schoolQuery}" cho ngành "${dto.majorQuery}" trong 10 năm qua (từ 2016 đến 2025).`;
                }
                const text = await this.callGeminiSearch(geminiKey, prompt);
                const structuredJson = await this.parseJsonWithGemini(geminiKey, text, dto.type);
                return this.compareWithDatabase(dto, structuredJson);
            }
            catch (err) {
                console.warn(`[AI Search] Gemini API failed: ${err.message}`);
                errors.push(`Gemini: ${err.message}`);
            }
        }
        else {
            errors.push('Gemini: Chưa cấu hình GEMINI_API_KEY');
        }
        let searchContext = '';
        try {
            console.log('[AI Search] Scraped DuckDuckGo for fallback context...');
            const searchQuery = dto.type === 'GRADE10'
                ? `diem chuan lop 10 THPT ${dto.schoolQuery} TPHCM`
                : `diem chuan dai hoc ${dto.schoolQuery} nganh ${dto.majorQuery}`;
            searchContext = await this.fetchWebSearch(searchQuery);
        }
        catch (err) {
            console.warn(`[AI Search] Search scraper failed: ${err.message}`);
        }
        const openaiKey = this.configService.get('OPENAI_API_KEY');
        if (openaiKey) {
            try {
                console.log('[AI Search] Attempting OpenAI API...');
                const structuredJson = await this.callOpenAI(openaiKey, dto, searchContext);
                return this.compareWithDatabase(dto, structuredJson);
            }
            catch (err) {
                console.warn(`[AI Search] OpenAI API failed: ${err.message}`);
                errors.push(`OpenAI: ${err.message}`);
            }
        }
        else {
            errors.push('OpenAI: Chưa cấu hình OPENAI_API_KEY');
        }
        const claudeKey = this.configService.get('CLAUDE_API_KEY');
        if (claudeKey) {
            try {
                console.log('[AI Search] Attempting Claude API...');
                const structuredJson = await this.callClaude(claudeKey, dto, searchContext);
                return this.compareWithDatabase(dto, structuredJson);
            }
            catch (err) {
                console.warn(`[AI Search] Claude API failed: ${err.message}`);
                errors.push(`Claude: ${err.message}`);
            }
        }
        else {
            errors.push('Claude: Chưa cấu hình CLAUDE_API_KEY');
        }
        const groqKey = this.configService.get('GROQ_API_KEY');
        if (groqKey) {
            try {
                console.log('[AI Search] Attempting Groq API...');
                const structuredJson = await this.callGroq(groqKey, dto, searchContext);
                return this.compareWithDatabase(dto, structuredJson);
            }
            catch (err) {
                console.warn(`[AI Search] Groq API failed: ${err.message}`);
                errors.push(`Groq: ${err.message}`);
            }
        }
        else {
            errors.push('Groq: Chưa cấu hình GROQ_API_KEY');
        }
        throw new common_1.BadRequestException(`Tất cả các dịch vụ LLM đều thất bại:\n${errors.join('\n')}`);
    }
    async fetchWebSearch(query) {
        try {
            const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
                },
            });
            if (!response.ok)
                return '';
            const html = await response.text();
            const matches = html.matchAll(/<a class="result__snippet" href="[^"]*">([\s\S]*?)<\/a>/g);
            const snippets = [];
            for (const match of matches) {
                const cleanText = match[1]
                    .replace(/<[^>]*>/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                snippets.push(cleanText);
                if (snippets.length >= 6)
                    break;
            }
            return snippets.join('\n\n');
        }
        catch (e) {
            console.error('[AI Search] DuckDuckGo search scraper failed:', e);
            return '';
        }
    }
    async callGeminiSearch(apiKey, prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
                tools: [{ googleSearch: {} }],
            }),
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini status ${response.status}: ${errText}`);
        }
        const resJson = await response.json();
        const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('Không nhận được phản hồi từ Gemini Search.');
        }
        return text;
    }
    async parseJsonWithGemini(apiKey, text, type) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const prompt = `Dưới đây là thông tin điểm chuẩn. Hãy trích xuất và định dạng kết quả này thành cấu trúc JSON nghiêm ngặt theo schema mô tả.\n\nVăn bản:\n${text}`;
        const schema = this.getSchema(type);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                },
            }),
        });
        if (!response.ok) {
            throw new Error('Lỗi cấu trúc hoá JSON.');
        }
        const resJson = await response.json();
        const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(rawText);
    }
    async callOpenAI(apiKey, dto, searchContext) {
        const url = 'https://api.openai.com/v1/chat/completions';
        const schema = this.getSchema(dto.type);
        const prompt = `Dưới đây là kết quả tìm kiếm điểm chuẩn từ internet:\n\n${searchContext}\n\nHãy trích xuất dữ liệu trên và trả về duy nhất một đối tượng JSON khớp chính xác với JSON Schema sau:\n${JSON.stringify(schema)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            }),
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI status ${response.status}: ${errText}`);
        }
        const resJson = await response.json();
        const rawText = resJson.choices?.[0]?.message?.content;
        return JSON.parse(rawText);
    }
    async callClaude(apiKey, dto, searchContext) {
        const url = 'https://api.anthropic.com/v1/messages';
        const schema = this.getSchema(dto.type);
        const prompt = `Dưới đây là kết quả tìm kiếm điểm chuẩn từ internet:\n\n${searchContext}\n\nHãy trích xuất dữ liệu trên và trả về duy nhất một đối tượng JSON khớp chính xác với JSON Schema sau (không trả kèm giải thích hay từ ngữ nào khác, chỉ trả về JSON thuần):\n${JSON.stringify(schema)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2000,
                messages: [{ role: 'user', content: prompt }],
            }),
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Claude status ${response.status}: ${errText}`);
        }
        const resJson = await response.json();
        const rawText = resJson.content?.[0]?.text;
        const jsonMatch = rawText.match(/({[\s\S]*})/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }
        return JSON.parse(rawText);
    }
    async callGroq(apiKey, dto, searchContext) {
        const url = 'https://api.groq.com/openai/v1/chat/completions';
        const schema = this.getSchema(dto.type);
        const prompt = `Dưới đây là kết quả tìm kiếm điểm chuẩn từ internet:\n\n${searchContext}\n\nHãy trích xuất dữ liệu trên và trả về duy nhất một đối tượng JSON khớp chính xác với JSON Schema sau:\n${JSON.stringify(schema)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            }),
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq status ${response.status}: ${errText}`);
        }
        const resJson = await response.json();
        const rawText = resJson.choices?.[0]?.message?.content;
        return JSON.parse(rawText);
    }
    getSchema(type) {
        return type === 'GRADE10'
            ? {
                type: 'OBJECT',
                properties: {
                    schoolName: { type: 'STRING' },
                    schoolCode: { type: 'STRING' },
                    address: { type: 'STRING', description: 'Địa chỉ đầy đủ của trường THPT' },
                    website: { type: 'STRING', description: 'Địa chỉ trang web chính thức của trường THPT (nếu có)' },
                    description: { type: 'STRING', description: 'Bài viết giới thiệu chi tiết về lịch sử, thành tích, cơ sở vật chất của trường (dài khoảng 2-3 đoạn văn)' },
                    mapUrl: { type: 'STRING', description: 'URL bản đồ Google Maps hoặc toạ độ vị trí của trường' },
                    cutoffs: {
                        type: 'ARRAY',
                        items: {
                            type: 'OBJECT',
                            properties: {
                                year: { type: 'INTEGER' },
                                cutoffNV1: { type: 'NUMBER' },
                                cutoffNV2: { type: 'NUMBER' },
                                cutoffNV3: { type: 'NUMBER' },
                            },
                            required: ['year', 'cutoffNV1'],
                        },
                    },
                    quotas: {
                        type: 'ARRAY',
                        items: {
                            type: 'OBJECT',
                            properties: {
                                year: { type: 'INTEGER' },
                                quota: { type: 'INTEGER' },
                                registeredCount: { type: 'INTEGER' },
                                competitionRatio: { type: 'NUMBER' },
                            },
                            required: ['year', 'quota'],
                        },
                    },
                },
                required: ['schoolName', 'cutoffs'],
            }
            : {
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
                                cutoffNV1: { type: 'NUMBER' },
                            },
                            required: ['year', 'cutoffNV1'],
                        },
                    },
                },
                required: ['schoolName', 'majorName', 'cutoffs'],
            };
    }
    async compareWithDatabase(dto, aiData) {
        if (dto.type === 'GRADE10') {
            let school = await this.grade10SchoolRepo.findOne({
                where: [
                    { code: aiData.schoolCode || '___' },
                    { name: (0, typeorm_2.Like)(`%${dto.schoolQuery}%`) },
                ],
            });
            if (!school) {
                school = this.grade10SchoolRepo.create({
                    code: aiData.schoolCode ||
                        dto.schoolQuery.toUpperCase().replace(/\s+/g, '_'),
                    name: dto.schoolQuery,
                });
            }
            const existingCutoffs = school.id
                ? await this.grade10CutoffRepo.find({
                    where: { schoolId: school.id },
                })
                : [];
            const existingQuotas = school.id
                ? await this.grade10QuotaRepo.find({
                    where: { schoolId: school.id },
                })
                : [];
            const results = aiData.cutoffs.map((item) => {
                const scoreNV1 = item.cutoffNV1 !== undefined && item.cutoffNV1 !== null
                    ? item.cutoffNV1
                    : item.cutoff_nv1 !== undefined && item.cutoff_nv1 !== null
                        ? item.cutoff_nv1
                        : item.cutoffNv1;
                const scoreNV2 = item.cutoffNV2 !== undefined && item.cutoffNV2 !== null
                    ? item.cutoffNV2
                    : item.cutoff_nv2 !== undefined && item.cutoff_nv2 !== null
                        ? item.cutoff_nv2
                        : item.cutoffNv2;
                const scoreNV3 = item.cutoffNV3 !== undefined && item.cutoffNV3 !== null
                    ? item.cutoffNV3
                    : item.cutoff_nv3 !== undefined && item.cutoff_nv3 !== null
                        ? item.cutoff_nv3
                        : item.cutoffNv3;
                const dbRecord = existingCutoffs.find((c) => c.year === item.year);
                const dbQuota = existingQuotas.find((q) => q.year === item.year);
                const aiQuotaItem = (aiData.quotas || []).find((q) => q.year === item.year);
                return {
                    year: item.year,
                    cutoffNV1: scoreNV1 !== undefined &&
                        scoreNV1 !== null &&
                        !isNaN(Number(scoreNV1))
                        ? Number(scoreNV1)
                        : null,
                    cutoffNV2: scoreNV2 !== undefined &&
                        scoreNV2 !== null &&
                        !isNaN(Number(scoreNV2))
                        ? Number(scoreNV2)
                        : null,
                    cutoffNV3: scoreNV3 !== undefined &&
                        scoreNV3 !== null &&
                        !isNaN(Number(scoreNV3))
                        ? Number(scoreNV3)
                        : null,
                    quota: aiQuotaItem && aiQuotaItem.quota !== undefined && aiQuotaItem.quota !== null
                        ? Number(aiQuotaItem.quota)
                        : item.quota !== undefined && item.quota !== null
                            ? Number(item.quota)
                            : null,
                    registeredCount: aiQuotaItem && aiQuotaItem.registeredCount !== undefined && aiQuotaItem.registeredCount !== null
                        ? Number(aiQuotaItem.registeredCount)
                        : item.registeredCount !== undefined && item.registeredCount !== null
                            ? Number(item.registeredCount)
                            : null,
                    competitionRatio: aiQuotaItem && aiQuotaItem.competitionRatio !== undefined && aiQuotaItem.competitionRatio !== null
                        ? Number(aiQuotaItem.competitionRatio)
                        : item.competitionRatio !== undefined && item.competitionRatio !== null
                            ? Number(item.competitionRatio)
                            : null,
                    exists: !!dbRecord || !!dbQuota,
                    existingScore: dbRecord
                        ? {
                            cutoffNV1: Number(dbRecord.cutoffNV1),
                            cutoffNV2: dbRecord.cutoffNV2
                                ? Number(dbRecord.cutoffNV2)
                                : null,
                            cutoffNV3: dbRecord.cutoffNV3
                                ? Number(dbRecord.cutoffNV3)
                                : null,
                        }
                        : null,
                    existingQuota: dbQuota
                        ? {
                            quota: Number(dbQuota.quota),
                            registeredCount: dbQuota.registeredCount
                                ? Number(dbQuota.registeredCount)
                                : null,
                            competitionRatio: dbQuota.competitionRatio
                                ? Number(dbQuota.competitionRatio)
                                : null,
                        }
                        : null,
                };
            });
            return {
                schoolName: school.name,
                schoolCode: school.code,
                address: aiData.address || school.address || null,
                website: aiData.website || school.website || null,
                description: aiData.description || school.description || null,
                mapUrl: aiData.mapUrl || school.mapUrl || null,
                type: 'GRADE10',
                results,
            };
        }
        else {
            let uni = await this.universityRepository.findOne({
                where: [
                    { code: aiData.schoolCode || '___' },
                    { nameVi: (0, typeorm_2.Like)(`%${dto.schoolQuery}%`) },
                ],
            });
            if (!uni) {
                uni = this.universityRepository.create({
                    code: aiData.schoolCode || dto.schoolQuery.toUpperCase().substring(0, 5),
                    nameVi: dto.schoolQuery,
                });
            }
            let program = null;
            if (uni.id) {
                program = await this.programRepository.findOne({
                    where: {
                        universityId: uni.id,
                        majorCode: (0, typeorm_2.Like)(`%${aiData.majorCode || ''}%`),
                    },
                });
                if (!program) {
                    const majors = await this.majorRepository.find();
                    const matchedMajor = majors.find((m) => m.nameVi
                        .toLowerCase()
                        .includes((dto.majorQuery || '').toLowerCase()));
                    if (matchedMajor) {
                        program = await this.programRepository.findOne({
                            where: { universityId: uni.id, majorCode: matchedMajor.code },
                        });
                    }
                }
            }
            const existingScores = program
                ? await this.scoreRepository.find({
                    where: { admissionRule: { program: { id: program.id } } },
                })
                : [];
            const results = aiData.cutoffs.map((item) => {
                const scoreNV1 = item.cutoffNV1 !== undefined && item.cutoffNV1 !== null
                    ? item.cutoffNV1
                    : item.cutoff_nv1 !== undefined && item.cutoff_nv1 !== null
                        ? item.cutoff_nv1
                        : item.cutoffNv1 !== undefined && item.cutoffNv1 !== null
                            ? item.cutoffNv1
                            : item.score;
                const dbRecord = existingScores.find((s) => s.year === item.year);
                return {
                    year: item.year,
                    cutoffNV1: scoreNV1 !== undefined &&
                        scoreNV1 !== null &&
                        !isNaN(Number(scoreNV1))
                        ? Number(scoreNV1)
                        : null,
                    exists: !!dbRecord,
                    existingScore: dbRecord
                        ? {
                            cutoffNV1: Number(dbRecord.benchmarkScore),
                        }
                        : null,
                };
            });
            return {
                schoolName: uni.nameVi,
                schoolCode: uni.code,
                majorName: aiData.majorName || dto.majorQuery,
                majorCode: program ? program.majorCode : aiData.majorCode || 'N/A',
                type: 'UNIVERSITY',
                results,
            };
        }
    }
    async importCutoffs(dto) {
        let importedCount = 0;
        if (dto.type === 'GRADE10') {
            let school = await this.grade10SchoolRepo.findOne({
                where: { code: dto.schoolCode },
            });
            let districtId;
            if (dto.districtName) {
                let dist = await this.grade10DistrictRepo.findOne({
                    where: { name: dto.districtName },
                });
                if (!dist) {
                    dist = this.grade10DistrictRepo.create({
                        name: dto.districtName,
                        code: dto.districtName
                            .toUpperCase()
                            .replace(/\s+/g, '_')
                            .substring(0, 5),
                    });
                    dist = await this.grade10DistrictRepo.save(dist);
                }
                districtId = dist.id;
            }
            if (!school) {
                school = this.grade10SchoolRepo.create({
                    code: dto.schoolCode,
                    name: dto.schoolCode.replace(/_/g, ' '),
                    districtId,
                    address: dto.address,
                    website: dto.website,
                    description: dto.description,
                    mapUrl: dto.mapUrl,
                });
                school = await this.grade10SchoolRepo.save(school);
            }
            else {
                let changed = false;
                if (districtId && !school.districtId) {
                    school.districtId = districtId;
                    changed = true;
                }
                if (dto.address && school.address !== dto.address) {
                    school.address = dto.address;
                    changed = true;
                }
                if (dto.website && school.website !== dto.website) {
                    school.website = dto.website;
                    changed = true;
                }
                if (dto.description && school.description !== dto.description) {
                    school.description = dto.description;
                    changed = true;
                }
                if (dto.mapUrl && school.mapUrl !== dto.mapUrl) {
                    school.mapUrl = dto.mapUrl;
                    changed = true;
                }
                if (changed) {
                    await this.grade10SchoolRepo.save(school);
                }
            }
            for (const item of dto.overrides) {
                const scoreNV1 = item.cutoffNV1 !== undefined && item.cutoffNV1 !== null
                    ? item.cutoffNV1
                    : item.cutoff_nv1 !== undefined && item.cutoff_nv1 !== null
                        ? item.cutoff_nv1
                        : item.cutoffNv1;
                let hasCutoff = false;
                if (scoreNV1 !== null &&
                    scoreNV1 !== undefined &&
                    !isNaN(Number(scoreNV1))) {
                    const scoreNV2 = item.cutoffNV2 !== undefined && item.cutoffNV2 !== null
                        ? item.cutoffNV2
                        : item.cutoff_nv2 !== undefined && item.cutoff_nv2 !== null
                            ? item.cutoff_nv2
                            : item.cutoffNv2;
                    const scoreNV3 = item.cutoffNV3 !== undefined && item.cutoffNV3 !== null
                        ? item.cutoffNV3
                        : item.cutoff_nv3 !== undefined && item.cutoff_nv3 !== null
                            ? item.cutoff_nv3
                            : item.cutoffNv3;
                    let cutoff = await this.grade10CutoffRepo.findOne({
                        where: {
                            schoolId: school.id,
                            year: item.year,
                            programType: 'REGULAR',
                        },
                    });
                    if (!cutoff) {
                        cutoff = this.grade10CutoffRepo.create({
                            schoolId: school.id,
                            year: item.year,
                            cutoffNV1: Number(scoreNV1),
                            cutoffNV2: scoreNV2 ? Number(scoreNV2) : null,
                            cutoffNV3: scoreNV3 ? Number(scoreNV3) : null,
                            programType: 'REGULAR',
                        });
                    }
                    else {
                        cutoff.cutoffNV1 = Number(scoreNV1);
                        cutoff.cutoffNV2 = scoreNV2 ? Number(scoreNV2) : null;
                        cutoff.cutoffNV3 = scoreNV3 ? Number(scoreNV3) : null;
                    }
                    await this.grade10CutoffRepo.save(cutoff);
                    hasCutoff = true;
                }
                let hasQuota = false;
                const qVal = item.quota !== undefined && item.quota !== null
                    ? Number(item.quota)
                    : null;
                const regVal = item.registeredCount !== undefined && item.registeredCount !== null
                    ? Number(item.registeredCount)
                    : null;
                const compVal = item.competitionRatio !== undefined && item.competitionRatio !== null
                    ? Number(item.competitionRatio)
                    : null;
                if (qVal !== null && !isNaN(qVal)) {
                    let quota = await this.grade10QuotaRepo.findOne({
                        where: {
                            schoolId: school.id,
                            year: item.year,
                            programType: 'REGULAR',
                        },
                    });
                    if (!quota) {
                        quota = this.grade10QuotaRepo.create({
                            schoolId: school.id,
                            year: item.year,
                            quota: qVal,
                            registeredCount: regVal !== null && !isNaN(regVal) ? regVal : 0,
                            competitionRatio: compVal !== null && !isNaN(compVal) ? compVal : 0,
                            programType: 'REGULAR',
                        });
                    }
                    else {
                        quota.quota = qVal;
                        if (regVal !== null && !isNaN(regVal))
                            quota.registeredCount = regVal;
                        if (compVal !== null && !isNaN(compVal))
                            quota.competitionRatio = compVal;
                    }
                    await this.grade10QuotaRepo.save(quota);
                    hasQuota = true;
                }
                if (hasCutoff || hasQuota) {
                    importedCount++;
                }
            }
        }
        else {
            let uni = await this.universityRepository.findOne({
                where: { code: dto.schoolCode },
            });
            if (!uni) {
                uni = this.universityRepository.create({
                    code: dto.schoolCode,
                    nameVi: dto.schoolCode,
                });
                uni = await this.universityRepository.save(uni);
            }
            let method = await this.methodRepository.findOne({
                where: { code: 'THPT' },
            });
            if (!method) {
                method = this.methodRepository.create({
                    code: 'THPT',
                    name: 'Điểm thi THPT Quốc gia',
                });
                method = await this.methodRepository.save(method);
            }
            let program = await this.programRepository.findOne({
                where: { universityId: uni.id, majorCode: dto.majorCode },
            });
            if (!program) {
                program = this.programRepository.create({
                    universityId: uni.id,
                    majorCode: dto.majorCode || 'N/A',
                    code: `${uni.code}-${dto.majorCode || 'N/A'}-DAI_TRA`,
                    name: dto.majorCode || 'N/A',
                    trainingType: 'DAI_TRA',
                });
                program = await this.programRepository.save(program);
            }
            let rule = await this.ruleRepository.findOne({
                where: {
                    program: { id: program.id },
                    admissionMethod: { id: method.id },
                },
            });
            if (!rule) {
                rule = this.ruleRepository.create({
                    programId: program.id,
                    admissionMethodId: method.id,
                    formulaExpression: 'Math + Physics + Chemistry',
                });
                rule = await this.ruleRepository.save(rule);
            }
            for (const item of dto.overrides) {
                const scoreNV1 = item.cutoffNV1 !== undefined && item.cutoffNV1 !== null
                    ? item.cutoffNV1
                    : item.cutoff_nv1 !== undefined && item.cutoff_nv1 !== null
                        ? item.cutoff_nv1
                        : item.cutoffNv1 !== undefined && item.cutoffNv1 !== null
                            ? item.cutoffNv1
                            : item.score;
                if (scoreNV1 === null ||
                    scoreNV1 === undefined ||
                    isNaN(Number(scoreNV1))) {
                    continue;
                }
                let score = await this.scoreRepository.findOne({
                    where: { admissionRule: { id: rule.id }, year: item.year },
                });
                if (!score) {
                    score = this.scoreRepository.create({
                        admissionRule: rule,
                        year: item.year,
                        benchmarkScore: Number(scoreNV1),
                    });
                }
                else {
                    score.benchmarkScore = Number(scoreNV1);
                }
                await this.scoreRepository.save(score);
                importedCount++;
            }
        }
        return {
            success: true,
            importedCount,
        };
    }
};
exports.AiAssistantService = AiAssistantService;
exports.AiAssistantService = AiAssistantService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(university_entity_1.University)),
    __param(2, (0, typeorm_1.InjectRepository)(major_entity_1.Major)),
    __param(3, (0, typeorm_1.InjectRepository)(program_entity_1.Program)),
    __param(4, (0, typeorm_1.InjectRepository)(admission_method_entity_1.AdmissionMethod)),
    __param(5, (0, typeorm_1.InjectRepository)(admission_rule_entity_1.AdmissionRule)),
    __param(6, (0, typeorm_1.InjectRepository)(admission_score_entity_1.AdmissionScore)),
    __param(7, (0, typeorm_1.InjectRepository)(school_entity_1.Grade10School)),
    __param(8, (0, typeorm_1.InjectRepository)(district_entity_1.Grade10District)),
    __param(9, (0, typeorm_1.InjectRepository)(cutoff_entity_1.Grade10Cutoff)),
    __param(10, (0, typeorm_1.InjectRepository)(quota_entity_1.Grade10Quota)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AiAssistantService);
//# sourceMappingURL=ai-assistant.service.js.map