import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('USER_PERMISSION')
@Unique(['userId', 'module', 'functionKey'])
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  module: string; // 'GRADE10' | 'UNIVERSITY'

  @Column({ name: 'function_key' })
  functionKey: string; // e.g. 'view_dashboard', 'view_recommendation', 'view_optimization', 'edit_data'

  @Column({ name: 'can_view', default: false })
  canView: boolean;

  @Column({ name: 'can_edit', default: false })
  canEdit: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
