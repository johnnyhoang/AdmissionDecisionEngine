import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Campus } from './campus.entity';
import { Program } from './program.entity';

@Entity('ade_universities')
export class University {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'name_vi' })
  nameVi: string;

  @Column({ name: 'name_en', nullable: true })
  nameEn: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  website: string;

  @Column({ name: 'global_ranking', nullable: true })
  globalRanking: number;

  @Column({ name: 'local_ranking', nullable: true })
  localRanking: number;

  @Column({ name: 'average_tuition', type: 'decimal', precision: 12, scale: 2, default: 0 })
  averageTuition: number;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @OneToMany(() => Campus, (campus) => campus.university)
  campuses: Campus[];

  @OneToMany(() => Program, (program) => program.university)
  programs: Program[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
