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
import { University } from './university.entity';
import { Major } from './major.entity';
import { Campus } from './campus.entity';
import { AdmissionRule } from './admission-rule.entity';

export enum TrainingType {
  DAI_TRA = 'DAI_TRA', // Đại trà (Mass)
  CHAT_LUONG_CAO = 'CHAT_LUONG_CAO', // Chất lượng cao (High Quality)
  TIEN_TIEN = 'TIEN_TIEN', // Tiên tiến / Chương trình tiên tiến
  LIEN_KET_NUOC_NGOAI = 'LIEN_KET_NUOC_NGOAI', // Liên kết nước ngoài
  POHE = 'POHE', // POHE
  TAI_NANG = 'TAI_NANG', // Tài năng
  VIET_PHAP = 'VIET_PHAP', // Việt - Pháp
}

@Entity('ade_programs')
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id' })
  universityId: string;

  @Column({ name: 'major_id', nullable: true })
  majorId: string;

  @Column({ name: 'campus_id', nullable: true })
  campusId: string;

  /** Mã ngành quốc gia 7 chữ số của Bộ GD&ĐT, ví dụ 7480101 */
  @Column({ name: 'major_code', nullable: true })
  majorCode: string;

  /** Mã nội bộ do trường tự đặt (nếu có), dùng kết hợp với universityCode */
  @Column({ nullable: true })
  code: string;

  /** Tên ngành / chương trình đào tạo đầy đủ */
  @Column()
  name: string;

  @Column({
    name: 'training_type',
    type: 'varchar',
    default: TrainingType.DAI_TRA,
  })
  trainingType: string;

  @Column({ default: 'Tiếng Việt' })
  language: string;

  @Column({
    name: 'tuition_fee',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'Học phí VNĐ/năm',
  })
  tuitionFee: number;

  @Column({
    name: 'tuition_fee_max',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    comment: 'Học phí tối đa (nếu theo tín chỉ)',
  })
  tuitionFeeMax: number;

  @Column({
    name: 'duration_years',
    type: 'decimal',
    precision: 3,
    scale: 1,
    default: 4.0,
  })
  durationYears: number;

  @Column({
    name: 'total_quota',
    type: 'int',
    default: 0,
    comment: 'Tổng chỉ tiêu tuyển sinh',
  })
  totalQuota: number;

  /** Năm dữ liệu tuyển sinh này (2024, 2025, 2026) */
  @Column({ name: 'data_year', type: 'int', default: 2025 })
  dataYear: number;

  /** Nguồn dữ liệu: URL PDF, tên file, tên web */
  @Column({ name: 'data_source', nullable: true })
  dataSource: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => University, (university) => university.programs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'university_id' })
  university: University;

  @ManyToOne(() => Major, (major) => major.programs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'major_id' })
  major: Major;

  @ManyToOne(() => Campus, (campus) => campus.programs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'campus_id' })
  campus: Campus;

  @OneToMany(() => AdmissionRule, (rule) => rule.program)
  admissionRules: AdmissionRule[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
