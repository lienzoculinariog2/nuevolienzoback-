const { DataSource } = require('typeorm');
const path = require('path');

// Configuración específica para Render
const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Iniciando migraciones en Render...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [path.join(__dirname, 'dist/**/*.entity.js')],
  migrations: [path.join(__dirname, 'dist/migrations/*.js')],
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: true,
});

async function runRenderMigrations() {
  try {
    console.log('🔄 Conectando a la base de datos de Render...');
    await dataSource.initialize();
    
    console.log('📦 Verificando migraciones pendientes...');
    const pendingMigrations = await dataSource.showMigrations();
    
    if (pendingMigrations) {
      console.log('📦 Ejecutando migraciones pendientes...');
      await dataSource.runMigrations();
      console.log('✅ Migraciones ejecutadas exitosamente');
    } else {
      console.log('✅ No hay migraciones pendientes');
    }

    // Verificar tablas críticas
    console.log('🔍 Verificando tablas críticas...');
    const criticalTables = [
      'discount_codes_used',
      'orders_detail',
      'products_ingredients',
      'payments'
    ];

    for (const tableName of criticalTables) {
      const exists = await checkTableExists(tableName);
      console.log(`📋 Tabla ${tableName}: ${exists ? '✅ Existe' : '❌ No existe'}`);
    }

  } catch (error) {
    console.error('❌ Error ejecutando migraciones en Render:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

async function checkTableExists(tableName) {
  try {
    const result = await dataSource.query(
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

// Ejecutar migraciones
runRenderMigrations();
