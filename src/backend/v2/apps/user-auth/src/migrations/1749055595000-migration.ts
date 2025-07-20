import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1749055595000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Conditionally add uuid column to eula if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'eula'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'eula' AND column_name = 'uuid'
        ) THEN
          ALTER TABLE "eula"
          ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuid_generate_v4();

          CREATE UNIQUE INDEX "IDX_eula_uuid" ON "eula" ("uuid");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
   // Drop uuid column and index if exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'eula' AND column_name = 'uuid'
        ) THEN
          DROP INDEX IF EXISTS "IDX_eula_uuid";
          ALTER TABLE "eula" DROP COLUMN "uuid";
        END IF;
      END $$;
    `);
  }
}
