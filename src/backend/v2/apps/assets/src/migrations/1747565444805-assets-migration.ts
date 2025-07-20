import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AssetsMigration1747565444805 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old tables if they exist
    await queryRunner.query(`DROP TABLE IF EXISTS "group" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS asset_group CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS scan CASCADE`);

    // Add 'type' column to schedule table (enum)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type_enum') THEN
          CREATE TYPE schedule_type_enum AS ENUM ('VULNERABILITY_SCAN', 'ASSET_SCAN');
        END IF;
      END$$;
    `);
    await queryRunner.query(`
      ALTER TABLE schedule
      ADD COLUMN IF NOT EXISTS type schedule_type_enum DEFAULT 'VULNERABILITY_SCAN'
    `);

    // Create ScheduleRunStatus enum type
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_run_status_enum') THEN
          CREATE TYPE schedule_run_status_enum AS ENUM ('pending', 'sent-to-queue', 'failed');
        END IF;
      END$$;
    `);

    // Create asset_group table
    await queryRunner.createTable(
      new Table({
        name: 'asset_group',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'uuid',
            type: 'uuid',
            isUnique: true,
            isNullable: false,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'added_by_uid',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'updated_by_uid',
            type: 'int',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create asset_to_group table
    await queryRunner.createTable(
      new Table({
        name: 'asset_to_group',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'group_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'asset_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'added_by_uid',
            type: 'int',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Add unique index for group_id and asset_id
    await queryRunner.createIndex(
      'asset_to_group',
      new TableIndex({
        name: 'asset_group_group_id_asset_id_index',
        columnNames: ['group_id', 'asset_id'],
        isUnique: true,
      })
    );

    // Foreign keys for asset_group
    await queryRunner.createForeignKey(
      'asset_group',
      new TableForeignKey({
        columnNames: ['added_by_uid'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );
    await queryRunner.createForeignKey(
      'asset_group',
      new TableForeignKey({
        columnNames: ['updated_by_uid'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );

    // Foreign keys for asset_to_group
    await queryRunner.createForeignKey(
      'asset_to_group',
      new TableForeignKey({
        columnNames: ['group_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'asset_group',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'asset_to_group',
      new TableForeignKey({
        columnNames: ['asset_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'asset',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'asset_to_group',
      new TableForeignKey({
        columnNames: ['added_by_uid'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );

    // Create schedule_run table with status as enum
    await queryRunner.createTable(
      new Table({
        name: 'schedule_run',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'uuid',
            type: 'uuid',
            isNullable: false,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'status',
            type: 'schedule_run_status_enum',
            isNullable: false,
            default: `'pending'`,
          },
          {
            name: 'trigger_type',
            type: 'varchar',
            isNullable: false,
            default: `'SCHEDULED_SCAN'`,
          },
          {
            name: 'success_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'failed_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'details',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'schedule_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'added_by_uid',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'updated_by_uid',
            type: 'int',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Foreign keys for schedule_run
    await queryRunner.createForeignKey(
      'schedule_run',
      new TableForeignKey({
        columnNames: ['schedule_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'schedule',
        onDelete: 'SET NULL',
      })
    );
    await queryRunner.createForeignKey(
      'schedule_run',
      new TableForeignKey({
        columnNames: ['added_by_uid'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );
    await queryRunner.createForeignKey(
      'schedule_run',
      new TableForeignKey({
        columnNames: ['updated_by_uid'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('schedule_run', true);
    await queryRunner.dropTable('asset_to_group', true);
    await queryRunner.dropTable('asset_group', true);
    await queryRunner.query(`ALTER TABLE schedule DROP COLUMN IF EXISTS type`);
    await queryRunner.query(`DROP TYPE IF EXISTS schedule_run_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS schedule_type_enum`);
    // Optionally, recreate scans table if needed
  }
}
