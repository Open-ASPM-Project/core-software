import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { ScanStatus, ScanTriggerType } from '@firewall-backend/enums';
import { Source } from '../sources/source.entity';
import { User } from '../../user-auth/user/user.entity';
import { Asset } from './asset.entity';
import { ScheduleRun } from '../schedules/schedule-run.entity';

@Entity({ name: 'asset_scan' })
export class AssetScan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column({
    type: 'enum',
    enum: ScanStatus,
    default: ScanStatus.PENDING,
  })
  status!: ScanStatus;

  @Column({
    name: 'scan_type',
    type: 'enum',
    enum: ScanTriggerType,
    default: ScanTriggerType.ASSET_ADDED,
  })
  scanType!: ScanTriggerType;

  @Column({ name: 'start_time', default: 0, type: 'bigint' })
  startTime?: number;

  @Column({ name: 'end_time', default: 0, type: 'bigint' })
  endTime?: number;

  @Column({ name: 'schedule_run_id', nullable: true })
  scheduleRunId?: number;

  @Column({ name: 'user_id', nullable: true })
  userId?: number;

  @Column({ name: 'source_id', nullable: true })
  sourceId?: number;

  @OneToOne(() => ScheduleRun, { eager: false, nullable: true })
  @JoinColumn({ name: 'schedule_run_id', referencedColumnName: 'id' })
  scheduleRun?: ScheduleRun;

  @ManyToOne(() => Source, { eager: false, nullable: false })
  @JoinColumn({ name: 'source_id', referencedColumnName: 'id' })
  source?: Source;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user?: User;

  @OneToMany(() => Asset, (asset) => asset.assetScan)
  assets?: Asset[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
