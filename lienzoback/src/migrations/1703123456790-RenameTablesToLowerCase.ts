import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTablesToLowerCase1703123456790 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Renombrar tablas de mayúsculas a minúsculas
    await queryRunner.query(`ALTER TABLE "PRODUCTOS" RENAME TO "productos"`);
    await queryRunner.query(`ALTER TABLE "CATEGORIES" RENAME TO "categories"`);
    await queryRunner.query(`ALTER TABLE "REVIEWS" RENAME TO "reviews"`);
    await queryRunner.query(`ALTER TABLE "INGREDIENTS" RENAME TO "ingredients"`);
    
    // Renombrar tabla de relación many-to-many
    await queryRunner.query(`ALTER TABLE "PRODUCTS_INGREDIENTS" RENAME TO "products_ingredients"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir cambios - renombrar de vuelta a mayúsculas
    await queryRunner.query(`ALTER TABLE "productos" RENAME TO "PRODUCTOS"`);
    await queryRunner.query(`ALTER TABLE "categories" RENAME TO "CATEGORIES"`);
    await queryRunner.query(`ALTER TABLE "reviews" RENAME TO "REVIEWS"`);
    await queryRunner.query(`ALTER TABLE "ingredients" RENAME TO "INGREDIENTS"`);
    
    // Revertir tabla de relación many-to-many
    await queryRunner.query(`ALTER TABLE "products_ingredients" RENAME TO "PRODUCTS_INGREDIENTS"`);
  }
}
