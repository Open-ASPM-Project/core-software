import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1740930643377 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS subdomain;`);
    await queryRunner.query(`DROP TABLE IF EXISTS domain;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cloud;`);
    await queryRunner.query(`DROP TABLE IF EXISTS repo;`);

    await queryRunner.query(
      `ALTER TABLE source ADD COLUMN uuid uuid DEFAULT uuid_generate_v4();`
    );
    await queryRunner.query(
      `ALTER TABLE source ADD COLUMN cloud_type cloud_type_enum;`
    );
    await queryRunner.query(
      `ALTER TABLE source ADD COLUMN client_id VARCHAR(255);`
    );
    await queryRunner.query(
      `ALTER TABLE source ADD COLUMN client_secret VARCHAR(255);`
    );
    await queryRunner.query(
      `ALTER TABLE source RENAME COLUMN type TO source_type;`
    );
    await queryRunner.query(
      `ALTER TYPE source_type_enum RENAME TO source_type_enum_old;`
    );
    await queryRunner.query(`CREATE TYPE source_type_enum AS ENUM ('cloud');`);
    await queryRunner.query(
      `ALTER TABLE source ALTER COLUMN source_type TYPE source_type_enum USING source_type::text::source_type_enum;`
    );
    await queryRunner.query(`DROP TYPE source_type_enum_old;`);

    await queryRunner.query(`
            CREATE TYPE ip_type_enum AS ENUM ('ipv4', 'ipv6');
        `);

    await queryRunner.query(
      `ALTER TABLE asset ADD COLUMN uuid uuid DEFAULT uuid_generate_v4();`
    );
    await queryRunner.query(`ALTER TABLE asset ADD COLUMN url VARCHAR(255);`);
    await queryRunner.query(
      `ALTER TABLE asset ADD COLUMN ip_type ip_type_enum;`
    );
    await queryRunner.query(
      `ALTER TABLE asset ADD COLUMN ip_address VARCHAR(255);`
    );
    await queryRunner.query(
      `ALTER TABLE asset ADD COLUMN port INTEGER CHECK (port >= 0 AND port <= 65535);`
    );
    await queryRunner.query(
      `ALTER TABLE asset RENAME COLUMN type TO asset_type;`
    );
    await queryRunner.query(
      `ALTER TYPE asset_type_enum RENAME TO asset_type_enum_old;`
    );
    await queryRunner.query(
      `CREATE TYPE asset_type_enum AS ENUM ('webapp', 'ip', 'domain', 'subdomain');`
    );
    await queryRunner.query(
      `ALTER TABLE asset ALTER COLUMN asset_type TYPE asset_type_enum USING asset_type::text::asset_type_enum;`
    );
    await queryRunner.query(`DROP TYPE asset_type_enum_old;`);

    await queryRunner.query(`ALTER TABLE asset ADD COLUMN domain_id INTEGER;`);
    await queryRunner.query(
      `ALTER TABLE asset ADD CONSTRAINT FK_domain_asset FOREIGN KEY (domain_id) REFERENCES asset(id);`
    );

    await queryRunner.query(`ALTER TABLE asset ADD COLUMN ip_id INTEGER;`);
    await queryRunner.query(
      `ALTER TABLE asset ADD CONSTRAINT FK_ip_asset FOREIGN KEY (ip_id) REFERENCES asset(id);`
    );

    await queryRunner.query(
      `ALTER TABLE asset ADD COLUMN subdomain_id INTEGER;`
    );
    await queryRunner.query(
      `ALTER TABLE asset ADD CONSTRAINT FK_subdomain_asset FOREIGN KEY (subdomain_id) REFERENCES asset(id);`
    );

    // Create AssetToSource table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS asset_to_source (
          asset_id INTEGER NOT NULL,
          source_id INTEGER NOT NULL,
          added_by_uid INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          PRIMARY KEY (asset_id, source_id),
          CONSTRAINT FK_asset_to_source_asset FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE CASCADE,
          CONSTRAINT FK_asset_to_source_source FOREIGN KEY (source_id) REFERENCES source(id) ON DELETE CASCADE,
          CONSTRAINT FK_asset_to_source_user FOREIGN KEY (added_by_uid) REFERENCES users(id)
      );
  `);

    // Remove name column from asset table
    await queryRunner.query(`ALTER TABLE asset DROP COLUMN name;`);

    // Remove source_id column and foreign key constraint from asset table
    await queryRunner.query(
      `ALTER TABLE asset DROP CONSTRAINT IF EXISTS fk_source;`
    );
    await queryRunner.query(
      `ALTER TABLE asset DROP COLUMN IF EXISTS source_id;`
    );

    // Add indexes to asset table
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_asset_asset_type ON asset (asset_type);`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_asset_url ON asset (url);`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_asset_deleted ON asset (deleted);`
    );

    // Add indexes to source table
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_source_source_type ON source (source_type);`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_source_name ON source (name);`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_source_deleted ON source (deleted);`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop AssetToSource table
    await queryRunner.query(`DROP TABLE IF EXISTS asset_to_source;`);

    // Add name column back to asset table
    await queryRunner.query(
      `ALTER TABLE asset ADD COLUMN name VARCHAR(255) UNIQUE;`
    );

    // Add source_id column back to asset table
    await queryRunner.query(`ALTER TABLE asset ADD COLUMN source_id INTEGER;`);
    await queryRunner.query(
      `ALTER TABLE asset ADD CONSTRAINT fk_source FOREIGN KEY (source_id) REFERENCES source(id);`
    );

    // Drop indexes from asset table
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_asset_asset_type;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_asset_url;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_asset_deleted;`);

    // Drop indexes from source table
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_source_source_type;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_source_name;`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_source_deleted;`);

    await queryRunner.query(
      `ALTER TABLE asset DROP CONSTRAINT FK_subdomain_asset;`
    );
    await queryRunner.query(`ALTER TABLE asset DROP COLUMN subdomain_id;`);

    await queryRunner.query(`ALTER TABLE asset DROP CONSTRAINT FK_ip_asset;`);
    await queryRunner.query(`ALTER TABLE asset DROP COLUMN ip_id;`);

    await queryRunner.query(
      `ALTER TABLE asset DROP CONSTRAINT FK_domain_asset;`
    );
    await queryRunner.query(`ALTER TABLE asset DROP COLUMN domain_id;`);

    await queryRunner.query(`ALTER TABLE asset DROP COLUMN uuid;`);
    await queryRunner.query(`ALTER TABLE asset DROP COLUMN url;`);
    await queryRunner.query(`ALTER TABLE asset DROP COLUMN ip_type;`);
    await queryRunner.query(`ALTER TABLE asset DROP COLUMN ip_address;`);
    await queryRunner.query(`ALTER TABLE asset DROP COLUMN port;`);
    await queryRunner.query(
      `ALTER TABLE asset RENAME COLUMN asset_type TO type;`
    );
    await queryRunner.query(
      `ALTER TYPE asset_type_enum RENAME TO asset_type_enum_old;`
    );
    await queryRunner.query(
      `CREATE TYPE asset_type_enum AS ENUM ('webapp', 'ip', 'domain', 'subdomain', 'port');`
    );
    await queryRunner.query(
      `ALTER TABLE asset ALTER COLUMN type TYPE asset_type_enum USING type::text::asset_type_enum;`
    );
    await queryRunner.query(`DROP TYPE asset_type_enum_old;`);
    await queryRunner.query(`DROP TYPE IF EXISTS ip_type_enum;`);

    await queryRunner.query(`ALTER TABLE source DROP COLUMN uuid;`);
    await queryRunner.query(`ALTER TABLE source DROP COLUMN cloud_type;`);
    await queryRunner.query(`ALTER TABLE source DROP COLUMN client_id;`);
    await queryRunner.query(`ALTER TABLE source DROP COLUMN client_secret;`);
    await queryRunner.query(
      `ALTER TABLE source RENAME COLUMN source_type TO type;`
    );
    await queryRunner.query(
      `ALTER TYPE source_type_enum RENAME TO source_type_enum_old;`
    );
    await queryRunner.query(
      `CREATE TYPE source_type_enum AS ENUM ('cloud', 'repo');`
    );
    await queryRunner.query(
      `ALTER TABLE source ALTER COLUMN type TYPE source_type_enum USING type::text::source_type_enum;`
    );
    await queryRunner.query(`DROP TYPE source_type_enum_old;`);

    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS repo (
                source_id INTEGER PRIMARY KEY,
                url VARCHAR(255) NOT NULL,
                author VARCHAR(255) NOT NULL,
                last_scan_date TIMESTAMP,
                CONSTRAINT fk_source FOREIGN KEY (source_id) REFERENCES source(id)
            );
        `);
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS cloud (
                source_id INTEGER PRIMARY KEY,
                type cloud_type_enum NOT NULL,
                client_id VARCHAR(255) NOT NULL,
                client_secret VARCHAR(255) NOT NULL,
                CONSTRAINT fk_source FOREIGN KEY (source_id) REFERENCES source(id)
            );
        `);
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS domain (
                asset_id INTEGER PRIMARY KEY,
                url VARCHAR(255) NOT NULL,
                CONSTRAINT FK_domain_asset FOREIGN KEY (asset_id) REFERENCES asset(id)
            );
        `);

    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS subdomain (
                asset_id INTEGER PRIMARY KEY,
                url VARCHAR(255) NOT NULL,
                domain_id INTEGER NOT NULL,
                CONSTRAINT FK_subdomain_domain FOREIGN KEY (domain_id) REFERENCES domain(asset_id),
                CONSTRAINT FK_subdomain_asset FOREIGN KEY (asset_id) REFERENCES asset(id)
            );
        `);
  }
}
