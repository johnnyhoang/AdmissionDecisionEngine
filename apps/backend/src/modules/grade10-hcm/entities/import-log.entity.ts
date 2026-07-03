import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('G10HCM_IMPORT_LOG')
export class Grade10ImportLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_name' })
  sourceName: string;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl: string;

  @Column({ default: 'SUCCESS' })
  status: string;

  @Column({ name: 'rows_count', default: 0 })
  rowsCount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
