import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1742487469083 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum for VulnerabilityProfiles if it doesn't exist
    await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vulnerability_profiles_enum') THEN
                        CREATE TYPE vulnerability_profiles_enum AS ENUM ('cve', 'default-logins', 'dns', 'misconfig', 'ssl', 'tech-detect', 'oswap-top-10');
                    END IF;
                END$$;
            `);

    // Create enum for ScanStatus if it doesn't exist
    await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_status_enum') THEN
                        CREATE TYPE scan_status_enum AS ENUM ('pending', 'sent', 'in_progress', 'completed', 'failed', 'cancelled');
                    END IF;
                END$$;
            `);

    // Create schedule table
    await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS schedule (
                    id SERIAL PRIMARY KEY,
                    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
                    name VARCHAR(255) UNIQUE NOT NULL,
                    active BOOLEAN DEFAULT true NOT NULL,
                    deleted BOOLEAN DEFAULT false NOT NULL,
                    interval INTEGER NOT NULL CHECK (interval > 0),
                    profiles vulnerability_profiles_enum[] NULL,
                    created_at TIMESTAMP DEFAULT now() NOT NULL,
                    updated_at TIMESTAMP DEFAULT now() NOT NULL,
                    added_by_uid INTEGER NULL REFERENCES "users" (id),
                    updated_by_uid INTEGER NULL REFERENCES "users" (id)
                )
            `);

    // Create scan table
    await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS scan (
                    id SERIAL PRIMARY KEY,
                    uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
                    status scan_status_enum DEFAULT 'pending' NOT NULL,
                    manual_trigger BOOLEAN DEFAULT false NOT NULL,
                    message_count INTEGER DEFAULT 0 NOT NULL,
                    failure_count INTEGER DEFAULT 0 NOT NULL,
                    is_asset_added_scan BOOLEAN DEFAULT false NOT NULL,
                    asset_id INTEGER NULL,
                    schedule_id INTEGER NULL REFERENCES schedule(id),
                    created_at TIMESTAMP DEFAULT now() NOT NULL,
                    updated_at TIMESTAMP DEFAULT now() NOT NULL,
                    added_by_uid INTEGER NULL REFERENCES "users" (id),
                    updated_by_uid INTEGER NULL REFERENCES "users" (id)
                )
            `);

    // Add trigger for updated_at timestamps on schedule table
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION update_schedule_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS update_schedule_updated_at ON "schedule";
        
        CREATE TRIGGER update_schedule_updated_at
        BEFORE UPDATE ON "schedule"
        FOR EACH ROW EXECUTE FUNCTION update_schedule_updated_at_column();
    `);

    // Add trigger for updated_at timestamps on scan table
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION update_scan_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS update_scan_updated_at ON "scan";
        
        CREATE TRIGGER update_scan_updated_at
        BEFORE UPDATE ON "scan"
        FOR EACH ROW EXECUTE FUNCTION update_scan_updated_at_column();
    `);

    // Add scheduleId column to asset table
    await queryRunner.query(`
                ALTER TABLE asset 
                ADD COLUMN IF NOT EXISTS schedule_id INTEGER NULL REFERENCES schedule(id)
            `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_schedule_deleted ON schedule(deleted)`
    );

    // Add index on scan table for status and asset_id for better performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_scan_status ON "scan"(status);
      CREATE INDEX IF NOT EXISTS IDX_scan_asset_id ON "scan"(asset_id);
      CREATE INDEX IF NOT EXISTS IDX_scan_schedule_id ON "scan"(schedule_id);
      CREATE INDEX IF NOT EXISTS IDX_scan_created_at ON "scan"(created_at);
      CREATE INDEX IF NOT EXISTS IDX_scan_uuid ON "scan"(uuid);
    `);

    // Add additional index for schedule table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_schedule_active ON "schedule"(active);
      CREATE INDEX IF NOT EXISTS IDX_schedule_uuid ON "schedule"(uuid);
      CREATE INDEX IF NOT EXISTS IDX_schedule_name ON "schedule"(name);
    `);

    // Create group table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "group" (
                id SERIAL PRIMARY KEY,
                uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT NULL,
                active BOOLEAN DEFAULT true NOT NULL,
                deleted BOOLEAN DEFAULT false NOT NULL,
                created_at TIMESTAMP DEFAULT now() NOT NULL,
                updated_at TIMESTAMP DEFAULT now() NOT NULL,
                added_by_uid INTEGER NULL REFERENCES "users" (id),
                updated_by_uid INTEGER NULL REFERENCES "users" (id)
            )
        `);

    // Create indexes for group table
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_group_deleted ON "group"(deleted);
            CREATE INDEX IF NOT EXISTS IDX_group_name ON "group"(name);
            CREATE INDEX IF NOT EXISTS IDX_group_uuid ON "group"(uuid);
        `);

    // Create group_asset join table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "group_asset" (
                id SERIAL PRIMARY KEY,
                group_id INTEGER NOT NULL REFERENCES "group"(id) ON DELETE CASCADE,
                asset_id INTEGER NOT NULL REFERENCES "asset"(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT now() NOT NULL,
                updated_at TIMESTAMP DEFAULT now() NOT NULL,
                added_by_uid INTEGER NULL REFERENCES "users"(id)
            )
        `);

    // Create indexes for group_asset table
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_group_asset_group_id ON "group_asset"(group_id);
            CREATE INDEX IF NOT EXISTS IDX_group_asset_asset_id ON "group_asset"(asset_id);
            CREATE UNIQUE INDEX IF NOT EXISTS IDX_group_asset_group_id_asset_id ON "group_asset"(group_id, asset_id);
        `);

    // Add trigger for updated_at timestamps on group table
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_group_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            DROP TRIGGER IF EXISTS update_group_updated_at ON "group";
            
            CREATE TRIGGER update_group_updated_at
            BEFORE UPDATE ON "group"
            FOR EACH ROW EXECUTE FUNCTION update_group_updated_at_column();
        `);

    // Add trigger for updated_at timestamps on group_asset table
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_group_asset_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            DROP TRIGGER IF EXISTS update_group_asset_updated_at ON "group_asset";
            
            CREATE TRIGGER update_group_asset_updated_at
            BEFORE UPDATE ON "group_asset"
            FOR EACH ROW EXECUTE FUNCTION update_group_asset_updated_at_column();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove triggers
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_scan_updated_at ON "scan";
      DROP FUNCTION IF EXISTS update_scan_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_schedule_updated_at ON "schedule";
      DROP FUNCTION IF EXISTS update_schedule_updated_at_column();
    `);

    // Remove indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_scan_status;
      DROP INDEX IF EXISTS IDX_scan_asset_id;
      DROP INDEX IF EXISTS IDX_scan_schedule_id;
      DROP INDEX IF EXISTS IDX_scan_created_at;
      DROP INDEX IF EXISTS IDX_scan_uuid;
      
      DROP INDEX IF EXISTS IDX_schedule_active;
      DROP INDEX IF EXISTS IDX_schedule_uuid;
      DROP INDEX IF EXISTS IDX_schedule_name;
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_schedule_deleted`);

    // Remove foreign key constraint from asset table
    await queryRunner.query(`
                ALTER TABLE asset 
                DROP COLUMN IF EXISTS schedule_id
            `);

    // Drop scan table
    await queryRunner.query(`DROP TABLE IF EXISTS scan`);

    // Drop schedule table
    await queryRunner.query(`DROP TABLE IF EXISTS schedule`);

    // Drop custom enum types
    await queryRunner.query(`DROP TYPE IF EXISTS scan_status_enum`);
    // Note: Don't drop vulnerability_profiles_enum if it's used elsewhere

    // Remove triggers
    await queryRunner.query(`
            DROP TRIGGER IF EXISTS update_group_asset_updated_at ON "group_asset";
            DROP TRIGGER IF EXISTS update_group_updated_at ON "group";
            DROP FUNCTION IF EXISTS update_group_asset_updated_at_column();
            DROP FUNCTION IF EXISTS update_group_updated_at_column();
        `);

    // Drop indexes
    await queryRunner.query(`
            DROP INDEX IF EXISTS IDX_group_asset_group_id_asset_id;
            DROP INDEX IF EXISTS IDX_group_asset_asset_id;
            DROP INDEX IF EXISTS IDX_group_asset_group_id;
            DROP INDEX IF EXISTS IDX_group_uuid;
            DROP INDEX IF EXISTS IDX_group_name;
            DROP INDEX IF EXISTS IDX_group_deleted;
        `);

    // Drop tables (in correct order to respect foreign key constraints)
    await queryRunner.query(`DROP TABLE IF EXISTS "group_asset"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "group"`);
  }
}
