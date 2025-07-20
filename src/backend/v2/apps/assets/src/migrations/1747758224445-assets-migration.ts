import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AssetsMigration1747758224445 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums if they do not exist
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_trigger_type_enum') THEN
          CREATE TYPE "scan_trigger_type_enum" AS ENUM (
            'scheduled_scan',
            'manual_scan',
            'asset_added',
            'asset_updated',
            'live_scan_nuclei_template_change',
            'source_added',
            'source_updated'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_status_enum') THEN
          CREATE TYPE "scan_status_enum" AS ENUM (
            'pending',
            'sent',
            'in_progress',
            'completed',
            'failed',
            'cancelled'
          );
        END IF;
      END $$;
    `);

    // Create the `asset_scan` table
    await queryRunner.createTable(
      new Table({
        name: 'asset_scan',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'uuid',
            type: 'uuid',
            isGenerated: true,
            generationStrategy: 'uuid',
            isUnique: true,
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'scan_status_enum',
            default: `'pending'`,
          },
          {
            name: 'scan_type',
            type: 'enum',
            enumName: 'scan_trigger_type_enum',
            default: `'asset_added'`,
          },
          {
            name: 'start_time',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'end_time',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'schedule_run_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'source_id',
            type: 'integer',
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
          },
        ],
      })
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'asset_scan',
      new TableForeignKey({
        columnNames: ['schedule_run_id'],
        referencedTableName: 'schedule_run',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'asset_scan',
      new TableForeignKey({
        columnNames: ['source_id'],
        referencedTableName: 'source',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'asset_scan',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    // Add the `asset_scan_id` column to the `asset` table
    await queryRunner.addColumn(
      'asset',
      new TableColumn({
        name: 'asset_scan_id',
        type: 'integer',
        isNullable: true,
      })
    );

    // Add a foreign key for `asset_scan_id` referencing the `asset_scan` table
    await queryRunner.createForeignKey(
      'asset',
      new TableForeignKey({
        columnNames: ['asset_scan_id'],
        referencedTableName: 'asset_scan',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Add the new value `WEBAPP_ASSET_SCAN` to the `schedule_type_enum`
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type_enum') THEN
          ALTER TYPE "schedule_type_enum" ADD VALUE IF NOT EXISTS 'WEBAPP_ASSET_SCAN';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the `asset_scan` table
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_scan"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "scan_trigger_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "scan_status_enum"`);

    // Remove the foreign key for `asset_scan_id`
    const table = await queryRunner.getTable('asset');
    const foreignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('asset_scan_id')
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('asset', foreignKey);
    }

    // Drop the `asset_scan_id` column from the `asset` table
    await queryRunner.dropColumn('asset', 'asset_scan_id');
  }
}
