import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Grade10District } from './district.entity';
import { Grade10Quota } from './quota.entity';
import { Grade10Cutoff } from './cutoff.entity';

@Entity('G10HCM_SCHOOL')
export class Grade10School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'district_id', nullable: true })
  districtId: string;

  @ManyToOne(() => Grade10District, (district) => district.schools, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'district_id' })
  district: Grade10District;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'map_url', type: 'text', nullable: true })
  mapUrl: string;

  @Column({ name: 'school_type', default: 'REGULAR' })
  schoolType: string; // REGULAR, SPECIALIZED, etc.

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Grade10Quota, (quota) => quota.school)
  quotas: Grade10Quota[];

  @OneToMany(() => Grade10Cutoff, (cutoff) => cutoff.school)
  cutoffs: Grade10Cutoff[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
