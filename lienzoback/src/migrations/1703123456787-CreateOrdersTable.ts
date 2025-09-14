import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOrdersTable1703123456787 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const tableExists = await queryRunner.hasTable('orders');
    if (tableExists) {
      console.log('✅ Tabla orders ya existe, saltando creación');
      return;
    }

    console.log('📦 Creando tabla orders...');

    // Crear enum para OrderStatus
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM (
        'pending',
        'processing', 
        'completed',
        'cancelled',
        'failed'
      )
    `);

    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'date',
            type: 'date',
            default: 'CURRENT_DATE',
          },
          {
            name: 'user_id',
            type: 'character varying',
            isNullable: false,
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'statusOrder',
            type: 'order_status_enum',
            default: "'pending'",
          },
          {
            name: 'shipping_address',
            type: 'character varying',
            isNullable: true,
          },
          {
            name: 'is_paid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'stripe_payment_intent_id',
            type: 'character varying',
            isNullable: true,
          },
          {
            name: 'stripe_charge_id',
            type: 'character varying',
            isNullable: true,
          },
          {
            name: 'payment_status',
            type: 'character varying',
            isNullable: true,
          },
          {
            name: 'discount_code_id',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_orders_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_orders_status',
        columnNames: ['statusOrder'],
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_orders_date',
        columnNames: ['date'],
      }),
    );

    console.log('✅ Tabla orders creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Eliminando tabla orders...');
    
    // Eliminar índices
    await queryRunner.dropIndex('orders', 'IDX_orders_date');
    await queryRunner.dropIndex('orders', 'IDX_orders_status');
    await queryRunner.dropIndex('orders', 'IDX_orders_user_id');
    
    // Eliminar tabla
    await queryRunner.dropTable('orders');
    
    // Eliminar enum
    await queryRunner.query('DROP TYPE "order_status_enum"');
    
    console.log('✅ Tabla orders eliminada exitosamente');
  }
}
