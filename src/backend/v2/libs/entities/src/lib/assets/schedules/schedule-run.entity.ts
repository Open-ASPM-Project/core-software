import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScanTriggerType, ScheduleRunStatus } from '@firewall-backend/enums';
import { Schedule } from '../schedules/schedule.entity';
import { User } from '../../user-auth/user/user.entity';

@Entity({ name: 'schedule_run' })
export class ScheduleRun {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid' })
  @Generated('uuid')
  uuid!: string;

  @Column({
    type: 'enum',
    enum: ScheduleRunStatus,
    default: ScheduleRunStatus.PENDING,
  })
  status!: ScheduleRunStatus;

  @Column({
    type: 'enum',
    enum: ScanTriggerType,
    default: ScanTriggerType.SCHEDULED_SCAN,
    name: 'trigger_type',
  })
  triggerType!: ScanTriggerType;

  @Column({ name: 'success_count', default: 0 })
  successCount!: number;

  @Column({ name: 'failed_count', default: 0 })
  failedCount!: number;

  @Column({ type: 'json' })
  details?: string;

  @Column({ name: 'schedule_id', nullable: true })
  scheduleId?: number;

  @ManyToOne(() => Schedule, (schedule) => schedule.scheduleRuns)
  @JoinColumn({ name: 'schedule_id' })
  schedule?: Schedule;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'added_by_uid', nullable: true })
  addedByUid?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'added_by_uid' })
  addedBy?: User;

  @Column({ name: 'updated_by_uid', nullable: true })
  updatedByUid?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by_uid' })
  updatedBy?: User;
}
