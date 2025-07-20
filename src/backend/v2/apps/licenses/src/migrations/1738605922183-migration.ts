import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738605922183 implements MigrationInterface {
    name = 'Migration1738605922183'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "license" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "licenseKey" character varying NOT NULL,
                "hardwareId" character varying NOT NULL,
                "expiresAtDays" integer NOT NULL,
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "active" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "verified" boolean NOT NULL DEFAULT false,
                "otp" character varying,
                "otpExpiresAt" TIMESTAMP,
                CONSTRAINT "PK_f168ac1ca5ba87286d03b2ef905" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "license"
        `);
    }

}
