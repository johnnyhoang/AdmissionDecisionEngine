import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('G10HCM_USER_SEARCH_HISTORY')
export class Grade10History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'math_score', type: 'decimal', precision: 4, scale: 2 })
  mathScore: number;

  @Column({ name: 'literature_score', type: 'decimal', precision: 4, scale: 2 })
  literatureScore: number;

  @Column({ name: 'english_score', type: 'decimal', precision: 4, scale: 2 })
  englishScore: number;

  @Column({
    name: 'priority_score',
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 0.0,
  })
  priorityScore: number;

  @Column({
    name: 'bonus_score',
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 0.0,
  })
  bonusScore: number;

  @Column({ name: 'total_score', type: 'decimal', precision: 5, scale: 2 })
  totalScore: number;

  @Column({ name: 'preferred_district', nullable: true })
  preferredDistrict: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
