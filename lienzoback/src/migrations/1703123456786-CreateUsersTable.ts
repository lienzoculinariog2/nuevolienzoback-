import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1703123456786 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const tableExists = await queryRunner.hasTable('users');
    if (tableExists) {
      console.log('✅ Tabla users ya existe, saltando creación');
      return;
    }

    console.log('👥 Creando tabla users...');

    // Crear enums
    await queryRunner.query(`
      CREATE TYPE "diet_enum" AS ENUM (
        'general',
        'vegetariano',
        'celiaco',
        'vegano',
        'diabetico'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "roles_enum" AS ENUM (
        'user',
        'admin',
        'banned'
      )
    `);

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'character varying',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'character varying',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'character varying',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password',
            type: 'character varying',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'character varying',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'diet',
            type: 'diet_enum',
            default: "'general'",
          },
          {
            name: 'birthday',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'roles',
            type: 'roles_enum',
            default: "'user'",
          },
          {
            name: 'isSuscribed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'category_id',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_email',
        columnNames: ['email'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_roles',
        columnNames: ['roles'],
      }),
    );

    console.log('✅ Tabla users creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Eliminando tabla users...');
    
    // Eliminar índices
    await queryRunner.dropIndex('users', 'IDX_users_roles');
    await queryRunner.dropIndex('users', 'IDX_users_email');
    
    // Eliminar tabla
    await queryRunner.dropTable('users');
    
    // Eliminar enums
    await queryRunner.query('DROP TYPE "roles_enum"');
    await queryRunner.query('DROP TYPE "diet_enum"');
    
    console.log('✅ Tabla users eliminada exitosamente');
  }
}
