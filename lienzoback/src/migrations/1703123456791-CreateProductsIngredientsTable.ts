import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsIngredientsTable1703123456791 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const tableExists = await queryRunner.hasTable('products_ingredients');
    if (tableExists) {
      console.log('✅ Tabla products_ingredients ya existe, saltando creación');
      return;
    }

    // Crear tabla de relación many-to-many entre products e ingredients
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products_ingredients" (
        "products_id" uuid NOT NULL,
        "ingredients_id" uuid NOT NULL,
        CONSTRAINT "PK_products_ingredients" PRIMARY KEY ("products_id", "ingredients_id")
      )
    `);

    // Crear índices para mejorar rendimiento
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_ingredients_products_id" 
      ON "products_ingredients" ("products_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_ingredients_ingredients_id" 
      ON "products_ingredients" ("ingredients_id")
    `);

    // Verificar si las foreign keys ya existen antes de crearlas
    try {
      await queryRunner.query(`
        ALTER TABLE "products_ingredients" 
        ADD CONSTRAINT "FK_products_ingredients_products_id" 
        FOREIGN KEY ("products_id") REFERENCES "products"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log('✅ Foreign key FK_products_ingredients_products_id agregada');
    } catch (error) {
      console.log('⚠️ Foreign key FK_products_ingredients_products_id ya existe');
    }

    try {
      await queryRunner.query(`
        ALTER TABLE "products_ingredients" 
        ADD CONSTRAINT "FK_products_ingredients_ingredients_id" 
        FOREIGN KEY ("ingredients_id") REFERENCES "ingredients"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log('✅ Foreign key FK_products_ingredients_ingredients_id agregada');
    } catch (error) {
      console.log('⚠️ Foreign key FK_products_ingredients_ingredients_id ya existe');
    }

    console.log('✅ Tabla products_ingredients creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(`
      ALTER TABLE "products_ingredients" 
      DROP CONSTRAINT IF EXISTS "FK_products_ingredients_ingredients_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "products_ingredients" 
      DROP CONSTRAINT IF EXISTS "FK_products_ingredients_products_id"
    `);

    // Eliminar índices
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_products_ingredients_ingredients_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_products_ingredients_products_id"
    `);

    // Eliminar tabla
    await queryRunner.query(`
      DROP TABLE IF EXISTS "products_ingredients"
    `);
  }
}
