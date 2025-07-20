import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssetGroup } from './asset-group.entity';
import { User } from '../../user-auth/user/user.entity';
import { Asset } from '../assets/asset.entity';

@Entity({ name: 'asset_to_group' })
@Index('asset_group_group_id_asset_id_index', ['groupId', 'assetId'], {
  unique: true,
})
export class AssetToGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'group_id' })
  groupId!: number;

  @ManyToOne(() => AssetGroup, (assetGroup) => assetGroup.assetToGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  assetGroup!: AssetGroup;

  @Column({ name: 'asset_id' })
  assetId!: number;

  @ManyToOne(() => Asset, (asset) => asset.assetToGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'asset_id' })
  asset!: Asset;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'added_by_uid', nullable: true })
  addedByUid?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'added_by_uid' })
  addedBy?: User;
}
