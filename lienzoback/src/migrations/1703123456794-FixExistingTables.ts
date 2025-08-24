import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixExistingTables1703123456794 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Verificando y corrigiendo tablas existentes...');

    // Verificar si la tabla discount_codes_used existe
    const discountTableExists = await this.tableExists(queryRunner, 'discount_codes_used');
    
    if (discountTableExists) {
      console.log('✅ Tabla discount_codes_used ya existe');
      
      // Verificar si falta la columna used_at
      const usedAtColumnExists = await this.columnExists(queryRunner, 'discount_codes_used', 'used_at');
      
      if (!usedAtColumnExists) {
        console.log('➕ Agregando columna used_at a discount_codes_used');
        await queryRunner.query(`
          ALTER TABLE "discount_codes_used" 
          ADD COLUMN "used_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
      } else {
        console.log('✅ Columna used_at ya existe en discount_codes_used');
      }
    } else {
      console.log('❌ Tabla discount_codes_used no existe - se creará en otra migración');
    }

    // Verificar si la tabla orders_detail existe
    const ordersDetailTableExists = await this.tableExists(queryRunner, 'orders_detail');
    
    if (ordersDetailTableExists) {
      console.log('✅ Tabla orders_detail ya existe');
    } else {
      console.log('❌ Tabla orders_detail no existe - se creará en otra migración');
    }

    // Verificar si la tabla products_ingredients existe
    const productsIngredientsTableExists = await this.tableExists(queryRunner, 'products_ingredients');
    
    if (productsIngredientsTableExists) {
      console.log('✅ Tabla products_ingredients ya existe');
    } else {
      console.log('❌ Tabla products_ingredients no existe - se creará en otra migración');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No hacer nada en down ya que solo estamos verificando y corrigiendo
    console.log('🔄 Down migration: No action needed');
  }

  private async tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    try {
      const result = await queryRunner.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      );
      return result[0].exists;
    } catch (error) {
      console.error(`Error verificando existencia de tabla ${tableName}:`, error);
      return false;
    }
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
      console.error(`Error verificando existencia de columna ${columnName} en ${tableName}:`, error);
      return false;
    }
  }
}
