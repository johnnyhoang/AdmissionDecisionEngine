import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { University } from './university.entity';
import { Major } from './major.entity';
import { Campus } from './campus.entity';
import { AdmissionRule } from './admission-rule.entity';

@Entity('ade_programs')
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id' })
  universityId: string;

  @Column({ name: 'major_id' })
  majorId: string;

  @Column({ name: 'campus_id' })
  campusId: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ default: 'Vietnamese' })
  language: string;

  @Column({ name: 'tuition_fee', type: 'decimal', precision: 12, scale: 2, default: 0 })
  tuitionFee: number;

  @Column({ name: 'duration_years', type: 'decimal', precision: 3, scale: 1, default: 4.0 })
  durationYears: number;

  @ManyToOne(() => University, (university) => university.programs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'university_id' })
  university: University;

  @ManyToOne(() => Major, (major) => major.programs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'major_id' })
  major: Major;

  @ManyToOne(() => Campus, (campus) => campus.programs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campus_id' })
  campus: Campus;

  @OneToMany(() => AdmissionRule, (rule) => rule.program)
  admissionRules: AdmissionRule[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
