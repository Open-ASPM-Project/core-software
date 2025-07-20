import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1742225893335 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add name column to asset table (nullable)
    await queryRunner.query(
      `ALTER TABLE asset ADD COLUMN name VARCHAR(255) NULL;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the name column
    await queryRunner.query(`ALTER TABLE asset DROP COLUMN IF EXISTS name;`);
  }
}
