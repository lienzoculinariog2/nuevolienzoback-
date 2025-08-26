import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateProductsTable1703123456790 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const tableExists = await queryRunner.hasTable('products');
    if (tableExists) {
      console.log('✅ Tabla products ya existe, saltando creación');
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'stock',
            type: 'int',
          },
          {
            name: 'imgUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'caloricLevel',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'category_id',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Verificar si la foreign key ya existe antes de crearla
    const table = await queryRunner.getTable('products');
    if (table) {
      const foreignKeyExists = table.foreignKeys.find(fk => fk.columnNames.indexOf('category_id') !== -1);
      
      if (!foreignKeyExists) {
        // Agregar foreign key a categories
        await queryRunner.createForeignKey(
          'products',
          new TableForeignKey({
            columnNames: ['category_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'categories',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          })
        );
        console.log('✅ Foreign key category_id agregada a products');
      }
    }

    console.log('✅ Tabla products creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('products');
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('category_id') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('products', foreignKey);
      }
    }
    await queryRunner.dropTable('products');
  }
}
