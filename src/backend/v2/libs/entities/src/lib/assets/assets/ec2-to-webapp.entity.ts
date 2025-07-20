import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Asset } from './asset.entity';

@Entity('ec2_to_webapp')
export class Ec2ToWebapp {
  @PrimaryColumn({ name: 'ec2_asset_id' })
  ec2AssetId!: number;

  @PrimaryColumn({ name: 'webapp_asset_id' })
  webappAssetId!: number;

  @ManyToOne(() => Asset, { eager: false, nullable: false })
  @JoinColumn({ name: 'ec2_asset_id', referencedColumnName: 'id' })
  ec2Asset!: Asset;

  @ManyToOne(() => Asset, { eager: false, nullable: false })
  @JoinColumn({ name: 'webapp_asset_id', referencedColumnName: 'id' })
  webappAsset!: Asset;
}
