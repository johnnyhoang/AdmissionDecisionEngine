import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdmissionRule } from './admission-rule.entity';

@Entity('ade_admission_scores')
export class AdmissionScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'admission_rule_id' })
  admissionRuleId: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ name: 'benchmark_score', type: 'decimal', precision: 5, scale: 2 })
  benchmarkScore: number;

  @Column({ name: 'total_admitted', type: 'int', default: 0 })
  totalAdmitted: number;

  @ManyToOne(() => AdmissionRule, (rule) => rule.admissionScores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'admission_rule_id' })
  admissionRule: AdmissionRule;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
