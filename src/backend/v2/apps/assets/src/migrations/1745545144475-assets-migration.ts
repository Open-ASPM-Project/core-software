import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AssetsMigration1745545144475 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the AssetAwsServiceType enum if it doesn't exist yet
    await queryRunner.query(`
              DO $$ BEGIN
                  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_aws_service_type_enum') THEN
                      CREATE TYPE "asset_aws_service_type_enum" AS ENUM (
                          'aws_ec2_instance',
                          'aws_vpc_security_group',
                          'aws_ec2_application_load_balancer',
                          'aws_ec2_classic_load_balancer',
                          'aws_ec2_gateway_load_balancer',
                          'aws_rds_db_instance',
                          'aws_route53_record',
                          'aws_s3_bucket',
                          'aws_api_gateway_rest_api',
                          'aws_api_gateway_stage'
                      );
                  END IF;
              END $$;
          `);

    // Create asset_aws_service table
    await queryRunner.createTable(
      new Table({
        name: 'asset_aws_service',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'uuid',
            type: 'uuid',
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'type',
            type: 'asset_aws_service_type_enum',
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
            type: 'int',
            isNullable: true,
          },
          {
            name: 'subdomain_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'ip_id',
            type: 'int',
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
            type: 'int',
            isNullable: true,
          },
          {
            name: 'name',
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
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'asset_aws_service',
      new TableIndex({
        name: 'IDX_asset_aws_service_type',
        columnNames: ['type'],
      })
    );

    await queryRunner.createIndex(
      'asset_aws_service',
      new TableIndex({
        name: 'IDX_asset_aws_service_uuid',
        columnNames: ['uuid'],
      })
    );

    // Add foreign key constraints for domain, subdomain, and ip references
    await queryRunner.createForeignKey(
      'asset_aws_service',
      new TableForeignKey({
        name: 'FK_asset_aws_service_domain',
        columnNames: ['domain_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'asset',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'asset_aws_service',
      new TableForeignKey({
        name: 'FK_asset_aws_service_subdomain',
        columnNames: ['subdomain_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'asset',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'asset_aws_service',
      new TableForeignKey({
        name: 'FK_asset_aws_service_ip',
        columnNames: ['ip_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'asset',
        onDelete: 'SET NULL',
      })
    );

    // Check if asset_aws_service_id column already exists in asset table
    const hasColumn = await this.columnExists(
      queryRunner,
      'asset',
      'asset_aws_service_id'
    );

    // Add asset_aws_service_id column to asset table if it doesn't exist
    if (!hasColumn) {
      await queryRunner.query(`
                  ALTER TABLE "asset" 
                  ADD COLUMN IF NOT EXISTS "asset_aws_service_id" int NULL
              `);

      // Add foreign key from asset to asset_aws_service
      await queryRunner.createForeignKey(
        'asset',
        new TableForeignKey({
          name: 'FK_asset_asset_aws_service',
          columnNames: ['asset_aws_service_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'asset_aws_service',
          onDelete: 'SET NULL',
        })
      );
    }

    // PART 2: Rename group_asset table to asset_group and add index
    // Check if group_asset table exists
    const groupAssetTableExists = await this.tableExists(
      queryRunner,
      'group_asset'
    );
    const assetGroupTableExists = await this.tableExists(
      queryRunner,
      'asset_group'
    );

    if (groupAssetTableExists && !assetGroupTableExists) {
      this.log('Renaming group_asset table to asset_group...');

      // First, drop any existing foreign keys to avoid constraint issues during rename
      const fkConstraints = await this.getForeignKeyConstraints(
        queryRunner,
        'group_asset'
      );
      for (const constraint of fkConstraints) {
        await queryRunner.query(
          `ALTER TABLE "group_asset" DROP CONSTRAINT IF EXISTS "${constraint}"`
        );
      }

      // Rename the table
      await queryRunner.query(
        `ALTER TABLE "group_asset" RENAME TO "asset_group"`
      );

      // Recreate foreign key constraints
      await queryRunner.query(`
          ALTER TABLE "asset_group" 
          ADD CONSTRAINT "FK_asset_group_group_id" 
          FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE
        `);

      await queryRunner.query(`
          ALTER TABLE "asset_group" 
          ADD CONSTRAINT "FK_asset_group_asset_id" 
          FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE
        `);

      // Check if user_id column exists for the added_by relationship
      const userIdColumnExists = await this.columnExists(
        queryRunner,
        'asset_group',
        'added_by_uid'
      );
      if (userIdColumnExists) {
        await queryRunner.query(`
            ALTER TABLE "asset_group" 
            ADD CONSTRAINT "FK_asset_group_added_by_uid" 
            FOREIGN KEY ("added_by_uid") REFERENCES "users"("id") ON DELETE SET NULL
          `);
      }

      this.log('Table successfully renamed to asset_group');
    } else if (assetGroupTableExists) {
      this.log('asset_group table already exists, skipping rename operation');
    } else {
      this.log('group_asset table does not exist, skipping rename operation');
    }

    // Check if the index already exists
    const indexExists = await this.indexExists(
      queryRunner,
      'asset_group_group_id_asset_id_index'
    );

    // Create the unique composite index if it doesn't exist and the table exists
    if (!indexExists && (assetGroupTableExists || groupAssetTableExists)) {
      this.log('Creating unique index on asset_group (group_id, asset_id)...');

      await queryRunner.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS "asset_group_group_id_asset_id_index" 
          ON "asset_group" ("group_id", "asset_id")
        `);

      this.log('Unique index created successfully');
    }

    // PART 3: Update asset_type_enum to add 'service' and 'unknown' values
    this.log(
      'Checking if asset_type_enum needs updating to include service and unknown values...'
    );

    // Check if the enum type exists
    const enumTypeExists = await queryRunner.query(`
  SELECT 1 FROM pg_type WHERE typname = 'asset_type_enum'
`);

    if (enumTypeExists.length > 0) {
      // Check if the values already exist in the enum
      const existingValues = await queryRunner.query(`
    SELECT enumlabel 
    FROM pg_enum e 
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'asset_type_enum'
    ORDER BY e.enumsortorder
  `);

      const currentLabels = existingValues.map((row) => row.enumlabel);
      const missingValues = [];

      if (!currentLabels.includes('service')) {
        missingValues.push('service');
      }

      if (!currentLabels.includes('unknown')) {
        missingValues.push('unknown');
      }

      if (missingValues.length > 0) {
        this.log(
          `Adding missing values to asset_type_enum: ${missingValues.join(
            ', '
          )}`
        );

        // Create backup of current column values
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "asset_type_backup" AS
      SELECT id, "type"::text as type
      FROM "asset"
      WHERE "type" IS NOT NULL;
    `);

        // Get the current enum values and add missing ones
        const allValues = [...currentLabels, ...missingValues];
        const enumValuesList = allValues.map((val) => `'${val}'`).join(', ');

        // Create a new enum with all values
        await queryRunner.query(`
      CREATE TYPE "asset_type_enum_new" AS ENUM (${enumValuesList});
    `);

        // Update the column to use varchar temporarily
        await queryRunner.query(`
      ALTER TABLE "asset" ALTER COLUMN "type" DROP DEFAULT;
      ALTER TABLE "asset" ALTER COLUMN "type" TYPE varchar USING "type"::text;
    `);

        // Drop the old enum
        await queryRunner.query(`DROP TYPE "asset_type_enum";`);

        // Rename the new enum to the original name
        await queryRunner.query(
          `ALTER TYPE "asset_type_enum_new" RENAME TO "asset_type_enum";`
        );

        // Alter the column to use the updated enum
        await queryRunner.query(`
      ALTER TABLE "asset" ALTER COLUMN "type" TYPE "asset_type_enum" 
      USING "type"::"asset_type_enum";
    `);

        // Restore the NOT NULL constraint
        await queryRunner.query(`
      ALTER TABLE "asset" ALTER COLUMN "type" SET NOT NULL;
    `);

        this.log(
          `Successfully added ${missingValues.join(
            ' and '
          )} values to asset_type_enum`
        );
      } else {
        this.log(
          'service and unknown values already exist in asset_type_enum, no update needed'
        );
      }
    } else {
      this.log(
        'asset_type_enum not found in database, cannot add service and unknown values'
      );
    }

    // Check sso_config table
    const ssoConfigTableExists = await this.tableExists(
      queryRunner,
      'sso_config'
    );
    if (ssoConfigTableExists) {
      const ssoConfigHasUuid = await this.columnExists(
        queryRunner,
        'sso_config',
        'uuid'
      );
      if (!ssoConfigHasUuid) {
        this.log('Adding uuid column to sso_config table');
        await queryRunner.query(`
      ALTER TABLE "sso_config" 
      ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuid_generate_v4()
    `);
        // Add a unique index on uuid
        await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_sso_config_uuid" ON "sso_config" ("uuid")
    `);
      } else {
        this.log('sso_config table already has uuid column');
      }
    } else {
      this.log(
        'sso_config table does not exist, skipping uuid column addition'
      );
    }

    // Check users table
    const usersTableExists = await this.tableExists(queryRunner, 'users');
    if (usersTableExists) {
      const usersHasUuid = await this.columnExists(
        queryRunner,
        'users',
        'uuid'
      );
      if (!usersHasUuid) {
        this.log('Adding uuid column to users table');
        await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuid_generate_v4()
    `);
        // Add a unique index on uuid
        await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_uuid" ON "users" ("uuid")
    `);
      } else {
        this.log('users table already has uuid column');
      }
    } else {
      this.log('users table does not exist, skipping uuid column addition');
    }

    // Ensure uuid_generate_v4 extension is available
    await queryRunner.query(`
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback addition of UUID columns
    this.log('Rolling back UUID column additions if possible...');

    // We're only dropping the columns if they don't have data relationships depending on them

    // Check eula table
    const eulaTableExists = await this.tableExists(queryRunner, 'eula');
    if (eulaTableExists) {
      const eulaHasUuid = await this.columnExists(queryRunner, 'eula', 'uuid');
      if (eulaHasUuid) {
        // Check if any foreign keys reference this column
        const eulaUuidReferences = await this.getReferencingColumns(
          queryRunner,
          'eula',
          'uuid'
        );
        if (eulaUuidReferences.length === 0) {
          this.log('Removing uuid column from eula table');
          await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_eula_uuid";
        ALTER TABLE "eula" DROP COLUMN IF EXISTS "uuid";
      `);
        } else {
          this.log(
            'Cannot remove uuid column from eula as it has foreign key references'
          );
        }
      }
    }

    // Check sso_config table
    const ssoConfigTableExists = await this.tableExists(
      queryRunner,
      'sso_config'
    );
    if (ssoConfigTableExists) {
      const ssoConfigHasUuid = await this.columnExists(
        queryRunner,
        'sso_config',
        'uuid'
      );
      if (ssoConfigHasUuid) {
        // Check if any foreign keys reference this column
        const ssoConfigUuidReferences = await this.getReferencingColumns(
          queryRunner,
          'sso_config',
          'uuid'
        );
        if (ssoConfigUuidReferences.length === 0) {
          this.log('Removing uuid column from sso_config table');
          await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_sso_config_uuid";
        ALTER TABLE "sso_config" DROP COLUMN IF EXISTS "uuid";
      `);
        } else {
          this.log(
            'Cannot remove uuid column from sso_config as it has foreign key references'
          );
        }
      }
    }

    // Check users table
    const usersTableExists = await this.tableExists(queryRunner, 'users');
    if (usersTableExists) {
      const usersHasUuid = await this.columnExists(
        queryRunner,
        'users',
        'uuid'
      );
      if (usersHasUuid) {
        // Check if any foreign keys reference this column
        const usersUuidReferences = await this.getReferencingColumns(
          queryRunner,
          'users',
          'uuid'
        );
        if (usersUuidReferences.length === 0) {
          this.log('Removing uuid column from users table');
          await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_users_uuid";
        ALTER TABLE "users" DROP COLUMN IF EXISTS "uuid";
      `);
        } else {
          this.log(
            'Cannot remove uuid column from users as it has foreign key references'
          );
        }
      }
    }

    // Rollback addition of 'service' and 'unknown' values from asset_type_enum
    this.log(
      'Checking if we need to remove service and unknown values from asset_type_enum...'
    );

    // Check if there are any rows using these values
    const serviceOrUnknownRowsExist = await queryRunner.query(`
  SELECT 1 FROM "asset" WHERE "type" = 'service' OR "type" = 'unknown'
`);

    if (serviceOrUnknownRowsExist.length === 0) {
      // Only try to remove if no rows are using these values
      const enumExists = await queryRunner.query(`
    SELECT 1 FROM pg_type WHERE typname = 'asset_type_enum'
  `);

      if (enumExists.length > 0) {
        this.log('Removing service and unknown values from asset_type_enum');

        // Get all enum values except 'service' and 'unknown'
        const enumValues = await queryRunner.query(`
      SELECT enumlabel
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'asset_type_enum' AND enumlabel NOT IN ('service', 'unknown')
      ORDER BY e.enumsortorder
    `);

        if (enumValues.length > 0) {
          const values = enumValues.map((row) => `'${row.enumlabel}'`);

          // Create a new enum without removed values
          await queryRunner.query(
            `CREATE TYPE "asset_type_enum_new" AS ENUM (${values.join(', ')});`
          );

          // Change column to use varchar
          await queryRunner.query(`
        ALTER TABLE "asset" ALTER COLUMN "type" DROP DEFAULT;
        ALTER TABLE "asset" ALTER COLUMN "type" TYPE varchar USING "type"::text;
      `);

          // Drop old enum
          await queryRunner.query(`DROP TYPE "asset_type_enum";`);

          // Rename new enum
          await queryRunner.query(
            `ALTER TYPE "asset_type_enum_new" RENAME TO "asset_type_enum";`
          );

          // Change column back to enum type
          await queryRunner.query(`
        ALTER TABLE "asset" ALTER COLUMN "type" TYPE "asset_type_enum" 
        USING "type"::"asset_type_enum";
      `);

          // Restore NOT NULL constraint
          await queryRunner.query(
            `ALTER TABLE "asset" ALTER COLUMN "type" SET NOT NULL;`
          );

          this.log(
            'Successfully removed service and unknown values from asset_type_enum'
          );
        }
      }
    } else {
      this.log(
        'Cannot remove service or unknown values as they are being used in the asset table'
      );
    }

    // Handle asset_group table rollback first
    const assetGroupTableExists = await this.tableExists(
      queryRunner,
      'asset_group'
    );
    if (assetGroupTableExists) {
      // Drop the unique index
      await queryRunner.query(`
          DROP INDEX IF EXISTS "asset_group_group_id_asset_id_index"
        `);

      // Drop foreign keys
      await queryRunner.query(`
          ALTER TABLE "asset_group" DROP CONSTRAINT IF EXISTS "FK_asset_group_added_by_uid";
          ALTER TABLE "asset_group" DROP CONSTRAINT IF EXISTS "FK_asset_group_group_id";
          ALTER TABLE "asset_group" DROP CONSTRAINT IF EXISTS "FK_asset_group_asset_id";
        `);

      // Rename back to group_asset
      await queryRunner.query(
        `ALTER TABLE "asset_group" RENAME TO "group_asset"`
      );

      // Recreate original foreign keys if needed
      await queryRunner.query(`
          ALTER TABLE "group_asset" 
          ADD CONSTRAINT "FK_group_asset_group_id" 
          FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE
        `);

      await queryRunner.query(`
          ALTER TABLE "group_asset" 
          ADD CONSTRAINT "FK_group_asset_asset_id" 
          FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE
        `);
    }

    // Drop foreign key from asset table
    await queryRunner.query(`
              ALTER TABLE "asset" DROP CONSTRAINT IF EXISTS "FK_asset_asset_aws_service"
          `);

    // Drop column from asset table
    await queryRunner.query(`
              ALTER TABLE "asset" DROP COLUMN IF EXISTS "asset_aws_service_id"
          `);

    // Drop foreign keys from asset_aws_service table
    await queryRunner.query(`
              ALTER TABLE "asset_aws_service" DROP CONSTRAINT IF EXISTS "FK_asset_aws_service_domain";
              ALTER TABLE "asset_aws_service" DROP CONSTRAINT IF EXISTS "FK_asset_aws_service_subdomain";
              ALTER TABLE "asset_aws_service" DROP CONSTRAINT IF EXISTS "FK_asset_aws_service_ip";
          `);

    // Drop indexes
    await queryRunner.query(`
              DROP INDEX IF EXISTS "IDX_asset_aws_service_type";
              DROP INDEX IF EXISTS "IDX_asset_aws_service_uuid";
          `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_aws_service"`);

    await queryRunner.query(
      `DROP TYPE IF EXISTS "asset_aws_service_type_enum"`
    );
  }

  // Helper method to check if a column exists in a table
  private async columnExists(
    queryRunner: QueryRunner,
    table: string,
    column: string
  ): Promise<boolean> {
    const result = await queryRunner.query(`
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = '${table}' AND column_name = '${column}'
          `);
    return result.length > 0;
  }

  // Helper method to check if a table exists
  private async tableExists(
    queryRunner: QueryRunner,
    table: string
  ): Promise<boolean> {
    const result = await queryRunner.query(`
              SELECT table_name 
              FROM information_schema.tables 
              WHERE table_name = '${table}'
          `);
    return result.length > 0;
  }

  // Helper method to check if an index exists
  private async indexExists(
    queryRunner: QueryRunner,
    indexName: string
  ): Promise<boolean> {
    const result = await queryRunner.query(`
              SELECT indexname 
              FROM pg_indexes 
              WHERE indexname = '${indexName}'
          `);
    return result.length > 0;
  }

  // Helper method to get foreign key constraint names
  private async getForeignKeyConstraints(
    queryRunner: QueryRunner,
    table: string
  ): Promise<string[]> {
    const result = await queryRunner.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = '${table}'
        AND constraint_type = 'FOREIGN KEY'
      `);
    return result.map((row) => row.constraint_name);
  }

  // Helper method for logging
  private log(message: string): void {
    console.log(`[Migration1745545144475] ${message}`);
  }

  // Helper method to check if a column is referenced by foreign keys
  private async getReferencingColumns(
    queryRunner: QueryRunner,
    table: string,
    column: string
  ): Promise<string[]> {
    const result = await queryRunner.query(`
      SELECT
        tc.table_name AS referencing_table,
        kcu.column_name AS referencing_column
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE
        tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = '${table}'
        AND ccu.column_name = '${column}';
    `);

    return result.map(
      (row) => `${row.referencing_table}.${row.referencing_column}`
    );
  }
}
