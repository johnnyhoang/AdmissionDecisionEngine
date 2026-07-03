import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Program } from './program.entity';

@Entity('ade_majors')
export class Major {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'name_vi' })
  nameVi: string;

  @Column({ name: 'name_en', nullable: true })
  nameEn: string;

  @Column({ nullable: true })
  sector: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'career_path', type: 'text', nullable: true })
  careerPath: string;

  @Column({ name: 'required_skills', type: 'text', nullable: true })
  requiredSkills: string;

  @Column({ name: 'average_salary', type: 'decimal', precision: 12, scale: 2, nullable: true })
  averageSalary: number;

  @Column({ name: 'employment_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  employmentRate: number;

  @Column({ name: 'demand_trend', nullable: true })
  demandTrend: string;

  @OneToMany(() => Program, (program) => program.major)
  programs: Program[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
