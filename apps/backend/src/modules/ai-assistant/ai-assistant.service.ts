import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { University } from '../database/entities/university.entity';
import { Major } from '../database/entities/major.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';

@Injectable()
export class AiAssistantService {
  constructor(
    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,
    @InjectRepository(Major)
    private readonly majorRepository: Repository<Major>,
    @InjectRepository(AdmissionScore)
    private readonly scoreRepository: Repository<AdmissionScore>,
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
      // Find major benchmarks
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

      // Filter by major name
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

    // 4. Fallback greeting & helper
    return {
      reply: `Xin chào! Tôi là Trợ lý Tuyển sinh AI RAG. Tôi có thể truy vấn trực tiếp cơ sở dữ liệu để giải đáp cho bạn:\n\n1. **Tra cứu học phí:** Bạn có thể hỏi "Học phí trường nào dưới 40 triệu?"\n2. **Tra cứu điểm chuẩn:** Bạn có thể hỏi "Điểm chuẩn ngành khoa học máy tính?"\n3. **Tra cứu thông tin trường:** Bạn có thể hỏi "Thông tin trường QSC?"\n\nHãy nhập câu hỏi của bạn để tôi tìm kiếm thông tin chính xác nhất từ hệ thống!`
    };
  }
}
