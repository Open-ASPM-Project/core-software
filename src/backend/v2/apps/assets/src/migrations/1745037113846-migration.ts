import { MigrationInterface, QueryRunner } from 'typeorm';

// Define enum values based on scan.entity.ts
const scanStatusEnumValues = `'pending', 'sent', 'in_progress', 'completed', 'failed', 'cancelled'`;
const scanTypeEnumValues = `'asset_scan', 'vulnerability_scan'`;

// Define NEW enum values based on source.entity.ts and @firewall-backend/enums
const newCloudTypeEnumValues = `'aws', 'gcp', 'azure', 'digitalocean', 'scaleway', 'arvancloud', 'cloudflare', 'heroku', 'fastly', 'linode', 'namecheap', 'alibaba', 'terraform', 'consul', 'nomad', 'hetzner', 'kubernetes', 'dnssimple'`;

// Define the AssetSubType enum values
const assetSubTypeEnumValues = `'aws_ec2_instance', 'aws_vpc_security_group', 'aws_ec2_application_load_balancer', 'aws_ec2_classic_load_balancer', 'aws_ec2_gateway_load_balancer', 'aws_rds_db_instance', 'aws_route53_record', 'aws_s3_bucket', 'aws_api_gateway_rest_api', 'aws_api_gateway_stage'`;

const scanTriggerTypeEnumValues = `'scheduled_scan', 'manual_scan', 'asset_added', 'asset_updated', 'live_scan_nuclei_template_change', 'source_added', 'source_updated'`;

export class Migration1745037113846 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Scan Enum and Table Updates ---
    // Create Enums
    await queryRunner.query(`
            DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_status_enum') THEN CREATE TYPE scan_status_enum AS ENUM (${scanStatusEnumValues}); END IF; END $$;
        `);
    await queryRunner.query(`
            DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_type_enum') THEN CREATE TYPE scan_type_enum AS ENUM (${scanTypeEnumValues}); END IF; END $$;
        `);

    // Alter status column
    await queryRunner.query(
      `ALTER TABLE "scan" ALTER COLUMN status TYPE scan_status_enum USING status::text::scan_status_enum;`
    );
    await queryRunner.query(
      `ALTER TABLE "scan" ALTER COLUMN status SET DEFAULT 'pending';`
    );

    // Add and alter type column
    await queryRunner.query(
      `ALTER TABLE "scan" ADD COLUMN IF NOT EXISTS type VARCHAR;`
    ); // Add as VARCHAR first
    await queryRunner.query(
      `ALTER TABLE "scan" ALTER COLUMN type TYPE scan_type_enum USING type::text::scan_type_enum;`
    ); // Convert to Enum
    await queryRunner.query(
      `ALTER TABLE "scan" ALTER COLUMN type SET DEFAULT 'vulnerability_scan';`
    );

    // Rename messageCount to asset_count (assuming DB column was message_count or messageCount)
    // Check your actual DB column name before running!
    await queryRunner.query(
      `ALTER TABLE "scan" RENAME COLUMN "message_count" TO "asset_count";`
    );
    this.log(
      'Renamed column "message_count" to "asset_count" in "scan" table.'
    );

    // Ensure default is set if column was newly added or renamed without default
    await queryRunner.query(
      `ALTER TABLE "scan" ALTER COLUMN "asset_count" SET DEFAULT 0;`
    );
    await queryRunner.query(
      `ALTER TABLE "scan" ALTER COLUMN "asset_count" SET NOT NULL;`
    );

    // Add source_id column
    await queryRunner.query(
      `ALTER TABLE "scan" ADD COLUMN IF NOT EXISTS "source_id" INTEGER NULL;`
    );
    this.log('Added column "source_id" to "scan" table.');

    // 1. Create the scan_type_enum if it doesn't exist
    this.log('Ensuring scan_type_enum exists...');
    await queryRunner.query(`
       DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_type_enum') THEN
           CREATE TYPE scan_type_enum AS ENUM (${scanTypeEnumValues});
         END IF;
       END $$;
     `);

    // 2. Create the scan_trigger_type_enum
    this.log('Creating scan_trigger_type_enum...');
    await queryRunner.query(`
       DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_trigger_type_enum') THEN
           CREATE TYPE scan_trigger_type_enum AS ENUM (${scanTriggerTypeEnumValues});
         END IF;
       END $$;
     `);

    // 4. Add trigger_type column
    const triggerTypeExists = await this.columnExists(
      queryRunner,
      'scan',
      'trigger_type'
    );
    if (!triggerTypeExists) {
      this.log('Adding column "trigger_type"...');
      await queryRunner.query(`
         ALTER TABLE "scan"
         ADD COLUMN "trigger_type" scan_trigger_type_enum NOT NULL DEFAULT 'scheduled_scan';
       `);
      this.log('Added column "trigger_type" successfully.');
    } else {
      this.log('Column "trigger_type" already exists. Skipping add operation.');
    }

    // 5. Drop manual_trigger column if it exists
    const manualTriggerExists = await this.columnExists(
      queryRunner,
      'scan',
      'manual_trigger'
    );
    if (manualTriggerExists) {
      // Optional: Migrate data before dropping if needed
      // await queryRunner.query(`
      //   UPDATE "scan"
      //   SET trigger_type = CASE WHEN manual_trigger THEN 'manual_scan' ELSE 'scheduled_scan' END
      //   WHERE trigger_type = 'scheduled_scan';
      // `);
      // this.log('Migrated manual_trigger data to trigger_type.');

      this.log('Dropping column "manual_trigger"...');
      await queryRunner.query(`
         ALTER TABLE "scan"
         DROP COLUMN "manual_trigger";
       `);
      this.log('Dropped column "manual_trigger" successfully.');
    } else {
      this.log(
        'Column "manual_trigger" does not exist. Skipping drop operation.'
      );
    }

    // 6. Add source_count column if it doesn't exist
    const sourceCountExists = await this.columnExists(
      queryRunner,
      'scan',
      'source_count'
    );
    if (!sourceCountExists) {
      this.log('Adding column "source_count"...');
      await queryRunner.query(`
         ALTER TABLE "scan"
         ADD COLUMN "source_count" INTEGER NOT NULL DEFAULT 0;
       `);
      this.log('Added column "source_count" successfully.');
    } else {
      this.log('Column "source_count" already exists. Skipping add operation.');
    }

    // 7. Add source_id column if it doesn't exist
    const sourceIdExists = await this.columnExists(
      queryRunner,
      'scan',
      'source_id'
    );
    if (!sourceIdExists) {
      this.log('Adding column "source_id"...');
      await queryRunner.query(`
         ALTER TABLE "scan"
         ADD COLUMN "source_id" INTEGER NULL;
       `);
      this.log('Added column "source_id" successfully.');
    } else {
      this.log('Column "source_id" already exists. Skipping add operation.');
    }

    // --- End Scan Updates ---

    // --- Source Table Updates ---

    // 1. Replace cloud_type_enum by renaming old and creating new
    this.log('Replacing cloud_type_enum by renaming old and creating new...');
    const enumExistsResult = await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = 'cloud_type_enum'`
    );

    if (enumExistsResult.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "source" ALTER COLUMN cloud_type TYPE VARCHAR;`
      );
      this.log('Altered source.cloud_type to VARCHAR temporarily.');
      await queryRunner.query(
        `ALTER TYPE cloud_type_enum RENAME TO cloud_type_enum_old;`
      );
      this.log('Renamed existing cloud_type_enum to cloud_type_enum_old.');
      await queryRunner.query(
        `CREATE TYPE cloud_type_enum AS ENUM (${newCloudTypeEnumValues});`
      );
      this.log('Created new cloud_type_enum with updated values.');
      await queryRunner.query(`
            ALTER TABLE "source"
            ALTER COLUMN cloud_type TYPE cloud_type_enum
            USING cloud_type::text::cloud_type_enum;
        `);
      this.log('Altered source.cloud_type back to new cloud_type_enum.');
    } else {
      this.log(`cloud_type_enum does not exist. Creating it fresh.`);
      await queryRunner.query(
        `CREATE TYPE cloud_type_enum AS ENUM (${newCloudTypeEnumValues});`
      );
      this.log(`Created cloud_type_enum with values.`);
      await queryRunner.query(
        `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS cloud_type VARCHAR;`
      );
      await queryRunner.query(
        `ALTER TABLE "source" ALTER COLUMN cloud_type TYPE cloud_type_enum USING cloud_type::text::cloud_type_enum;`
      );
      this.log(`Ensured source.cloud_type uses the new enum.`);
    }

    // 2. Add New Columns to source table
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS aws_access_key VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS aws_secret_key VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS gcp_service_account_key TEXT NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS tenant_id VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS subscription_id VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS digitalocean_token VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS scaleway_access_key VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS scaleway_access_token VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS api_key VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS email VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS heroku_api_token VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS fastly_api_key VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS linode_personal_access_token VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS namecheap_api_key VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS namecheap_user_name VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS alibaba_region_id VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS alibaba_access_key VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS alibaba_access_key_secret VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS tf_state_file VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS consul_url VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS nomad_url VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS auth_token VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS kubeconfig_file VARCHAR NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS kubeconfig_encoded TEXT NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS dnssimple_api_token VARCHAR NULL;`
    );

    // Add the schedule_id column (nullable to allow existing records to remain valid)
    await queryRunner.query(
      `ALTER TABLE "source" ADD COLUMN IF NOT EXISTS "schedule_id" INTEGER NULL;`
    );
    this.log('Added column "schedule_id" to "source" table.');

    // Add the foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "source" ADD CONSTRAINT "FK_source_schedule" 
         FOREIGN KEY ("schedule_id") REFERENCES "schedule"("id") 
         ON DELETE SET NULL ON UPDATE NO ACTION;`
    );
    this.log('Added foreign key constraint "FK_source_schedule".');

    this.log('Added new columns to source table.');
    // --- End Source Updates ---

    // First check if the asset table exists
    const assetTableExists = await queryRunner.hasTable('asset');
    if (!assetTableExists) {
      this.log('Asset table does not exist. Skipping migration.');
      return;
    }

    // 1. Create the asset_sub_type_enum
    this.log('Creating asset_sub_type_enum...');
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_sub_type_enum') THEN
          CREATE TYPE asset_sub_type_enum AS ENUM (${assetSubTypeEnumValues});
        END IF;
      END $$;
    `);
    this.log('Created asset_sub_type_enum successfully.');

    // 2. Check if we need to rename the column
    const assetTypeExists = await this.columnExists(
      queryRunner,
      'asset',
      'asset_type'
    );
    const typeExists = await this.columnExists(queryRunner, 'asset', 'type');

    if (assetTypeExists && !typeExists) {
      // Rename asset_type to type
      this.log('Renaming column "asset_type" to "type"...');
      await queryRunner.query(
        `ALTER TABLE "asset" RENAME COLUMN "asset_type" TO "type";`
      );
      this.log('Renamed column "asset_type" to "type" successfully.');
    } else if (typeExists) {
      this.log('Column "type" already exists. Skipping rename operation.');
    } else {
      this.log('Column "asset_type" does not exist. Cannot rename.');
    }

    // 3. Check if we need to add the sub_type column
    const subTypeExists = await this.columnExists(
      queryRunner,
      'asset',
      'sub_type'
    );

    if (!subTypeExists) {
      // Add sub_type column
      this.log('Adding column "sub_type"...');
      await queryRunner.query(`
        ALTER TABLE "asset" 
        ADD COLUMN IF NOT EXISTS "sub_type" asset_sub_type_enum NULL;
      `);
      this.log('Added column "sub_type" successfully.');
    } else {
      this.log('Column "sub_type" already exists. Skipping add operation.');
    }

    // Check if the schedule table exists
    const scheduleTableExists = await queryRunner.hasTable('schedule');
    if (!scheduleTableExists) {
      this.log('Schedule table does not exist. Skipping migration.');
      return;
    }

    // Check if the old 'profiles' column exists
    const profilesExists = await this.columnExists(
      queryRunner,
      'schedule',
      'profiles'
    );
    if (profilesExists) {
      // Check if the new vulnerability_profiles column already exists
      const vulnerabilityProfilesExists = await this.columnExists(
        queryRunner,
        'schedule',
        'vulnerability_profiles'
      );

      if (!vulnerabilityProfilesExists) {
        // Rename the column
        this.log('Renaming column "profiles" to "vulnerability_profiles"...');
        await queryRunner.query(
          `ALTER TABLE "schedule" RENAME COLUMN "profiles" TO "vulnerability_profiles";`
        );
        this.log(
          'Renamed column "profiles" to "vulnerability_profiles" successfully.'
        );
      } else {
        // Both columns exist - we need to handle this case carefully
        this.log(
          'Both "profiles" and "vulnerability_profiles" columns exist. This is an unexpected state.'
        );
        this.log('Will attempt to merge data and drop the redundant column.');

        // Copy data from profiles to vulnerability_profiles if vulnerability_profiles is empty/null
        await queryRunner.query(`
          UPDATE "schedule"
          SET "vulnerability_profiles" = "profiles"
          WHERE "vulnerability_profiles" IS NULL AND "profiles" IS NOT NULL;
        `);
        this.log(
          'Migrated data from "profiles" to "vulnerability_profiles" where needed.'
        );

        // Drop the old column
        await queryRunner.query(
          `ALTER TABLE "schedule" DROP COLUMN "profiles";`
        );
        this.log('Dropped redundant "profiles" column.');
      }
    } else {
      this.log(
        'Column "profiles" does not exist. Checking for expected "vulnerability_profiles" column.'
      );

      // Check if vulnerability_profiles column already exists as expected
      const vulnerabilityProfilesExists = await this.columnExists(
        queryRunner,
        'schedule',
        'vulnerability_profiles'
      );

      if (vulnerabilityProfilesExists) {
        this.log(
          'Column "vulnerability_profiles" already exists. No action needed.'
        );
      } else {
        this.log(
          'Neither "profiles" nor "vulnerability_profiles" columns exist.'
        );
        this.log(
          'Will create "vulnerability_profiles" column with appropriate type.'
        );

        // Check if VulnerabilityProfiles enum type exists
        const enumExists = await queryRunner.query(`
          SELECT 1 FROM pg_type WHERE typname = 'vulnerability_profiles_enum'
          UNION
          SELECT 1 FROM pg_type WHERE typname = 'vulnerabilityprofiles_enum'
        `);

        if (enumExists.length > 0) {
          // Use existing enum type
          const enumName = enumExists[0].typname;
          this.log(`Using existing enum type: ${enumName}`);

          await queryRunner.query(`
            ALTER TABLE "schedule" 
            ADD COLUMN "vulnerability_profiles" ${enumName}[] NULL;
          `);
        } else {
          // Create a generic array column if we don't know the enum type
          this.log('No enum type found. Creating a generic text array column.');
          await queryRunner.query(`
            ALTER TABLE "schedule" 
            ADD COLUMN "vulnerability_profiles" TEXT[] NULL;
          `);
        }
        this.log('Added "vulnerability_profiles" column.');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if the schedule table exists
    const scheduleTableExists = await queryRunner.hasTable('schedule');
    if (!scheduleTableExists) {
      this.log('Schedule table does not exist. Skipping rollback.');
      return;
    }

    // Check if the new 'vulnerability_profiles' column exists
    const vulnerabilityProfilesExists = await this.columnExists(
      queryRunner,
      'schedule',
      'vulnerability_profiles'
    );

    // Check if the old 'profiles' column exists
    const profilesExists = await this.columnExists(
      queryRunner,
      'schedule',
      'profiles'
    );

    if (vulnerabilityProfilesExists && !profilesExists) {
      // Rename vulnerability_profiles back to profiles
      this.log(
        'Renaming column "vulnerability_profiles" back to "profiles"...'
      );
      await queryRunner.query(
        `ALTER TABLE "schedule" RENAME COLUMN "vulnerability_profiles" TO "profiles";`
      );
      this.log(
        'Renamed column "vulnerability_profiles" back to "profiles" successfully.'
      );
    } else if (vulnerabilityProfilesExists && profilesExists) {
      // Both columns exist - this is an unusual state for the down migration
      this.log(
        'Both "profiles" and "vulnerability_profiles" columns exist. This is an unexpected state.'
      );
      this.log(
        'Will drop the "vulnerability_profiles" column to revert to original state.'
      );
      await queryRunner.query(
        `ALTER TABLE "schedule" DROP COLUMN "vulnerability_profiles";`
      );
      this.log('Dropped "vulnerability_profiles" column.');
    } else if (!vulnerabilityProfilesExists && !profilesExists) {
      this.log(
        'Neither "profiles" nor "vulnerability_profiles" columns exist. Nothing to revert.'
      );
    }

    // --- Source Table Reversion ---
    // Drop added columns
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS aws_access_key;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS aws_secret_key;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS gcp_service_account_key;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS tenant_id;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS subscription_id;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS digitalocean_token;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS scaleway_access_key;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS scaleway_access_token;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS api_key;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS email;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS heroku_api_token;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS fastly_api_key;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS linode_personal_access_token;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS namecheap_api_key;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS namecheap_user_name;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS alibaba_region_id;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS alibaba_access_key;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS alibaba_access_key_secret;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS tf_state_file;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS consul_url;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS nomad_url;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS auth_token;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS kubeconfig_file;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS kubeconfig_encoded;`
    );
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS dnssimple_api_token;`
    );

    // Drop the foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "source" DROP CONSTRAINT IF EXISTS "FK_source_schedule";`
    );
    this.log('Dropped foreign key constraint "FK_source_schedule".');

    // Drop the column
    await queryRunner.query(
      `ALTER TABLE "source" DROP COLUMN IF EXISTS "schedule_id";`
    );
    this.log('Dropped column "schedule_id" from "source" table.');

    this.log('Dropped new columns from source table.');

    // Revert cloud_type_enum replacement
    this.log('Reverting cloud_type_enum replacement...');
    const newEnumExists = await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = 'cloud_type_enum'`
    );
    if (newEnumExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "source" ALTER COLUMN cloud_type TYPE VARCHAR;`
      );
      this.log('Altered source.cloud_type to VARCHAR.');
      await queryRunner.query(`DROP TYPE cloud_type_enum;`);
      this.log('Dropped the new cloud_type_enum.');
    } else {
      this.log('New cloud_type_enum not found, skipping drop.');
    }
    const oldEnumExists = await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = 'cloud_type_enum_old'`
    );
    if (oldEnumExists.length > 0) {
      await queryRunner.query(
        `ALTER TYPE cloud_type_enum_old RENAME TO cloud_type_enum;`
      );
      this.log('Renamed cloud_type_enum_old back to cloud_type_enum.');
      await queryRunner.query(`
                ALTER TABLE "source"
                ALTER COLUMN cloud_type TYPE cloud_type_enum
                USING cloud_type::text::cloud_type_enum;
            `);
      this.log('Altered source.cloud_type back to original cloud_type_enum.');
    } else {
      this.log(
        'Old cloud_type_enum_old not found, cannot rename back or alter column type.'
      );
    }
    // --- End Source Reversion ---

    // --- Scan Table Reversion ---
    // Optional: Drop foreign key constraint for source_id
    // await queryRunner.query(`ALTER TABLE "scan" DROP CONSTRAINT IF EXISTS "FK_scan_source";`);
    // this.log('Dropped foreign key constraint FK_scan_source.');

    // Optional: Drop index for source_id
    // await queryRunner.query(`DROP INDEX IF EXISTS "IDX_scan_source_id";`);
    // this.log('Dropped index IDX_scan_source_id.');

    // Drop source_id column
    await queryRunner.query(
      `ALTER TABLE "scan" DROP COLUMN IF EXISTS "source_id";`
    );
    this.log('Dropped column "source_id" from "scan" table.');

    // Rename asset_count back to messageCount (or message_count)
    await queryRunner.query(
      `ALTER TABLE "scan" RENAME COLUMN "asset_count" TO "message_count";`
    );
    this.log(
      'Renamed column "asset_count" back to "message_count" in "scan" table.'
    );

    // Revert status column
    await queryRunner.query(
      `ALTER TABLE "scan" ALTER COLUMN status DROP DEFAULT;`
    );
    await queryRunner.query(
      `ALTER TABLE "scan" ALTER COLUMN status TYPE VARCHAR;`
    );

    // Revert type column
    await queryRunner.query(
      `ALTER TABLE "scan" ALTER COLUMN type DROP DEFAULT;`
    );
    await queryRunner.query(
      `ALTER TABLE "scan" ALTER COLUMN type TYPE VARCHAR;`
    );
    // Drop type column if it was added by this migration (check if ADD COLUMN was used)
    // Assuming it was added:
    await queryRunner.query(`ALTER TABLE "scan" DROP COLUMN IF EXISTS type;`);

    // Drop Enums
    await queryRunner.query(`DROP TYPE IF EXISTS scan_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS scan_type_enum;`);

    // 3. Drop source_id column
    const sourceIdExists = await this.columnExists(
      queryRunner,
      'scan',
      'source_id'
    );
    if (sourceIdExists) {
      this.log('Dropping column "source_id"...');
      await queryRunner.query(`
        ALTER TABLE "scan" DROP COLUMN "source_id";
      `);
      this.log('Dropped column "source_id".');
    }

    // 4. Drop source_count column
    const sourceCountExists = await this.columnExists(
      queryRunner,
      'scan',
      'source_count'
    );
    if (sourceCountExists) {
      this.log('Dropping column "source_count"...');
      await queryRunner.query(`
        ALTER TABLE "scan" DROP COLUMN "source_count";
      `);
      this.log('Dropped column "source_count".');
    }

    // 5. Add back manual_trigger column
    const manualTriggerExists = await this.columnExists(
      queryRunner,
      'scan',
      'manual_trigger'
    );
    if (!manualTriggerExists) {
      this.log('Adding back column "manual_trigger"...');
      await queryRunner.query(`
        ALTER TABLE "scan" ADD COLUMN "manual_trigger" BOOLEAN NOT NULL DEFAULT false;
      `);

      this.log('Added back column "manual_trigger".');
    }

    // 6. Drop trigger_type column
    const triggerTypeExists = await this.columnExists(
      queryRunner,
      'scan',
      'trigger_type'
    );
    if (triggerTypeExists) {
      this.log('Dropping column "trigger_type"...');
      await queryRunner.query(`
        ALTER TABLE "scan" DROP COLUMN "trigger_type";
      `);
      this.log('Dropped column "trigger_type".');
    }

    // For scan_trigger_type_enum, it's likely unique to this migration
    this.log('Dropping scan_trigger_type_enum...');
    await queryRunner.query(`DROP TYPE IF EXISTS scan_trigger_type_enum;`);

    // --- End Scan Reversion ---

    // First check if the asset table exists
    const assetTableExists = await queryRunner.hasTable('asset');
    if (!assetTableExists) {
      this.log('Asset table does not exist. Skipping rollback.');
      return;
    }

    // 1. Drop the sub_type column if it exists
    const subTypeExists = await this.columnExists(
      queryRunner,
      'asset',
      'sub_type'
    );
    if (subTypeExists) {
      this.log('Dropping column "sub_type"...');
      await queryRunner.query(
        `ALTER TABLE "asset" DROP COLUMN IF EXISTS "sub_type";`
      );
      this.log('Dropped column "sub_type" successfully.');
    }

    // 2. Rename type column back to asset_type if type exists and asset_type doesn't
    const typeExists = await this.columnExists(queryRunner, 'asset', 'type');
    const assetTypeExists = await this.columnExists(
      queryRunner,
      'asset',
      'asset_type'
    );

    if (typeExists && !assetTypeExists) {
      this.log('Renaming column "type" back to "asset_type"...');
      await queryRunner.query(
        `ALTER TABLE "asset" RENAME COLUMN "type" TO "asset_type";`
      );
      this.log('Renamed column "type" back to "asset_type" successfully.');
    }

    // 3. Drop the asset_sub_type_enum if it exists
    this.log('Dropping asset_sub_type_enum...');
    await queryRunner.query(`
      DROP TYPE IF EXISTS asset_sub_type_enum;
    `);
    this.log('Dropped asset_sub_type_enum successfully.');
  }

  // Helper for logging within migration
  private log(message: string): void {
    console.log(`[Migration1745037113846] ${message}`);
  }

  // Helper method to check if a column exists
  private async columnExists(
    queryRunner: QueryRunner,
    table: string,
    column: string
  ): Promise<boolean> {
    try {
      const result = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}' AND column_name = '${column}';
      `);
      return result.length > 0;
    } catch (error) {
      this.log(`Error checking if column exists: ${error.message}`);
      return false;
    }
  }
}
