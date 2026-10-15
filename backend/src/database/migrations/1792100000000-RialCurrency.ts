import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Switches the store currency from US Dollar to Iranian Rial.
 *
 * Only the column default changes: existing rows keep the currency they were
 * recorded in, which is the honest record of what happened at the time.
 */
export class RialCurrency1792100000000 implements MigrationInterface {
    name = 'RialCurrency1792100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'IRR'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'USD'`);
    }
}
