import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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

  @Column({ name: 'formula_expression', default: 'Math + Physics + Chemistry' })
  formulaExpression: string;

  @Column({ name: 'subject_weights', type: 'text', nullable: true }) // JSON e.g. {"Math": 2, "Physics": 1, "Chemistry": 1}
  subjectWeights: string;

  @Column({ name: 'min_score_threshold', type: 'decimal', precision: 5, scale: 2, default: 0 })
  minScoreThreshold: number;

  @Column({ name: 'priority_rules', type: 'text', nullable: true }) // JSON e.g. {"KV1": 0.75, "IELTS_6.5": 1.0}
  priorityRules: string;

  @Column({ default: 0 })
  quota: number;

  @ManyToOne(() => Program, (program) => program.admissionRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @ManyToOne(() => AdmissionMethod, (method) => method.admissionRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admission_method_id' })
  admissionMethod: AdmissionMethod;

  @OneToMany(() => AdmissionScore, (score) => score.admissionRule)
  admissionScores: AdmissionScore[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
