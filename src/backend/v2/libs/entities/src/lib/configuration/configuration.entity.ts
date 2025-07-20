import { Vulnerability } from '../vulnerability/vulnerability/vulnerability.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Generated,
} from 'typeorm';

@Entity({ name: 'configurations' })
export class Configuration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column({ unique: true, default: 'default' })
  name!: string;

  @Column({ type: 'jsonb' })
  config!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(
    () => Vulnerability,
    (vulnerability) => vulnerability.configuration
  )
  vulnerabilities!: Vulnerability[];
}
