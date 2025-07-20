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
import { Asset } from './asset.entity';

@Entity({ name: 'asset_screenshot' })
export class AssetScreenshot {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column({ name: 'asset_id' })
  assetId!: number;

  @ManyToOne(() => Asset, (asset) => asset.assetScreenshots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'asset_id' })
  asset!: Asset;

  @Column({ type: 'bytea' })
  image!: Buffer;

  @Column({ type: 'text', nullable: true })
  metadata?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
