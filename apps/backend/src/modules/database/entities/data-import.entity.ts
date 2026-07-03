import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ade_data_imports')
export class DataImport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Tên nguồn, ví dụ: "PDF Đề án ĐH Bách Khoa 2026", "Web tuyensinh247.com" */
  @Column({ name: 'source_name' })
  sourceName: string;

  /** URL hoặc tên file nguồn */
  @Column({ name: 'source_url', nullable: true })
  sourceUrl: string;

  /** Năm dữ liệu tuyển sinh */
  @Column({ name: 'data_year', type: 'int' })
  dataYear: number;

  /** Số lượng trường được import */
  @Column({ name: 'universities_count', default: 0 })
  universitiesCount: number;

  /** Số lượng ngành/chương trình được import */
  @Column({ name: 'programs_count', default: 0 })
  programsCount: number;

  /** Số lượng bản ghi điểm chuẩn được import */
  @Column({ name: 'scores_count', default: 0 })
  scoresCount: number;

  /** Số bản ghi bị bỏ qua do trùng lặp */
  @Column({ name: 'duplicates_skipped', default: 0 })
  duplicatesSkipped: number;

  /** SUCCESS | PARTIAL | FAILED */
  @Column({ default: 'SUCCESS' })
  status: string;

  /** Ghi chú thêm (lỗi, cảnh báo...) */
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
