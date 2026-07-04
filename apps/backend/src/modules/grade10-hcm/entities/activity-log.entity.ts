import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * G10HCM_ACTIVITY_LOG
 * Ghi lại mọi lượt user sử dụng 2 module chính:
 *  - 'calculator' : Đánh giá cá nhân / Gợi ý trường (POST /recommendation)
 *  - 'combo'      : Đề xuất Combo 3 NV (POST /recommendation/combo)
 */
@Entity('G10HCM_ACTIVITY_LOG')
export class Grade10ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Module người dùng sử dụng */
  @Column({ name: 'module', type: 'varchar', length: 20 })
  module: 'calculator' | 'combo';

  /** ID user đăng nhập (từ JWT payload) */
  @Column({ name: 'user_id', type: 'varchar', length: 100, nullable: true })
  userId: string | null;

  /** Tên hiển thị hoặc email của user (để admin đọc dễ hơn) */
  @Column({ name: 'user_name', type: 'varchar', length: 255, nullable: true })
  userName: string | null;

  /** Toàn bộ payload đầu vào của user (điểm thi, khoảng điểm, tọa độ,...) */
  @Column({ name: 'input_payload', type: 'jsonb' })
  inputPayload: Record<string, any>;

  /**
   * Tóm tắt kết quả trả về:
   * - calculator: { totalScore, topSchools: [{name, prob, cutoff}] }
   * - combo:      { avgScore, safe: [...], effort: [...], defense: [...] }
   */
  @Column({ name: 'result_summary', type: 'jsonb', nullable: true })
  resultSummary: Record<string, any> | null;

  /** User-Agent của trình duyệt */
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  /** IP address của client */
  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
