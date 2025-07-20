import { ScheduleType, VulnerabilityProfiles } from '@firewall-backend/enums';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user-auth/user/user.entity';
import { Asset } from '../assets/asset.entity';
import { Source } from '../sources/source.entity';
import { ScheduleRun } from './schedule-run.entity';

@Entity()
@Check('"interval" > 0')
export class Schedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ default: true })
  active!: boolean;

  @Index()
  @Column({ default: false })
  deleted!: boolean;

  @Column({
    type: 'enum',
    enum: ScheduleType,
    default: ScheduleType.VULNERABILITY_SCAN,
  })
  type!: ScheduleType;

  @Column({ type: 'int' })
  interval!: number;

  @Column({
    type: 'enum',
    enum: VulnerabilityProfiles,
    array: true,
    nullable: true,
    name: 'vulnerability_profiles',
  })
  vulnerabilityProfiles?: VulnerabilityProfiles[];

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

  @OneToMany(() => Asset, (asset) => asset.schedule)
  assets!: Asset[];

  @OneToMany(() => Source, (source) => source.schedule)
  sources!: Source[];

  @OneToMany(() => ScheduleRun, (scheduleRun) => scheduleRun.schedule)
  scheduleRuns!: ScheduleRun[];
}
