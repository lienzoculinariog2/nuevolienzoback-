import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePaymentEntity1703123456789 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_provider enum
    await queryRunner.query(`
      CREATE TYPE "payment_provider_enum" AS ENUM ('stripe', 'paypal', 'mercadopago')
    `);

    // Create payment_type enum
    await queryRunner.query(`
      CREATE TYPE "payment_type_enum" AS ENUM ('payment', 'refund', 'partial_refund')
    `);

    // Create payment_status enum
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM (
        'pending',
        'processing',
        'succeeded',
        'failed',
        'canceled',
        'requires_action',
        'requires_confirmation',
        'requires_payment_method'
      )
    `);

    // Create payments table
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'orderId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'payment_provider_enum',
            default: "'stripe'",
          },
          {
            name: 'type',
            type: 'payment_type_enum',
            default: "'payment'",
          },
          {
            name: 'status',
            type: 'payment_status_enum',
            default: "'pending'",
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'refundedAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'usd'",
          },
          {
            name: 'stripePaymentIntentId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'stripeChargeId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'stripeRefundId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'customerEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'errorDetails',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'idempotencyKey',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'processedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_stripe_payment_intent_id',
        columnNames: ['stripePaymentIntentId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_order_id',
        columnNames: ['orderId'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_idempotency_key',
        columnNames: ['idempotencyKey', 'orderId'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        name: 'FK_payments_orders',
        columnNames: ['orderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('payments', 'FK_payments_orders');

    // Drop indexes
    await queryRunner.dropIndex('payments', 'IDX_payments_stripe_payment_intent_id');
    await queryRunner.dropIndex('payments', 'IDX_payments_order_id');
    await queryRunner.dropIndex('payments', 'IDX_payments_status');
    await queryRunner.dropIndex('payments', 'IDX_payments_idempotency_key');

    // Drop table
    await queryRunner.dropTable('payments');

    // Drop enums
    await queryRunner.query('DROP TYPE "payment_status_enum"');
    await queryRunner.query('DROP TYPE "payment_type_enum"');
    await queryRunner.query('DROP TYPE "payment_provider_enum"');
  }
}
