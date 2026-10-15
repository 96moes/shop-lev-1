import type { MigrationInterface, QueryRunner } from "typeorm";

export class AuthAndOrderFields1792054213117 implements MigrationInterface {
    name = 'AuthAndOrderFields1792054213117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "refreshTokenHash" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "refreshTokenIssuedAt" TIMESTAMP WITH TIME ZONE`);

        // Added with a default so existing order rows satisfy NOT NULL; the
        // default is then dropped so new rows must supply a real address.
        await queryRunner.query(`ALTER TABLE "orders" ADD "shippingFullName" character varying(100) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shippingPhone" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shippingLine1" character varying(255) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shippingLine2" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shippingCity" character varying(120) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shippingState" character varying(120)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shippingPostalCode" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shippingCountry" character varying(2) NOT NULL DEFAULT 'US'`);

        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shippingFullName" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shippingLine1" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shippingCity" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shippingCountry"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shippingPostalCode"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shippingState"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shippingCity"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shippingLine2"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shippingLine1"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shippingPhone"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shippingFullName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshTokenIssuedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshTokenHash"`);
    }

}
