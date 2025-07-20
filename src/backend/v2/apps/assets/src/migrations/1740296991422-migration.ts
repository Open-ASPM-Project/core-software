import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1740296991422 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE source_type_enum AS ENUM ('cloud', 'repo');
        `);

    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS source (
                id SERIAL PRIMARY KEY,
                type source_type_enum NOT NULL,
                name VARCHAR(255) UNIQUE NOT NULL,
                active BOOLEAN DEFAULT true,
                deleted BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now(),
                added_by_uid INTEGER,
                updated_by_uid INTEGER,
                CONSTRAINT fk_added_by FOREIGN KEY (added_by_uid) REFERENCES users(id),
                CONSTRAINT fk_updated_by FOREIGN KEY (updated_by_uid) REFERENCES users(id)
            );
        `);

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
            CREATE TYPE cloud_type_enum AS ENUM ('aws', 'gcp', 'azure');
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
            CREATE TYPE asset_type_enum AS ENUM ('webapp', 'ip', 'domain', 'subdomain', 'port');
        `);

    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS asset (
                id SERIAL PRIMARY KEY,
                type asset_type_enum NOT NULL,
                name VARCHAR(255) UNIQUE NOT NULL,
                active BOOLEAN DEFAULT true,
                deleted BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now(),
                added_by_uid INTEGER,
                updated_by_uid INTEGER,
                source_id INTEGER NOT NULL,
                CONSTRAINT fk_added_by FOREIGN KEY (added_by_uid) REFERENCES users(id),
                CONSTRAINT fk_updated_by FOREIGN KEY (updated_by_uid) REFERENCES users(id),
                CONSTRAINT fk_source FOREIGN KEY (source_id) REFERENCES source(id)
            );

            CREATE INDEX IF NOT EXISTS IDX_asset_type ON asset (type);
            CREATE INDEX IF NOT EXISTS IDX_asset_name ON asset (name);
            CREATE INDEX IF NOT EXISTS IDX_asset_deleted ON asset (deleted);
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS subdomain;`);
    await queryRunner.query(`DROP TABLE IF EXISTS domain;`);
    await queryRunner.query(`DROP TABLE IF EXISTS asset;`);
    await queryRunner.query(`DROP TYPE IF EXISTS asset_type_enum;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cloud;`);
    await queryRunner.query(`DROP TABLE IF EXISTS repo;`);
    await queryRunner.query(`DROP TABLE IF EXISTS source;`);
    await queryRunner.query(`DROP TYPE IF EXISTS cloud_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS source_type_enum;`);
  }
}