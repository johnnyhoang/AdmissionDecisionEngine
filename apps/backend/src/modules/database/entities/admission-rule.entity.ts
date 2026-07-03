import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Program } from './program.entity';
import { AdmissionMethod } from './admission-method.entity';
import { AdmissionScore } from './admission-score.entity';

@Entity('ade_admission_rules')
export class AdmissionRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'program_id' })
  programId: string;

  @Column({ name: 'admission_method_id' })
  admissionMethodId: string;

  /**
   * Tổ hợp môn xét tuyển - mã chuẩn Bộ GD&ĐT
   * A00 = Toán, Vật Lý, Hóa Học
   * A01 = Toán, Vật Lý, Tiếng Anh
   * B00 = Toán, Hóa Học, Sinh Học
   * D01 = Toán, Ngữ Văn, Tiếng Anh
   * D07 = Toán, Hóa Học, Tiếng Anh
   * DGNL = Điểm thi đánh giá năng lực
   * HOCBA = Xét học bạ (không cần tổ hợp)
   */
  @Column({
    name: 'subject_combination',
    nullable: true,
    comment: 'Mã tổ hợp môn: A00, A01, B00, D01...',
  })
  subjectCombination: string;

  /** Mô tả tổ hợp môn bằng tiếng Việt */
  @Column({ name: 'combination_description', nullable: true })
  combinationDescription: string;

  /** Công thức tính điểm, ví dụ: Math*2 + Physics + Chemistry */
  @Column({ name: 'formula_expression', default: 'Math + Physics + Chemistry' })
  formulaExpression: string;

  /** JSON trọng số môn, ví dụ: {"Math": 2, "Physics": 1} */
  @Column({ name: 'subject_weights', type: 'text', nullable: true })
  subjectWeights: string;

  /** Điểm sàn xét tuyển cho tổ hợp này */
  @Column({
    name: 'min_score_threshold',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 0,
  })
  minScoreThreshold: number;

  /** JSON quy tắc ưu tiên, ví dụ: {"KV1": 0.75, "UT1": 2.0} */
  @Column({ name: 'priority_rules', type: 'text', nullable: true })
  priorityRules: string;

  /** Chỉ tiêu riêng cho tổ hợp/phương thức này */
  @Column({ default: 0 })
  quota: number;

  /** Năm áp dụng quy tắc xét tuyển */
  @Column({ name: 'apply_year', type: 'int', default: 2025 })
  applyYear: number;

  @ManyToOne(() => Program, (program) => program.admissionRules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @ManyToOne(() => AdmissionMethod, (method) => method.admissionRules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'admission_method_id' })
  admissionMethod: AdmissionMethod;

  @OneToMany(() => AdmissionScore, (score) => score.admissionRule)
  admissionScores: AdmissionScore[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
