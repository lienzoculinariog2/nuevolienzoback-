import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartTables1703123456795 implements MigrationInterface {
  name = 'CreateCartTables1703123456795';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla carts
    await queryRunner.query(`
      CREATE TABLE "carts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "isActive" boolean NOT NULL DEFAULT false,
        "user_id" character varying NOT NULL,
        CONSTRAINT "PK_b5f695a59c5d62540f8c8c7c7c7c" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla cart_items
    await queryRunner.query(`
      CREATE TABLE "cart_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quantity" integer NOT NULL,
        "price" decimal(10,2) NOT NULL,
        "cart_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        CONSTRAINT "PK_cart_items_id" PRIMARY KEY ("id")
      )
    `);

    // Agregar foreign keys
    await queryRunner.query(`
      ALTER TABLE "carts" 
      ADD CONSTRAINT "FK_carts_user_id" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "cart_items" 
      ADD CONSTRAINT "FK_cart_items_cart_id" 
      FOREIGN KEY ("cart_id") 
      REFERENCES "carts"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "cart_items" 
      ADD CONSTRAINT "FK_cart_items_product_id" 
      FOREIGN KEY ("product_id") 
      REFERENCES "products"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    // Crear índices para mejorar performance
    await queryRunner.query(`
      CREATE INDEX "IDX_carts_user_id" ON "carts" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_cart_items_cart_id" ON "cart_items" ("cart_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_cart_items_product_id" ON "cart_items" ("product_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX "IDX_cart_items_product_id"`);
    await queryRunner.query(`DROP INDEX "IDX_cart_items_cart_id"`);
    await queryRunner.query(`DROP INDEX "IDX_carts_user_id"`);

    // Eliminar foreign keys
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_product_id"`);
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_cart_id"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_carts_user_id"`);

    // Eliminar tablas
    await queryRunner.query(`DROP TABLE "cart_items"`);
    await queryRunner.query(`DROP TABLE "carts"`);
  }
}
