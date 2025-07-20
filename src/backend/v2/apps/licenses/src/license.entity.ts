// licenses.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
  } from 'typeorm';
  
  @Entity()
  export class License {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: false })
    email: string;
  
    @Column()
    licenseKey: string;

    @Column()
    hardwareId: string;

    @Column()
    expiresAtDays: number
  
    @Column({ type: 'timestamptz' })
    expiresAt: Date;
  
    @Column({ default: true })
    active: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @DeleteDateColumn()
    deletedAt: Date;

    @Column({ default: false })
    verified: boolean;

    @Column({ nullable: true })
    otp: string;

    @Column({nullable: true})
    otpExpiresAt: Date
  }
  