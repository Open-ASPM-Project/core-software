import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssetToSource } from './asset-to-source.entity';
import { AssetSubType, AssetType, IpType } from '@firewall-backend/enums';
import { AssetScreenshot } from './asset-screenshot.entity';
import { User } from '../../user-auth/user/user.entity';
import { AssetToGroup } from '../asset-groups/asset-to-group.entity';
import { Schedule } from '../schedules/schedule.entity';
import { AssetScan } from './asset-scan.entity';
import { Vulnerability } from '../../vulnerability/vulnerability/vulnerability.entity';

@Entity()
export class Asset {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Generated('uuid')
  uuid!: string;

  @Index()
  @Column({ name: 'type', type: 'enum', enum: AssetType })
  type!: AssetType;

  @Column({
    name: 'sub_type',
    type: 'enum',
    enum: AssetSubType,
    nullable: true,
  })
  subType?: AssetSubType;

  @Column({ nullable: true })
  name?: string;

  @Index()
  @Column({ nullable: true })
  url?: string;

  @Index()
  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'ip_type', type: 'enum', enum: IpType, nullable: true })
  ipType?: IpType;

  @Column({ nullable: true })
  port?: number;

  @Column({ default: true })
  active!: boolean;

  @Index()
  @Column({ default: false })
  deleted!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'domain_id', nullable: true })
  domainId?: number;

  @Column({ name: 'subdomain_id', nullable: true })
  subdomainId?: number;

  @Column({ name: 'ip_id', nullable: true })
  ipId?: number;

  @Column({ name: 'webapp_id', nullable: true })
  webappId?: number;

  @Column({ name: 'schedule_id', nullable: true })
  scheduleId?: number;

  @Column({ name: 'security_group_id', nullable: true })
  securityGroupId?: string;

  @Column({ name: 'security_group_name', nullable: true })
  securityGroupName?: string;

  @Column({ name: 'sg_from_ports', type: 'json', nullable: true })
  sgFromPorts?: string;

  @Column({ name: 'metadata', type: 'text', nullable: true })
  metadata?: string;

  @Column({ name: 'asset_scan_id', nullable: true })
  assetScanId?: number;

  @Column({ name: 'curl_request', type: 'text', nullable: true })
  curlRequest?: string;

  @Column({ name: 'curl_response', type: 'text', nullable: true })
  curlResponse?: string;

  @ManyToOne(() => AssetScan, (scan) => scan.assets, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'asset_scan_id' })
  assetScan?: AssetScan;

  @Column({ name: 'added_by_uid', nullable: true })
  addedByUid?: number;

  @Column({ name: 'updated_by_uid', nullable: true })
  updatedByUid?: number;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'domain_id' })
  domainAsset?: Asset;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'subdomain_id' })
  subdomainAsset?: Asset;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'ip_id' })
  ipAsset?: Asset;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'webapp_id' })
  webappAsset?: Asset;

  @OneToMany(() => AssetToSource, (assetToSource) => assetToSource.asset)
  assetToSources?: AssetToSource[];

  @ManyToOne(() => Schedule, (schedule) => schedule.assets)
  @JoinColumn({ name: 'schedule_id' })
  schedule?: Schedule;

  @OneToMany(() => AssetToGroup, (assetToGroup) => assetToGroup.asset)
  assetToGroups?: AssetToGroup[];

  @OneToMany(() => AssetScreenshot, (screenshot) => screenshot.asset)
  assetScreenshots?: AssetScreenshot[];

  @OneToMany(() => Vulnerability, (vulnerability) => vulnerability.asset)
  vulnerabilities?: Vulnerability[];

  @ManyToMany(() => Asset, (asset) => asset.ec2Webapps)
  @JoinTable({
    name: 'ec2_to_webapp',
    joinColumn: {
      name: 'ec2_asset_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'webapp_asset_id',
      referencedColumnName: 'id',
    },
  })
  ec2Webapps?: Asset[];

  @ManyToMany(() => Asset, (asset) => asset.ec2SecurityGroups)
  @JoinTable({
    name: 'ec2_to_security_group',
    joinColumn: {
      name: 'ec2_asset_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'security_group_asset_id',
      referencedColumnName: 'id',
    },
  })
  ec2SecurityGroups?: Asset[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'added_by_uid' })
  addedBy?: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by_uid' })
  updatedBy?: User;
}
