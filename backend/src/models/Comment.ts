import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Check } from 'typeorm';
import { User } from './User';
import { Incident } from './Incident';
import { Task } from './Task';

@Entity('comments')
@Check(`("incident_id" IS NOT NULL AND "task_id" IS NULL) OR ("incident_id" IS NULL AND "task_id" IS NOT NULL)`)
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Incident, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'incident_id' })
  incident: Incident | null;

  @ManyToOne(() => Task, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'task_id' })
  task: Task | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 