import {
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
import { CloudType, SourceType } from '@firewall-backend/enums';
import { User } from '../../user-auth/user/user.entity';
import { AssetToSource } from '../assets/asset-to-source.entity';
import { Schedule } from '../schedules/schedule.entity';

@Entity()
export class Source {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Generated('uuid')
  uuid!: string;

  @Index()
  @Column({ name: 'type', type: 'enum', enum: SourceType })
  type!: SourceType;

  @Index()
  @Column({ unique: true })
  name!: string;

  @Column({ name: 'cloud_type', type: 'enum', enum: CloudType, nullable: true })
  cloudType?: CloudType;

  @Column({ name: 'cloud_type_label', nullable: true })
  cloudTypeLabel?: string;

  @Column({ name: 'aws_access_key', nullable: true })
  awsAccessKey?: string;

  @Column({ name: 'aws_secret_key', nullable: true })
  awsSecretKey?: string;

  @Column({ name: 'gcp_service_account_key', nullable: true })
  gcpServiceAccountKey?: string;

  @Column({ name: 'client_id', nullable: true })
  clientId?: string;

  @Column({ name: 'client_secret', nullable: true })
  clientSecret?: string;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: string;

  @Column({ name: 'subscription_id', nullable: true })
  subscriptionId?: string;

  @Column({ name: 'digitalocean_token', nullable: true })
  digitaloceanToken?: string;

  @Column({ name: 'scaleway_access_key', nullable: true })
  scalewayAccessKey?: string;

  @Column({ name: 'scaleway_access_token', nullable: true })
  scalewayAccessToken?: string;

  @Column({ name: 'api_key', nullable: true })
  apiKey?: string;

  @Column({ name: 'email', nullable: true })
  email?: string;

  @Column({ name: 'heroku_api_token', nullable: true })
  herokuApiToken?: string;

  @Column({ name: 'fastly_api_key', nullable: true })
  fastlyApiKey?: string;

  @Column({ name: 'linode_personal_access_token', nullable: true })
  linodePersonalAccessToken?: string;

  @Column({ name: 'namecheap_api_key', nullable: true })
  namecheapApiKey?: string;

  @Column({ name: 'namecheap_user_name', nullable: true })
  namecheapUserName?: string;

  @Column({ name: 'alibaba_region_id', nullable: true })
  alibabaRegionId?: string;

  @Column({ name: 'alibaba_access_key', nullable: true })
  alibabaAccessKey?: string;

  @Column({ name: 'alibaba_access_key_secret', nullable: true })
  alibabaAccessKeySecret?: string;

  @Column({ name: 'tf_state_file', nullable: true })
  tfStateFile?: string;

  @Column({ name: 'consul_url', nullable: true })
  consulUrl?: string;

  @Column({ name: 'nomad_url', nullable: true })
  nomadUrl?: string;

  @Column({ name: 'auth_token', nullable: true })
  authToken?: string;

  @Column({ name: 'kubeconfig_file', nullable: true })
  kubeconfigFile?: string;

  @Column({ name: 'kubeconfig_encoded', nullable: true })
  kubeconfigEncoded?: string;

  @Column({ name: 'dnssimple_api_token', nullable: true })
  dnssimpleApiToken?: string;

  @Column({ default: true })
  active!: boolean;

  @Index()
  @Column({ default: false })
  deleted!: boolean;

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

  @OneToMany(() => AssetToSource, (assetToSource) => assetToSource.source)
  assetToSources?: AssetToSource[];

  @Column({ name: 'schedule_id', nullable: true })
  scheduleId?: number;

  @ManyToOne(() => Schedule, (schedule) => schedule.sources)
  @JoinColumn({ name: 'schedule_id' })
  schedule?: Schedule;
}
