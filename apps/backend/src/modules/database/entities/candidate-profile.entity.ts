import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ade_candidate_profiles')
export class CandidateProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  province: string;

  @Column({ name: 'priority_group', nullable: true }) // e.g., UT1, UT2 or None
  priorityGroup: string;

  @Column({ nullable: true }) // e.g., KV1, KV2, KV2-NT, KV3
  region: string;

  @Column({ name: 'high_school_grades', type: 'text', nullable: true })
  // JSON e.g., {"Grade10":{"Sem1":{"Math":8.5,"Physics":9.0}, "Sem2":{...}}, "Grade11":...}
  highSchoolGrades: string;

  @Column({ name: 'exam_scores', type: 'text', nullable: true })
  // JSON e.g., {"THPT":{"Math":9.2,"Physics":8.5}, "DGNL_HCM":890}
  examScores: string;

  @Column({ type: 'text', nullable: true })
  // JSON e.g., {"IELTS":6.5, "SAT":1420}
  certificates: string;

  @Column({ name: 'career_interests', type: 'text', nullable: true })
  // JSON array e.g., ["IT", "AI", "Business"]
  careerInterests: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
