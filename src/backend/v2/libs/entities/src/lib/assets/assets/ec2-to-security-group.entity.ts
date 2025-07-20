import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Asset } from './asset.entity';

@Entity('ec2_to_security_group')
export class Ec2ToSecurityGroup {
  @PrimaryColumn({ name: 'ec2_asset_id' })
  ec2AssetId!: number;

  @PrimaryColumn({ name: 'security_group_asset_id' })
  securityGroupAssetId!: number;

  @ManyToOne(() => Asset, { eager: false, nullable: false })
  @JoinColumn({ name: 'ec2_asset_id', referencedColumnName: 'id' })
  ec2Asset!: Asset;

  @ManyToOne(() => Asset, { eager: false, nullable: false })
  @JoinColumn({ name: 'security_group_asset_id', referencedColumnName: 'id' })
  securityGroupAsset!: Asset;
}
