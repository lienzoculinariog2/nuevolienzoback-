import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscountCodeIdToOrders1703123456796 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Agregando columna discount_code_id a la tabla orders...');
    
    // Verificar si la columna ya existe
    const columnExists = await this.columnExists(queryRunner, 'orders', 'discount_code_id');
    
    if (columnExists) {
      console.log('✅ Columna discount_code_id ya existe en la tabla orders');
      return;
    }

    // Agregar la columna discount_code_id
    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD COLUMN "discount_code_id" uuid NULL
    `);

    // Agregar foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD CONSTRAINT "FK_orders_discount_code_id_discount_codes" 
      FOREIGN KEY ("discount_code_id") 
      REFERENCES "discount_codes"("id") 
      ON DELETE SET NULL
    `);

    console.log('✅ Columna discount_code_id agregada exitosamente a la tabla orders');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revertiendo cambios en la tabla orders...');
    
    // Eliminar foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "orders" 
      DROP CONSTRAINT IF EXISTS "FK_orders_discount_code_id_discount_codes"
    `);

    // Eliminar la columna
    await queryRunner.query(`
      ALTER TABLE "orders" 
      DROP COLUMN IF EXISTS "discount_code_id"
    `);

    console.log('✅ Cambios revertidos exitosamente');
  }

  private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
    try {
      const result = await queryRunner.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
        )`,
        [tableName, columnName]
      );
      return result[0].exists;
    } catch (error) {
      console.error(`Error verificando existencia de columna ${tableName}.${columnName}:`, error);
      return false;
    }
  }
}
