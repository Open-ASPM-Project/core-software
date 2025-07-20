import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class AssetsMigration1747316710582 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Truncate the asset table
    await queryRunner.query(`TRUNCATE TABLE asset RESTART IDENTITY CASCADE`);

    // Create the asset_screenshot table
    await queryRunner.createTable(
      new Table({
        name: 'asset_screenshot',
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
            name: 'asset_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'image',
            type: 'bytea',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'json',
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
        ],
      }),
      true
    );

    // Add foreign key to the asset table
    await queryRunner.createForeignKey(
      'asset_screenshot',
      new TableForeignKey({
        columnNames: ['asset_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'asset',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No rollback logic for truncating a table
    // Optionally, you can add logic to restore data if needed
    await queryRunner.dropTable('asset_screenshot');
  }
}
