import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssetsMigration1746025430276 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if api_gateway_url column exists in asset_aws_service table
    const assetAwsServiceTable = await queryRunner.hasTable(
      'asset_aws_service'
    );
    if (assetAwsServiceTable) {
      const apiGatewayUrlColumn = await queryRunner.hasColumn(
        'asset_aws_service',
        'api_gateway_url'
      );
      if (!apiGatewayUrlColumn) {
        // Add api_gateway_url column to asset_aws_service table
        await queryRunner.query(`
                    ALTER TABLE "asset_aws_service" 
                    ADD COLUMN "api_gateway_url" character varying
                `);
        console.log('Added api_gateway_url column to asset_aws_service table');
      }
    }

    // Check if source table exists
    const sourceTable = await queryRunner.hasTable('source');
    if (sourceTable) {
      // Check if source_type column exists in source table
      const sourceTypeColumn = await queryRunner.hasColumn(
        'source',
        'source_type'
      );
      if (sourceTypeColumn) {
        // Rename source_type column to type in source table
        await queryRunner.query(`
                    ALTER TABLE "source" 
                    RENAME COLUMN "source_type" TO "type"
                `);
        console.log('Renamed source_type column to type in source table');

        // Update existing indexes if they exist
        try {
          await queryRunner.query(`
                        DROP INDEX IF EXISTS "IDX_source_source_type"
                    `);
          await queryRunner.query(`
                        CREATE INDEX "IDX_source_type" ON "source" ("type")
                    `);
          console.log('Updated index for type column in source table');
        } catch (error) {
          console.log('No index to update for source_type column', error);
        }
      }

      // Check if cloud_type_label column exists
      const cloudTypeLabelColumn = await queryRunner.hasColumn(
        'source',
        'cloud_type_label'
      );
      if (!cloudTypeLabelColumn) {
        // Add cloud_type_label column to source table
        await queryRunner.query(`
                    ALTER TABLE "source" 
                    ADD COLUMN "cloud_type_label" character varying
                `);
        console.log('Added cloud_type_label column to source table');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if api_gateway_url column exists in asset_aws_service table
    const assetAwsServiceTable = await queryRunner.hasTable(
      'asset_aws_service'
    );
    if (assetAwsServiceTable) {
      const apiGatewayUrlColumn = await queryRunner.hasColumn(
        'asset_aws_service',
        'api_gateway_url'
      );
      if (apiGatewayUrlColumn) {
        // Remove api_gateway_url column from asset_aws_service table
        await queryRunner.query(`
                    ALTER TABLE "asset_aws_service" 
                    DROP COLUMN "api_gateway_url"
                `);
        console.log(
          'Removed api_gateway_url column from asset_aws_service table'
        );
      }
    }

    // Check if source table exists
    const sourceTable = await queryRunner.hasTable('source');
    if (sourceTable) {
      // Check if type column exists in source table
      const typeColumn = await queryRunner.hasColumn('source', 'type');
      if (typeColumn) {
        // Rename type column back to source_type in source table
        await queryRunner.query(`
                    ALTER TABLE "source" 
                    RENAME COLUMN "type" TO "source_type"
                `);
        console.log('Renamed type column back to source_type in source table');

        // Update existing indexes if they exist
        try {
          await queryRunner.query(`
                        DROP INDEX IF EXISTS "IDX_source_type"
                    `);
          await queryRunner.query(`
                        CREATE INDEX "IDX_source_source_type" ON "source" ("source_type")
                    `);
          console.log('Updated index for source_type column in source table');
        } catch (error) {
          console.log('No index to update for type column', error);
        }
      }

      // Check if cloud_type_label column exists
      const cloudTypeLabelColumn = await queryRunner.hasColumn(
        'source',
        'cloud_type_label'
      );
      if (cloudTypeLabelColumn) {
        // Remove cloud_type_label column from source table
        await queryRunner.query(`
                    ALTER TABLE "source" 
                    DROP COLUMN "cloud_type_label"
                `);
        console.log('Removed cloud_type_label column from source table');
      }
    }
  }
}
