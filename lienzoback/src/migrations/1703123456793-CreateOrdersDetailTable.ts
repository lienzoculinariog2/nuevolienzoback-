import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateOrdersDetailTable1703123456793 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const tableExists = await this.tableExists(queryRunner, 'orders_detail');
    
    if (tableExists) {
      console.log('✅ Tabla orders_detail ya existe, saltando creación');
      return;
    }

    console.log('📦 Creando tabla orders_detail...');
    await queryRunner.createTable(
      new Table({
        name: 'orders_detail',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'quantity',
            type: 'int',
          },
          {
            name: 'unit_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'product_id',
            type: 'uuid',
          },
          {
            name: 'order_id',
            type: 'uuid',
          },
        ],
      }),
      true,
    );

    // Agregar foreign keys solo si no existen
    await this.addForeignKeyIfNotExists(queryRunner, 'orders_detail', 'product_id', 'products', 'id');
    await this.addForeignKeyIfNotExists(queryRunner, 'orders_detail', 'order_id', 'orders', 'id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('orders_detail');
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

  private async addForeignKeyIfNotExists(
    queryRunner: QueryRunner, 
    tableName: string, 
    columnName: string, 
    referencedTable: string, 
    referencedColumn: string
  ): Promise<void> {
    try {
      const constraintName = `FK_${tableName}_${columnName}_${referencedTable}`;
      const constraintExists = await this.constraintExists(queryRunner, constraintName);
      
      if (!constraintExists) {
        console.log(`🔗 Agregando foreign key ${constraintName}...`);
        await queryRunner.createForeignKey(
          tableName,
          new TableForeignKey({
            name: constraintName,
            columnNames: [columnName],
            referencedColumnNames: [referencedColumn],
            referencedTableName: referencedTable,
            onDelete: 'CASCADE',
          }),
        );
      } else {
        console.log(`✅ Foreign key ${constraintName} ya existe`);
      }
    } catch (error) {
      console.error(`Error agregando foreign key para ${tableName}.${columnName}:`, error);
    }
  }

  private async constraintExists(queryRunner: QueryRunner, constraintName: string): Promise<boolean> {
    try {
      const result = await queryRunner.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE constraint_name = $1
        )`,
        [constraintName]
      );
      return result[0].exists;
    } catch (error) {
      console.error(`Error verificando existencia de constraint ${constraintName}:`, error);
      return false;
    }
  }
}
