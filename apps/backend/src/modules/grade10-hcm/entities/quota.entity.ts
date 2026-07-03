import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Grade10School } from './school.entity';

@Entity('G10HCM_QUOTA')
@Unique(['schoolId', 'year', 'programType'])
export class Grade10Quota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @ManyToOne(() => Grade10School, (school) => school.quotas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: Grade10School;

  @Column()
  year: number;

  @Column({ default: 0 })
  quota: number;

  @Column({ name: 'registered_count', default: 0, nullable: true })
  registeredCount: number;

  @Column({ name: 'competition_ratio', type: 'decimal', precision: 8, scale: 2, default: 0.0, nullable: true })
  competitionRatio: number;

  @Column({ name: 'program_type', default: 'REGULAR' })
  programType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
