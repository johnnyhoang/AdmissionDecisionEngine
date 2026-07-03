import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Grade10School } from './school.entity';

@Entity('G10HCM_CUTOFF_SCORE')
@Unique(['schoolId', 'year', 'programType'])
export class Grade10Cutoff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @ManyToOne(() => Grade10School, (school) => school.cutoffs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: Grade10School;

  @Column()
  year: number;

  @Column({ name: 'cutoff_nv1', type: 'decimal', precision: 5, scale: 2 })
  cutoffNV1: number;

  @Column({ name: 'cutoff_nv2', type: 'decimal', precision: 5, scale: 2, nullable: true })
  cutoffNV2: number;

  @Column({ name: 'cutoff_nv3', type: 'decimal', precision: 5, scale: 2, nullable: true })
  cutoffNV3: number;

  @Column({ name: 'lowest_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  lowestScore: number;

  @Column({ name: 'highest_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  highestScore: number;

  @Column({ name: 'program_type', default: 'REGULAR' })
  programType: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  changes: string;

  @Column({ name: 'data_source', nullable: true })
  dataSource: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
