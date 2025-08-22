import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly dataSource: DataSource) {}

  async runMigrations(): Promise<void> {
    try {
      this.logger.log('🔄 Ejecutando migraciones...');
      
      // Verificar si la conexión está establecida
      if (!this.dataSource.isInitialized) {
        this.logger.log('⏳ Inicializando conexión a la base de datos...');
        await this.dataSource.initialize();
      }

      // Ejecutar migraciones pendientes
      const pendingMigrations = await this.dataSource.showMigrations();
      
      if (pendingMigrations) {
        this.logger.log('📦 Migraciones pendientes encontradas, ejecutando...');
        await this.dataSource.runMigrations();
        this.logger.log('✅ Migraciones ejecutadas exitosamente');
      } else {
        this.logger.log('✅ No hay migraciones pendientes');
      }

      // Verificar que la tabla products_ingredients existe
      const tableExists = await this.checkTableExists('products_ingredients');
      if (!tableExists) {
        this.logger.warn('⚠️ La tabla products_ingredients no existe, creándola manualmente...');
        await this.createProductsIngredientsTable();
      }

    } catch (error) {
      this.logger.error('❌ Error ejecutando migraciones:', error);
      throw error;
    }
  }

  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      );
      return result[0].exists;
    } catch (error) {
      this.logger.error(`Error verificando existencia de tabla ${tableName}:`, error);
      return false;
    }
  }

  private async createProductsIngredientsTable(): Promise<void> {
    try {
      // Crear tabla de relación many-to-many entre products e ingredients
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "products_ingredients" (
          "products_id" uuid NOT NULL,
          "ingredients_id" uuid NOT NULL,
          CONSTRAINT "PK_products_ingredients" PRIMARY KEY ("products_id", "ingredients_id")
        )
      `);

      // Crear índices para mejorar rendimiento
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_products_ingredients_products_id" 
        ON "products_ingredients" ("products_id")
      `);

      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_products_ingredients_ingredients_id" 
        ON "products_ingredients" ("ingredients_id")
      `);

      // Agregar foreign keys
      await this.dataSource.query(`
        ALTER TABLE "products_ingredients" 
        ADD CONSTRAINT "FK_products_ingredients_products_id" 
        FOREIGN KEY ("products_id") REFERENCES "products"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);

      await this.dataSource.query(`
        ALTER TABLE "products_ingredients" 
        ADD CONSTRAINT "FK_products_ingredients_ingredients_id" 
        FOREIGN KEY ("ingredients_id") REFERENCES "ingredients"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);

      this.logger.log('✅ Tabla products_ingredients creada exitosamente');
    } catch (error) {
      this.logger.error('❌ Error creando tabla products_ingredients:', error);
      throw error;
    }
  }
}
