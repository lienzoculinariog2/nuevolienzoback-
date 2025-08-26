import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateIngredientsTable1703123456789 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const tableExists = await queryRunner.hasTable('ingredients');
    if (tableExists) {
      console.log('✅ Tabla ingredients ya existe, saltando creación');
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'ingredients',
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
            length: '50',
            isUnique: true,
          },
        ],
      }),
      true
    );
    console.log('✅ Tabla ingredients creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ingredients');
  }
}
