import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { University } from './university.entity';
import { Program } from './program.entity';

@Entity('ade_campuses')
export class Campus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id' })
  universityId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  city: string;

  @ManyToOne(() => University, (university) => university.campuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'university_id' })
  university: University;

  @OneToMany(() => Program, (program) => program.campus)
  programs: Program[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
