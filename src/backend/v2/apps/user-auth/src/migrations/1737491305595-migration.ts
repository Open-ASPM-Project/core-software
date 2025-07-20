import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1737491305595 implements MigrationInterface {
  name = 'Migration1737491305595';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255),
                role VARCHAR(255) DEFAULT 'user' NOT NULL,
                user_email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                added_by_uid INTEGER,
                updated_by_uid INTEGER,
                active BOOLEAN DEFAULT TRUE NOT NULL,
                CONSTRAINT fk_added_by FOREIGN KEY (added_by_uid) REFERENCES users(id),
                CONSTRAINT fk_updated_by FOREIGN KEY (updated_by_uid) REFERENCES users(id)
            );
        `);

    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "sso_config" (
                "id" SERIAL PRIMARY KEY,
                "name" character varying NOT NULL,
                "type" character varying NOT NULL,
                "issuer" character varying NOT NULL,
                "authorization_url" character varying NOT NULL,
                "token_url" character varying NOT NULL,
                "user_info_url" character varying NOT NULL,
                "jwks_uri" character varying,
                "client_id" character varying NOT NULL,
                "client_secret" character varying NOT NULL,
                "callback_url" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "added_by_uid" integer,
                "updated_by_uid" integer,
                CONSTRAINT "FK_added_by_uid" FOREIGN KEY ("added_by_uid") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_updated_by_uid" FOREIGN KEY ("updated_by_uid") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "sso_config"
        `);

    await queryRunner.query(`DROP TABLE users;`);
  }
}
