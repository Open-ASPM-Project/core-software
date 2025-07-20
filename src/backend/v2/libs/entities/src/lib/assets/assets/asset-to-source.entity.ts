import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { Source } from '../sources/source.entity';

@Entity({ name: 'asset_to_source' })
export class AssetToSource {
  @PrimaryColumn({ name: 'asset_id' })
  assetId!: number;

  @PrimaryColumn({ name: 'source_id' })
  sourceId!: number;

  @Column({ name: 'added_by_uid', nullable: true })
  addedByUid?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Asset, (asset) => asset.assetToSources)
  @JoinColumn({ name: 'asset_id' })
  asset!: Asset;

  @ManyToOne(() => Source, (source) => source.assetToSources)
  @JoinColumn({ name: 'source_id' })
  source!: Source;
}
