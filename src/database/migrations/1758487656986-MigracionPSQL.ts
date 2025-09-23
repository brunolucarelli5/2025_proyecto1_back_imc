import { MigrationInterface, QueryRunner } from "typeorm";

export class MigracionPSQL1758487656986 implements MigrationInterface {
    name = 'MigracionPSQL1758487656986'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "calculoimc" ("id" SERIAL NOT NULL, "altura" numeric(4,2) NOT NULL, "peso" numeric(6,2) NOT NULL, "imc" numeric(6,2) NOT NULL, "categoria" character varying NOT NULL, "fecha_calculo" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_c7ce6dd5149241d656232e8b3fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "calculoimc" ADD CONSTRAINT "FK_6816b08bdf79ad2260d56d4f68f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calculoimc" DROP CONSTRAINT "FK_6816b08bdf79ad2260d56d4f68f"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "calculoimc"`);
    }

}
