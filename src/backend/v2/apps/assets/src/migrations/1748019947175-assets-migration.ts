import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableColumn,
} from 'typeorm';

export class AssetsMigration1748019947175 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new value `webapp_api` to the `asset_type_enum`
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type_enum') THEN
          ALTER TYPE "asset_type_enum" ADD VALUE IF NOT EXISTS 'webapp_api';
        END IF;
      END$$;
    `);

    // Drop the foreign key for `asset_aws_service_id`
    const table = await queryRunner.getTable('asset');
    const foreignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('asset_aws_service_id')
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('asset', foreignKey);
    }

    // Drop the `asset_aws_service_id` column from the `asset` table
    await queryRunner.dropColumn('asset', 'asset_aws_service_id');

    // Drop the `asset_aws_service` table if it exists
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_aws_service"`);

    // Change `metadata` column type to `text` in `asset_screenshot` table
    await queryRunner.changeColumn(
      'asset_screenshot',
      'metadata',
      new TableColumn({
        name: 'metadata',
        type: 'text',
        isNullable: true,
      })
    );

    // Create `ec2_to_webapp` table
    await queryRunner.createTable(
      new Table({
        name: 'ec2_to_webapp',
        columns: [
          {
            name: 'ec2_asset_id',
            type: 'integer',
            isPrimary: true,
          },
          {
            name: 'webapp_asset_id',
            type: 'integer',
            isPrimary: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['ec2_asset_id'],
            referencedTableName: 'asset',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['webapp_asset_id'],
            referencedTableName: 'asset',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      })
    );

    // Create `ec2_to_security_group` table
    await queryRunner.createTable(
      new Table({
        name: 'ec2_to_security_group',
        columns: [
          {
            name: 'ec2_asset_id',
            type: 'integer',
            isPrimary: true,
          },
          {
            name: 'security_group_asset_id',
            type: 'integer',
            isPrimary: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['ec2_asset_id'],
            referencedTableName: 'asset',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['security_group_asset_id'],
            referencedTableName: 'asset',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      })
    );

    // Add new columns to `asset` table
    await queryRunner.addColumn(
      'asset',
      new TableColumn({
        name: 'webapp_id',
        type: 'integer',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'asset',
      new TableColumn({
        name: 'security_group_id',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'asset',
      new TableColumn({
        name: 'security_group_name',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'asset',
      new TableColumn({
        name: 'sg_from_ports',
        type: 'json',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'asset',
      new TableColumn({
        name: 'metadata',
        type: 'text',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'asset',
      new TableColumn({
        name: 'curl_request',
        type: 'text',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'asset',
      new TableColumn({
        name: 'curl_response',
        type: 'text',
        isNullable: true,
      })
    );

    // Add foreign key for `webapp_id`
    await queryRunner.createForeignKey(
      'asset',
      new TableForeignKey({
        columnNames: ['webapp_id'],
        referencedTableName: 'asset',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key for `security_group_id`
    const table = await queryRunner.getTable('asset');

    // Drop foreign key for `webapp_id`
    const webappForeignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('webapp_id')
    );
    if (webappForeignKey) {
      await queryRunner.dropForeignKey('asset', webappForeignKey);
    }

    // Drop the `ec2_to_security_group` table
    await queryRunner.query(`DROP TABLE IF EXISTS "ec2_to_security_group"`);

    // Drop the `ec2_to_webapp` table
    await queryRunner.query(`DROP TABLE IF EXISTS "ec2_to_webapp"`);

    // Revert `metadata` column type in `asset_screenshot` table
    await queryRunner.changeColumn(
      'asset_screenshot',
      'metadata',
      new TableColumn({
        name: 'metadata',
        type: 'json',
        isNullable: true,
      })
    );

    // Drop new columns from `asset` table
    await queryRunner.dropColumn('asset', 'curl_response');
    await queryRunner.dropColumn('asset', 'curl_request');
    await queryRunner.dropColumn('asset', 'metadata');
    await queryRunner.dropColumn('asset', 'sg_from_ports');
    await queryRunner.dropColumn('asset', 'security_group_name');
    await queryRunner.dropColumn('asset', 'security_group_id');
    await queryRunner.dropColumn('asset', 'webapp_id');

    // Recreate the `asset_aws_service` table
    await queryRunner.createTable(
      new Table({
        name: 'asset_aws_service',
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
          },
          {
            name: 'type',
            type: 'enum',
            enumName: 'asset_aws_service_type_enum',
          },
          {
            name: 'public_dns_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'public_ip_address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'security_group_ids',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'domain_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'subdomain_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'ip_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'webapp_ids',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'group_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'group_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'from_ports',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'dns_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'endpoint_address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'endpoint_port',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'api_gateway_url',
            type: 'varchar',
            isNullable: true,
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
          },
        ],
        foreignKeys: [
          {
            columnNames: ['domain_id'],
            referencedTableName: 'asset',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['subdomain_id'],
            referencedTableName: 'asset',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['ip_id'],
            referencedTableName: 'asset',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      })
    );

    // Re-add the `asset_aws_service_id` column to the `asset` table
    await queryRunner.addColumn(
      'asset',
      new TableColumn({
        name: 'asset_aws_service_id',
        type: 'integer',
        isNullable: true,
      })
    );

    // Recreate the foreign key for `asset_aws_service_id`
    await queryRunner.createForeignKey(
      'asset',
      new TableForeignKey({
        columnNames: ['asset_aws_service_id'],
        referencedTableName: 'asset_aws_service',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );
  }
}
