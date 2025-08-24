import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDiscountCodesUsedTable1703123456792 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'discount_codes_used',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'used_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'discount_code_id',
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

    // Agregar foreign keys
    await queryRunner.createForeignKey(
      'discount_codes_used',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'discount_codes_used',
      new TableForeignKey({
        columnNames: ['discount_code_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'discount_codes',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'discount_codes_used',
      new TableForeignKey({
        columnNames: ['order_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('discount_codes_used');
  }
}
