import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDiscountCodesTable1703123456791 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const tableExists = await queryRunner.hasTable('discount_codes');
    if (tableExists) {
      console.log('✅ Tabla discount_codes ya existe, saltando creación');
      return;
    }

    console.log('🎫 Creando tabla discount_codes...');

    await queryRunner.createTable(
      new Table({
        name: 'discount_codes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'character varying',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'discount_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'max_uses',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'current_uses',
            type: 'integer',
            default: 0,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'discount_codes',
      new TableIndex({
        name: 'IDX_discount_codes_code',
        columnNames: ['code'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'discount_codes',
      new TableIndex({
        name: 'IDX_discount_codes_active',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createIndex(
      'discount_codes',
      new TableIndex({
        name: 'IDX_discount_codes_expires',
        columnNames: ['expires_at'],
      }),
    );

    console.log('✅ Tabla discount_codes creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Eliminando tabla discount_codes...');
    
    // Eliminar índices
    await queryRunner.dropIndex('discount_codes', 'IDX_discount_codes_expires');
    await queryRunner.dropIndex('discount_codes', 'IDX_discount_codes_active');
    await queryRunner.dropIndex('discount_codes', 'IDX_discount_codes_code');
    
    // Eliminar tabla
    await queryRunner.dropTable('discount_codes');
    
    console.log('✅ Tabla discount_codes eliminada exitosamente');
  }
}
