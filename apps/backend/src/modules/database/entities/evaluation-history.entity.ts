import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ade_evaluation_history')
export class EvaluationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  region: string;

  @Column({ name: 'priority_group', nullable: true })
  priorityGroup: string;

  @Column({ name: 'exam_scores', type: 'text', nullable: true })
  examScores: string; // JSON

  @Column({ type: 'text', nullable: true })
  certificates: string; // JSON

  @Column({ name: 'recommended_count', default: 0 })
  recommendedCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
